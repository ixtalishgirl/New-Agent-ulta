// Vercel serverless (consolidated): /api/agent/tools/*
// Sub-routes (via ?sub= rewrite or pathname suffix):
//   GET  /api/agent/tools            -> list registered custom tools
//   POST /api/agent/tools/create     -> create a custom tool { name, description?, code, runtime? }
//   POST /api/agent/tools/execute    -> execute a registered tool { toolId|tool_name|name, inputParams? }
//   POST /api/agent/tools/execute-bash -> run raw bash { cmd }
//   POST /api/agent/tools/run-pip    -> pip install { package_name }
//   POST /api/agent/tools/run-python -> run python { code?, script_path? }
//   POST /api/agent/tools/playwright -> fetch-based page inspection { url }
// Always returns valid JSON, never hangs.

import { exec } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import vm from 'vm';

// ---- Inlined shared tool store (was api/agent/tools/_store.ts) ----
// In-memory per serverless instance; tools persist only while warm.

interface CustomTool {
  id: string;
  name: string;
  description: string;
  runtime: 'javascript' | 'python' | 'bash';
  code: string;
  createdAt: string;
  invocationsCount: number;
}

const g: any = globalThis as any;
if (!g.__halyeTools) g.__halyeTools = [];

function getStore(): CustomTool[] {
  return g.__halyeTools as CustomTool[];
}

function addTool(t: CustomTool): void {
  const store = getStore();
  const idx = store.findIndex((x) => x.name.toLowerCase() === t.name.toLowerCase());
  if (idx >= 0) store.splice(idx, 1);
  store.unshift(t);
}

function findTool(idOrName: string): CustomTool | undefined {
  const w = String(idOrName).toLowerCase();
  return getStore().find((t) => t.id === idOrName || t.name.toLowerCase() === w || t.id.toLowerCase() === w);
}

function normalizeRuntime(r: any): 'javascript' | 'python' | 'bash' {
  const v = String(r || 'javascript').toLowerCase();
  if (v.includes('py')) return 'python';
  if (v.includes('bash') || v.includes('sh')) return 'bash';
  return 'javascript';
}

// ---- Shared helpers ----

function getSub(req: any): string {
  const q = req.query || {};
  if (q.sub) return String(q.sub).replace(/^\/+|\/+$/g, '');
  try {
    const u = new URL(req.url || '/', 'http://localhost');
    const p = u.pathname.replace(/\/+$/, '');
    const prefixes = ['/api/agent/tools', '/api/tools'];
    for (const prefix of prefixes) {
      if (p === prefix || p === prefix + '/') return '';
      if (p.startsWith(prefix + '/')) return p.slice(prefix.length + 1);
    }
  } catch {}
  return '';
}

function parseBody(req: any): any {
  let body: any = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  return body || {};
}

function sh(cmd: string, timeoutMs: number): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    exec(cmd, { shell: '/bin/bash', timeout: timeoutMs, maxBuffer: 4 * 1024 * 1024 }, (error: any, stdout: any, stderr: any) => {
      resolve({
        stdout: stdout ? stdout.toString().slice(0, 50000) : '',
        stderr: stderr ? stderr.toString().slice(0, 50000) : (error ? String(error.message).slice(0, 2000) : ''),
        exitCode: typeof error?.code === 'number' ? error.code : (error ? 1 : 0),
      });
    });
  });
}

// ---- Route handlers ----

async function handleList(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Use GET.' });
  const tools = getStore();
  return res.status(200).json({ success: true, tools, totalCreated: tools.length });
}

function checkPythonSyntax(code: string): Promise<{ ok: boolean; err: string }> {
  return new Promise((resolve) => {
    const proc = exec(`python3 -c ${JSON.stringify(`import ast,sys;src=sys.stdin.read();ast.parse(src)`)}`, { timeout: 10000 }, (error: any, _o: any, stderr: any) => {
      if (error) resolve({ ok: false, err: stderr?.toString().slice(0, 500) || error.message });
      else resolve({ ok: true, err: '' });
    });
    proc.stdin?.write(code);
    proc.stdin?.end();
  });
}

