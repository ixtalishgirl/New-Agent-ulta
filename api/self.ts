// Vercel serverless (consolidated): /api/self/*
// Sub-routes:
//   GET  /api/self/status        -> engine status
//   GET/POST /api/self/theme     -> theme state
//   POST /api/self/theme/rollback -> rollback theme
// Always returns valid JSON, never hangs.

const g: any = globalThis as any;
if (!g.__theme) g.__theme = { accent: 'cyan', mode: 'dark' };

function getSub(req: any): string {
  const q = req.query || {};
  if (q.sub) return String(q.sub).replace(/^\/+|\/+$/g, '');
  try {
    const u = new URL(req.url || '/', 'http://localhost');
    const p = u.pathname.replace(/\/+$/, '');
    if (p === '/api/self' || p === '/api/self/') return '';
    if (p.startsWith('/api/self/')) return p.slice('/api/self/'.length);
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

async function handleStatus(req: any, res: any) {
  return res.status(200).json({
    success: true,
    status: 'active',
    version: '2.0',
    engine: 'haley-v2',
    platform: 'vercel-serverless',
  });
}

async function handleTheme(req: any, res: any) {
  if (req.method === 'POST') {
    const body = parseBody(req);
    g.__themePrev = { ...g.__theme };
    if (body?.accent) g.__theme.accent = String(body.accent).slice(0, 30);
    if (body?.mode) g.__theme.mode = String(body.mode).slice(0, 30);
  }
  return res.status(200).json({ success: true, theme: g.__theme });
}

async function handleThemeRollback(req: any, res: any) {
  if (g.__themePrev) {
    g.__theme = { ...g.__themePrev };
    return res.status(200).json({ success: true, theme: g.__theme, rolledBack: true });
  }
  return res.status(200).json({ success: true, theme: g.__theme || { accent: 'cyan', mode: 'dark' }, rolledBack: false });
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).json({ success: true });

  const sub = getSub(req);

  if (sub === 'status') return handleStatus(req, res);
  if (sub === 'theme') return handleTheme(req, res);
  if (sub === 'theme/rollback') return handleThemeRollback(req, res);

  return res.status(404).json({
    success: false,
    error: `Unknown self route: '${sub}'. Use status, theme, or theme/rollback.`,
  });
}
