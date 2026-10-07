// Vercel serverless (consolidated): /api/godmode
// GET/POST toggles and reads the God Mode flag (in-memory per instance).
// Always returns valid JSON, never hangs.

const g: any = globalThis as any;
if (typeof g.__godmode !== 'boolean') g.__godmode = false;

function parseBody(req: any): any {
  let body: any = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  return body || {};
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).json({ success: true });

  if (req.method === 'POST') {
    const body = parseBody(req);
    if (typeof body?.enabled === 'boolean') g.__godmode = body.enabled;
    else g.__godmode = !g.__godmode;
  }

  return res.status(200).json({ success: true, enabled: g.__godmode });
}
