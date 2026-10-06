// Vercel serverless: POST /api/agent/tools/run-pip
// Body: { package_name: string }
// Note: pip installs do NOT persist on Vercel serverless (ephemeral filesystem).
// Returns { success, stdout, stderr, exitCode } - always valid JSON.

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
  const package_name = (body?.package_name || '').toString().trim().replace(/['";&$|`]/g, '');
  if (!package_name) return res.status(400).json({ success: false, error: 'package_name is required' });

  const start = Date.now();
  const cmd = `python3 -m pip install --quiet ${package_name} 2>&1 | tail -20`;
  const out: { stdout: string; stderr: string; exitCode: number } = await new Promise((resolve) => {
    exec(cmd, { shell: '/bin/bash', timeout: 55000, maxBuffer: 4 * 1024 * 1024 }, (error: any, stdout: any, stderr: any) => {
      resolve({
        stdout: stdout ? stdout.toString().slice(0, 20000) : '',
        stderr: stderr ? stderr.toString().slice(0, 5000) : '',
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
    note: 'Serverless: installs do not persist between requests.',
    data: { package: package_name },
  });
}
