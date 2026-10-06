// Vercel serverless: POST /api/terminal/exec
// Body: { command: string, type?: 'bash'|'python', timeout?: number }
// Returns { success, stdout, stderr, exitCode, durationMs } - always valid JSON.
// Note: serverless has ~10s execution limit; long commands will time out.

import { exec } from 'child_process';

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

  let body: any = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
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
