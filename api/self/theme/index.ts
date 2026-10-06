// Vercel serverless: GET/POST /api/self/theme
// Theme state (in-memory per instance). Always valid JSON.

const g: any = globalThis as any;
if (!g.__theme) g.__theme = { accent: 'cyan', mode: 'dark' };

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).json({ success: true });

  if (req.method === 'POST') {
    let body: any = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    g.__themePrev = { ...g.__theme };
    if (body?.accent) g.__theme.accent = String(body.accent).slice(0, 30);
    if (body?.mode) g.__theme.mode = String(body.mode).slice(0, 30);
  }

  return res.status(200).json({ success: true, theme: g.__theme });
}
