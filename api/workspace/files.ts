// Vercel serverless: GET /api/workspace/files?path=
// Lists files in /tmp/halye-workspace (serverless writable). Always valid JSON.

import { readdirSync, statSync } from 'fs';
import { join, resolve, sep } from 'path';
import { tmpdir } from 'os';
import { mkdirSync } from 'fs';

const ROOT = join(tmpdir(), 'halye-workspace');
try { mkdirSync(ROOT, { recursive: true }); } catch {}

function safePath(p: string): string {
  const rel = (p || '').toString().replace(/\.\./g, '');
  const full = resolve(ROOT, rel);
  if (!full.startsWith(ROOT + sep) && full !== ROOT) return ROOT;
  return full;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const dir = safePath(req.query?.path || '');
  try {
    const entries = readdirSync(dir);
    const files = entries.slice(0, 200).map((name) => {
      const full = join(dir, name);
      let isDir = false, size = 0;
      try { const s = statSync(full); isDir = s.isDirectory(); size = s.size; } catch {}
      return { name, path: full.replace(ROOT, '').replace(/^\//, '') || name, isDirectory: isDir, size };
    });
    return res.status(200).json({ success: true, files, path: dir.replace(ROOT, '') || '/', note: 'Serverless: /tmp only, ephemeral.' });
  } catch (e: any) {
    return res.status(200).json({ success: false, error: e?.message || 'list failed', files: [] });
  }
}
