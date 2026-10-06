// Vercel serverless: POST /api/workspace/file-create
// Body: { path: string, content?: string, type?: 'file'|'dir' }
// Creates a file or directory under /tmp/halye-workspace. Always valid JSON.

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve, sep, dirname } from 'path';
import { tmpdir } from 'os';

const ROOT = join(tmpdir(), 'halye-workspace');

function safePath(p: string): string {
  const rel = (p || '').toString().replace(/\.\./g, '').replace(/^\/+/, '');
  if (!rel) throw new Error('path required');
  const full = resolve(ROOT, rel);
  if (!full.startsWith(ROOT + sep)) throw new Error('invalid path');
  return full;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).json({ success: true });
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Use POST.' });

  let body: any = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }

  try {
    const full = safePath(body?.path || '');
    if (body?.type === 'dir') {
      mkdirSync(full, { recursive: true });
    } else {
      if (existsSync(full)) return res.status(400).json({ success: false, error: 'File already exists' });
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, (body?.content || '').toString().slice(0, 500000), 'utf-8');
    }
    return res.status(200).json({ success: true, path: body.path });
  } catch (e: any) {
    return res.status(400).json({ success: false, error: e?.message || 'create failed' });
  }
}
