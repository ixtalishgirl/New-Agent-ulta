// Vercel serverless: POST /api/agent/tools/execute-bash
// Body: { cmd: string }
// Returns { success, stdout, stderr, exitCode, durationMs } - always valid JSON.

import { exec } from 'child_process';

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
  const cmd = (body?.cmd || '').toString();
  if (!cmd.trim()) return res.status(400).json({ success: false, error: 'cmd string is required' });

  const start = Date.now();
  const out: { stdout: string; stderr: string; exitCode: number } = await new Promise((resolve) => {
    exec(cmd, { shell: '/bin/bash', timeout: 45000, maxBuffer: 4 * 1024 * 1024 }, (error: any, stdout: any, stderr: any) => {
      resolve({
        stdout: stdout ? stdout.toString().slice(0, 50000) : '',
        stderr: stderr ? stderr.toString().slice(0, 50000) : (error ? String(error.message).slice(0, 2000) : ''),
        exitCode: typeof error?.code === 'number' ? error.code : (error ? 1 : 0),
      });
    });
  });

  return res.status(200).json({
    success: out.exitCode === 0,
    stdout: out.stdout,
    stderr: out.stderr,
    exitCode: out.exitCode,
    durationMs: Date.now() - start,
  });
}
