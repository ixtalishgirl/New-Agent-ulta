// Vercel serverless: POST /api/custom-llm/test
// Tests the model endpoint. Always valid JSON.

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).json({ success: true });

  const baseUrl = (process.env.HALEY_API_URL || '').trim().replace(/\/+$/, '');
  if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) {
    return res.status(200).json({ success: false, error: 'HALEY_API_URL not configured' });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  const start = Date.now();

  try {
    const r = await fetch(`${baseUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Say OK', max_tokens: 10 }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const text = await r.text();
    return res.status(200).json({
      success: r.ok,
      latencyMs: Date.now() - start,
      httpStatus: r.status,
      sample: text.slice(0, 200),
    });
  } catch (e: any) {
    clearTimeout(timer);
    return res.status(200).json({ success: false, error: e?.message || 'unreachable', latencyMs: Date.now() - start });
  }
}
