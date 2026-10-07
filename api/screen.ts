// Vercel serverless (consolidated): /api/screen/*
// Sub-routes:
//   POST /api/screen/frame -> receives a live screen frame (dataUrl + metadata), stored in-memory
//   POST /api/screen/stop  -> clears the stored screen frame
// Always returns valid JSON, never hangs.

const g: any = globalThis as any;

function getSub(req: any): string {
  const q = req.query || {};
  if (q.sub) return String(q.sub).replace(/^\/+|\/+$/g, '');
  try {
    const u = new URL(req.url || '/', 'http://localhost');
    const p = u.pathname.replace(/\/+$/, '');
    if (p === '/api/screen' || p === '/api/screen/') return '';
    if (p.startsWith('/api/screen/')) return p.slice('/api/screen/'.length);
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

async function handleFrame(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Use POST.' });

  const body = parseBody(req);
  const frame = (body?.frame || '').toString();
  if (!frame) return res.status(400).json({ success: false, error: 'frame dataUrl required' });

  g.__screenFrame = frame.slice(0, 2000000); // cap ~2MB
  g.__screenMeta = {
    width: body?.metadata?.width || 1280,
    height: body?.metadata?.height || 720,
    timestamp: Date.now(),
    title: body?.metadata?.title || 'User Screen',
  };

  return res.status(200).json({ success: true, bytes: g.__screenFrame.length });
}

async function handleStop(req: any, res: any) {
  g.__screenFrame = null;
  g.__screenMeta = null;
  return res.status(200).json({ success: true });
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).json({ success: true });

  const sub = getSub(req);

  if (sub === 'frame') return handleFrame(req, res);
  if (sub === 'stop') return handleStop(req, res);

  return res.status(404).json({
    success: false,
    error: `Unknown screen route: '${sub}'. Use frame or stop.`,
  });
}
