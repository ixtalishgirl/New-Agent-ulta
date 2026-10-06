// Vercel serverless: GET/POST /api/godmode
// God Mode toggle state (in-memory per instance). Always valid JSON.

const g: any = globalThis as any;
if (typeof g.__godmode !== 'boolean') g.__godmode = false;

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).json({ success: true });

  if (req.method === 'POST') {
    let body: any = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    if (typeof body?.enabled === 'boolean') g.__godmode = body.enabled;
    else g.__godmode = !g.__godmode;
  }

  return res.status(200).json({ success: true, enabled: g.__godmode });
}