async function handleCreate(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Use POST.' });

  const body = parseBody(req);
  const name = (body?.name || '').toString().trim();
  const code = (body?.code || '').toString();
  const description = (body?.description || 'Agent self-created tool').toString();
  const runtime = normalizeRuntime(body?.runtime || body?.language);

  if (!name || !code) {
    return res.status(400).json({ success: false, error: 'name and code are required' });
  }
  if (!/^[a-zA-Z0-9_\- ]{2,60}$/.test(name)) {
    return res.status(400).json({ success: false, error: 'name: 2-60 chars, letters/numbers/_/- only' });
  }

  if (runtime === 'javascript') {
    try {
      new vm.Script(code, { filename: `${name}.js` });
    } catch (e: any) {
      return res.status(400).json({ success: false, error: `JavaScript syntax error: ${e.message}`, runtime });
    }
  } else if (runtime === 'python') {
    const chk = await checkPythonSyntax(code);
    if (!chk.ok) {
      return res.status(400).json({ success: false, error: `Python syntax error: ${chk.err}`, runtime });
    }
  }

  const tool: CustomTool = {
    id: 'tool_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4),
    name,
    description,
    runtime,
    code,
    createdAt: new Date().toISOString(),
    invocationsCount: 0,
  };
  addTool(tool);

  return res.status(200).json({
    success: true,
    message: `Tool "${name}" created (${runtime}, syntax verified)`,
    tool,
  });
}

