// Vercel serverless: POST /api/screen/stop
// Clears the stored screen frame. Returns { success } - always valid JSON.

const g: any = globalThis as any;

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).json({ success: true });

  g.__screenFrame = null;
  g.__screenMeta = null;
  return res.status(200).json({ success: true });
}
