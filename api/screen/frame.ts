// Vercel serverless: POST /api/screen/frame
// Receives a live screen frame (dataUrl + metadata). Stored in-memory per instance.
// Returns { success } - always valid JSON.

const g: any = globalThis as any;

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).json({ success: true });
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Use POST.' });

  let body: any = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
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
