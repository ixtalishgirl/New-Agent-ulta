// Vercel serverless (consolidated): /api/workspace/*
// Sub-routes:
//   GET  /api/workspace/files?path=      -> list files in /tmp/halye-workspace
//   POST /api/workspace/file-save        -> save file { path, content }
//   POST /api/workspace/file-create     -> create file/dir { path, content?, type? }
// Always returns valid JSON, never hangs. Note: /tmp is ephemeral on serverless.

import { readdirSync, statSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve, sep, dirname } from 'path';
import { tmpdir } from 'os';

const ROOT = join(tmpdir(), 'halye-workspace');
try { mkdirSync(ROOT, { recursive: true }); } catch {}

function getSub(req: any): string {
  const q = req.query || {};
  if (q.sub) return String(q.sub).replace(/^\/+|\/+$/g, '');
  try {
    const u = new URL(req.url || '/', 'http://localhost');
    const p = u.pathname.replace(/\/+$/, '');
    if (p === '/api/workspace' || p === '/api/workspace/') return '';
    if (p.startsWith('/api/workspace/')) return p.slice('/api/workspace/'.length);
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

// For listing: tolerant (returns ROOT on bad input). For writes: strict (throws).
function safeDir(p: string): string {
  const rel = (p || '').toString().replace(/\.\./g, '');
  const full = resolve(ROOT, rel);
  if (!full.startsWith(ROOT + sep) && full !== ROOT) return ROOT;
  return full;
}

function safeFilePath(p: string): string {
  const rel = (p || '').toString().replace(/\.\./g, '').replace(/^\/+/, '');
  if (!rel) throw new Error('path required');
  const full = resolve(ROOT, rel);
  if (!full.startsWith(ROOT + sep)) throw new Error('invalid path');
  return full;
}

async function handleFiles(req: any, res: any) {
  const dir = safeDir(req.query?.path || '');
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

async function handleFileSave(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Use POST.' });
  const body = parseBody(req);
  try {
    const full = safeFilePath(body?.path || '');
    const content = (body?.content ?? '').toString().slice(0, 500000);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content, 'utf-8');
    return res.status(200).json({ success: true, path: body.path, bytes: content.length });
  } catch (e: any) {
    return res.status(400).json({ success: false, error: e?.message || 'save failed' });
  }
}

async function handleFileCreate(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Use POST.' });
  const body = parseBody(req);
  try {
    const full = safeFilePath(body?.path || '');
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

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).json({ success: true });

  const sub = getSub(req);

  if (sub === '' || sub === 'files') return handleFiles(req, res);
  if (sub === 'file-save') return handleFileSave(req, res);
  if (sub === 'file-create') return handleFileCreate(req, res);

  return res.status(404).json({
    success: false,
    error: `Unknown workspace route: '${sub}'. Use files, file-save, or file-create.`,
  });
}
