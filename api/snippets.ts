// Vercel serverless (consolidated): /api/snippets
// GET/POST/DELETE code snippet library (in-memory per instance).
// Always returns valid JSON, never hangs.

const g: any = globalThis as any;
if (!Array.isArray(g.__snippets)) g.__snippets = [];

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).json({ success: true });

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, snippets: g.__snippets });
  }

  const body = parseBody(req);

  if (req.method === 'POST') {
    const title = (body?.title || '').toString().trim();
    const code = (body?.code || '').toString();
    const language = (body?.language || 'text').toString();
    if (!title || !code) return res.status(400).json({ success: false, error: 'title and code required' });
    const snip = { id: 'snip_' + Date.now().toString(36), title, code: code.slice(0, 50000), language, createdAt: new Date().toISOString() };
    g.__snippets.unshift(snip);
    return res.status(200).json({ success: true, snippet: snip });
  }

  if (req.method === 'DELETE') {
    const id = (body?.id || req.query?.id || '').toString();
    g.__snippets = g.__snippets.filter((s: any) => s.id !== id);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
