// Vercel serverless: POST /api/gemini/vision
// Vision analysis stub: describes that the model is text-only.
// Always valid JSON, never hangs.

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).json({ success: true });
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Use POST.' });

  let body: any = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }

  const hasImage = Boolean(body?.image || body?.dataUrl);
  return res.status(200).json({
    success: true,
    description: hasImage
      ? 'Screenshot received. The Halye model is text-only: describe what you see in the screenshot in your message for best results.'
      : 'No image provided.',
    vision: false,
    note: 'Text-only model; Screen Eyes attaches screenshots as chat context.',
  });
}
