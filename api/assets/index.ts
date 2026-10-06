// Vercel serverless: GET/POST/DELETE /api/assets
// Attached assets (in-memory per instance). Always valid JSON.

const g: any = globalThis as any;
if (!Array.isArray(g.__assets)) {
  g.__assets = [{ id: 'asset_1', name: 'halye_live_screen.jpg', type: 'image', createdAt: new Date().toISOString() }];
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).json({ success: true });

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, assets: g.__assets, count: g.__assets.length });
  }

  let body: any = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }

  if (req.method === 'POST') {
    const asset = {
      id: 'asset_' + Date.now().toString(36),
      name: (body?.name || 'asset').toString().slice(0, 100),
      type: (body?.type || 'file').toString(),
      dataUrl: (body?.dataUrl || '').toString().slice(0, 2000000),
      createdAt: new Date().toISOString(),
    };
    g.__assets.unshift(asset);
    return res.status(200).json({ success: true, asset, count: g.__assets.length });
  }

  if (req.method === 'DELETE') {
    const id = (body?.id || req.query?.id || '').toString();
    g.__assets = g.__assets.filter((a: any) => a.id !== id);
    return res.status(200).json({ success: true, count: g.__assets.length });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
