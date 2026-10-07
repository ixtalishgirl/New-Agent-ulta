// Vercel serverless (consolidated): /api/terminal/*
// Sub-routes: POST /api/terminal/exec (also accepts '' for the base path)
// Body: { command: string, type?: 'bash'|'python', timeout?: number }
// Always returns valid JSON, never hangs.

import { exec } from 'child_process';

function getSub(req: any): string {
  const q = req.query || {};
  if (q.sub) return String(q.sub).replace(/^\/+|\/+$/g, '');
  try {
    const u = new URL(req.url || '/', 'http://localhost');
    const p = u.pathname.replace(/\/+$/, '');
    if (p === '/api/terminal' || p === '/api/terminal/') return '';
    if (p.startsWith('/api/terminal/')) return p.slice('/api/terminal/'.length);
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

function runCmd(cmd: string, timeoutMs: number): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    exec(
      cmd,
      { shell: '/bin/bash', timeout: timeoutMs, maxBuffer: 4 * 1024 * 1024 },
      (error: any, stdout: any, stderr: any) => {
        resolve({
          stdout: stdout ? stdout.toString().slice(0, 50000) : '',
          stderr: stderr ? stderr.toString().slice(0, 50000) : (error ? String(error.message).slice(0, 2000) : ''),
          exitCode: typeof error?.code === 'number' ? error.code : (error ? 1 : 0),
        });
      }
    );
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).json({ success: true });
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Use POST.' });
  }

  const body = parseBody(req);
  const command = (body?.command || '').toString();
  const type = (body?.type || 'bash').toString();
  const timeout = Math.max(1000, Math.min(Number(body?.timeout) || 25000, 55000));

  if (!command.trim()) {
    return res.status(400).json({ success: false, error: 'command required' });
  }

  const start = Date.now();
  try {
    const cmd = type === 'python' ? `python3 -c ${JSON.stringify(command)}` : command;
    const r = await runCmd(cmd, timeout);
    return res.status(200).json({
      success: r.exitCode === 0,
      stdout: r.stdout,
      stderr: r.stderr,
      exitCode: r.exitCode,
      durationMs: Date.now() - start,
    });
  } catch (e: any) {
    return res.status(200).json({
      success: false,
      stdout: '',
      stderr: e?.message || 'exec failed',
      exitCode: 1,
      durationMs: Date.now() - start,
    });
  }
}
