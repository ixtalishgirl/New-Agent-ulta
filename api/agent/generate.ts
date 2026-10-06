// Vercel serverless: POST /api/agent/generate
// Body: { prompt: string, currentCode?: string, mode?: string }
// Code-builder: asks the model to generate/return HTML code. Always valid JSON.

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).json({ success: true });
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Use POST.' });

  const baseUrl = (process.env.HALEY_API_URL || '').trim().replace(/\/+$/, '');
  if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) {
    return res.status(400).json({ success: false, error: 'HALEY_API_URL not configured' });
  }

  let body: any = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const prompt = (body?.prompt || '').toString().trim();
  const currentCode = (body?.currentCode || '').toString().slice(0, 12000);
  if (!prompt) return res.status(400).json({ success: false, error: 'prompt required' });

  const fullPrompt =
    `You are Halye, a website builder. Generate a complete single-file HTML page.\n` +
    `User request: ${prompt}\n` +
    (currentCode ? `\nCurrent code (improve it):\n${currentCode.slice(0, 6000)}\n` : '') +
    `\nReturn ONLY the HTML code inside \`\`\`html fences. No explanations.`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);

  try {
    const r = await fetch(`${baseUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: fullPrompt, max_tokens: 2048 }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const text = await r.text();
    if (!r.ok) return res.status(502).json({ success: false, error: `Model HTTP ${r.status}` });

    let data: any = {};
    try { data = JSON.parse(text); } catch { /* fall through */ }
    const response = String(data.response || '').trim();

    // Extract HTML from fences or raw
    const fenced = response.match(/```html\s*([\s\S]*?)```/i);
    const code = (fenced ? fenced[1] : response).trim();

    return res.status(200).json({ success: true, code, raw: response.slice(0, 500) });
  } catch (e: any) {
    clearTimeout(timer);
    return res.status(502).json({
      success: false,
      error: e?.name === 'AbortError' ? 'Model timeout (120s)' : (e?.message || 'fetch failed'),
    });
  }
}
