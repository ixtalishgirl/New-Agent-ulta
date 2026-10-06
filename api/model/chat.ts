// Vercel serverless: POST /api/model/chat
// Forwards chat prompt to the HALEY_API_URL model endpoint (/generate).
// Returns { success, response } or { success:false, error } - always valid JSON.

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true });
  }
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

  let body: any = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
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