async function handleExecute(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Use POST.' });

  const body = parseBody(req);
  const idOrName = body?.toolId || body?.tool_name || body?.name || body?.id;
  if (!idOrName) return res.status(400).json({ success: false, error: 'Provide toolId, tool_name, or name' });

  const tool = findTool(String(idOrName));
  if (!tool) return res.status(404).json({ success: false, error: `Tool '${idOrName}' not found` });

  tool.invocationsCount += 1;
  const input = body?.inputParams || body?.arguments || body?.args || {};
  const start = Date.now();

  try {
    if (tool.runtime === 'javascript') {
      const logs: string[] = [];
      const sandbox: any = {
        console: {
          log: (...a: any[]) => logs.push(a.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join(' ')),
          error: (...a: any[]) => logs.push('[error] ' + a.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join(' ')),
        },
        input,
        result: undefined,
      };
      const ctx = vm.createContext(sandbox);
      new vm.Script(`${tool.code}\nif (typeof run === 'function') { result = run(input); }`, { filename: `${tool.name}.js` })
        .runInContext(ctx, { timeout: 8000 });
      return res.status(200).json({
        success: true,
        result: sandbox.result,
        logs,
        durationMs: Date.now() - start,
        tool: tool.name,
      });
    }

    const ext = tool.runtime === 'python' ? '.py' : '.sh';
    const tmp = join(tmpdir(), `halye_tool_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
    writeFileSync(tmp, tool.runtime === 'bash' ? `#!/bin/bash\n${tool.code}` : tool.code, 'utf-8');
    const inputJson = JSON.stringify(input);
    const cmd = tool.runtime === 'python'
      ? `printf '%s' ${JSON.stringify(inputJson)} | python3 "${tmp}"`
      : `printf '%s' ${JSON.stringify(inputJson)} | bash "${tmp}"`;
    const r = await sh(cmd, 45000);
    try { unlinkSync(tmp); } catch {}
    return res.status(200).json({
      success: r.exitCode === 0,
      stdout: r.stdout,
      stderr: r.stderr,
      exitCode: r.exitCode,
      durationMs: Date.now() - start,
      tool: tool.name,
    });
  } catch (e: any) {
    return res.status(200).json({
      success: false,
      error: e?.message || 'execution failed',
      durationMs: Date.now() - start,
      tool: tool.name,
    });
  }
}

async function handleExecuteBash(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Use POST.' });

  const body = parseBody(req);
  const cmd = (body?.cmd || '').toString();
  if (!cmd.trim()) return res.status(400).json({ success: false, error: 'cmd string is required' });

  const start = Date.now();
  const out = await sh(cmd, 45000);

  return res.status(200).json({
    success: out.exitCode === 0,
    stdout: out.stdout,
    stderr: out.stderr,
    exitCode: out.exitCode,
    durationMs: Date.now() - start,
  });
}

async function handleRunPip(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Use POST.' });

  const body = parseBody(req);
  const package_name = (body?.package_name || '').toString().trim().replace(/['\";&$|`]/g, '');
  if (!package_name) return res.status(400).json({ success: false, error: 'package_name is required' });

  const start = Date.now();
  const out = await sh(`python3 -m pip install --quiet ${package_name} 2>&1 | tail -20`, 55000);

  return res.status(200).json({
    success: out.exitCode === 0,
    stdout: out.stdout.slice(0, 20000),
    stderr: out.stderr.slice(0, 5000),
    exitCode: out.exitCode,
    durationMs: Date.now() - start,
    note: 'Serverless: installs do not persist between requests.',
    data: { package: package_name },
  });
}

async function handleRunPython(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Use POST.' });

  const body = parseBody(req);
  const code = (body?.code || '').toString();
  const script_path = (body?.script_path || '').toString();
  if (!code && !script_path) {
    return res.status(400).json({ success: false, error: 'Either code or script_path is required' });
  }

  const start = Date.now();
  let target = script_path;
  let tmpFile = '';

  if (code) {
    tmpFile = join(tmpdir(), `halye_${Date.now()}_${Math.random().toString(36).slice(2)}.py`);
    try {
      writeFileSync(tmpFile, code, 'utf-8');
      target = tmpFile;
    } catch (e: any) {
      return res.status(200).json({ success: false, stdout: '', stderr: e?.message || 'write failed', exitCode: 1, durationMs: Date.now() - start });
    }
  } else if (!existsSync(target)) {
    return res.status(200).json({ success: false, stdout: '', stderr: `Script not found: ${script_path}`, exitCode: 1, durationMs: Date.now() - start });
  }

  const out = await sh(`python3 "${target}"`, 45000);
  if (tmpFile) { try { unlinkSync(tmpFile); } catch {} }

  return res.status(200).json({
    success: out.exitCode === 0,
    stdout: out.stdout,
    stderr: out.stderr,
    exitCode: out.exitCode,
    durationMs: Date.now() - start,
  });
}

async function handlePlaywright(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Use POST.' });

  const body = parseBody(req);
  const target = (body?.url || body?.url_or_script || '').toString().trim();
  if (!target || !/^https?:\/\//i.test(target)) {
    return res.status(400).json({ success: false, error: 'Valid http(s) url required' });
  }

  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  try {
    const r = await fetch(target, {
      signal: controller.signal,
      headers: { 'User-Agent': 'HalyeBot/1.0' },
    });
    clearTimeout(timer);
    const html = await r.text();
    const title = (html.match(/<title[^>]*>([^<]*)/i)?.[1] || '').trim().slice(0, 200);
    const buttons = (html.match(/<button/gi) || []).length;
    const inputs = (html.match(/<input|<textarea|<select/gi) || []).length;
    const links = (html.match(/<a\s/gi) || []).length;

    return res.status(200).json({
      success: r.ok,
      stdout: `Fetched ${target} (HTTP ${r.status})`,
      stderr: r.ok ? '' : `HTTP ${r.status}`,
      exitCode: r.ok ? 0 : 1,
      durationMs: Date.now() - start,
      data: {
        url: target,
        httpStatus: r.status,
        title,
        buttons,
        inputs,
        links,
        htmlBytes: html.length,
        note: 'Serverless fallback: full Playwright browser automation needs a persistent server.',
      },
    });
  } catch (e: any) {
    clearTimeout(timer);
    return res.status(200).json({
      success: false,
      stdout: '',
      stderr: e?.message || 'fetch failed',
      exitCode: 1,
      durationMs: Date.now() - start,
    });
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true });
  }

  const sub = getSub(req);

  if (sub === '') return handleList(req, res);
  if (sub === 'create') return handleCreate(req, res);
  if (sub === 'execute') return handleExecute(req, res);
  if (sub === 'execute-bash') return handleExecuteBash(req, res);
  if (sub === 'run-pip') return handleRunPip(req, res);
  if (sub === 'run-python') return handleRunPython(req, res);
  if (sub === 'playwright') return handlePlaywright(req, res);

  return res.status(404).json({
    success: false,
    error: `Unknown tools route: '${sub}'.`,
  });
}
