// Vercel serverless (consolidated): /api/model/*
// Sub-routes (via ?sub= rewrite or pathname suffix):
//   POST /api/model/chat   -> forwards chat prompt to HALEY_API_URL /generate
//   GET  /api/model/test   -> pings HALEY_API_URL root
//   GET  /api/model/status -> model info
// Always returns valid JSON, never hangs.

function getSub(req: any): string {
  const q = req.query || {};
  if (q.sub) return String(q.sub).replace(/^\/+|\/+$/g, '');
  try {
    const u = new URL(req.url || '/', 'http://localhost');
    const p = u.pathname.replace(/\/+$/, '');
    if (p === '/api/model' || p === '/api/model/') return '';
    if (p.startsWith('/api/model/')) return p.slice('/api/model/'.length);
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

async function handleChat(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  const baseUrl = (process.env.HALEY_API_URL || '').trim().replace(/\/+$/, '');
  if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) {
    return res.status(400).json({
      success: false,
      error: 'HALEY_API_URL set karo — model API configured nahi hai.',
    });
  }

  const body = parseBody(req);
  const prompt = (body?.prompt || '').toString().trim();
  const max_tokens = Math.max(16, Math.min(Number(body?.max_tokens) || 512, 2048));

  if (!prompt) {
    return res.status(400).json({ success: false, error: 'prompt khaali hai.' });
  }

  const target = `${baseUrl}/generate`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);

  try {
    const r = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, max_tokens }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const text = await r.text();
    if (!r.ok) {
      return res.status(502).json({
        success: false,
        error: `Model API error (HTTP ${r.status}): ${text.slice(0, 300)}`,
      });
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({ success: false, error: 'Model ne invalid JSON bheja.' });
    }

    const response = (data.response ?? data.text ?? data.output ?? '').toString();
    return res.status(200).json({ success: true, response });
  } catch (e: any) {
    clearTimeout(timer);
    const msg = e?.name === 'AbortError' ? 'Model timeout (120s).' : (e?.message || 'Fetch failed');
    return res.status(502).json({ success: false, error: `Model API unreachable: ${msg}` });
  }
}

async function handleTest(req: any, res: any) {
  const baseUrl = (process.env.HALEY_API_URL || '').trim().replace(/\/+$/, '');
  if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) {
    return res.status(200).json({
      success: true,
      alive: false,
      configured: false,
      error: 'HALEY_API_URL set karo.',
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  const start = Date.now();

  try {
    const r = await fetch(baseUrl + '/', { signal: controller.signal });
    clearTimeout(timer);
    const text = await r.text();
    return res.status(200).json({
      success: true,
      alive: r.ok,
      configured: true,
      latencyMs: Date.now() - start,
      status: r.status,
      body: text.slice(0, 200),
      url: baseUrl,
    });
  } catch (e: any) {
    clearTimeout(timer);
    return res.status(200).json({
      success: true,
      alive: false,
      configured: true,
      latencyMs: Date.now() - start,
      error: e?.message || 'unreachable',
      url: baseUrl,
    });
  }
}

async function handleStatus(req: any, res: any) {
  const url = (process.env.HALEY_API_URL || '').trim();
  const configured = /^https?:\/\//i.test(url);

  return res.status(200).json({
    success: true,
    status: configured ? 'configured' : 'not_configured',
    provider: 'custom',
    activeModel: 'haley-v2',
    hasVision: false,
    hasTerminal: true,
    configured,
    url: configured ? url : '',
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true });
  }

  const sub = getSub(req);

  if (sub === 'chat') return handleChat(req, res);
  if (sub === 'test') return handleTest(req, res);
  if (sub === 'status') return handleStatus(req, res);

  return res.status(404).json({
    success: false,
    error: `Unknown model route: '${sub}'. Use chat, test, or status.`,
  });
}
