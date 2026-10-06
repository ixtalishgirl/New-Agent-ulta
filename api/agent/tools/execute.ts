// Vercel serverless: POST /api/agent/tools/execute
// Body: { toolId|tool_name|name, inputParams?|arguments?|args? }
// Executes a registered custom tool. Returns { success, stdout/stderr or result } - always valid JSON.

import { findTool } from './_store';
import { exec } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import vm from 'vm';

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

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).json({ success: true });
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Use POST.' });

  let body: any = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
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

    // python / bash: write to temp file and execute
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
