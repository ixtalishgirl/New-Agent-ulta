// Vercel serverless: POST /api/powers/auto-fix
// Body: { errorMessage, errorStack?, failingCode?, source? }
// Asks the model to produce a fixed version of the failing code. Always valid JSON.

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
  const errorMessage = (body?.errorMessage || '').toString().slice(0, 2000);
  const failingCode = (body?.failingCode || '').toString().slice(0, 12000);
  if (!errorMessage && !failingCode) {
    return res.status(400).json({ success: false, error: 'errorMessage or failingCode required' });
  }

  const prompt =
    `Fix this broken HTML/JS code. Error: ${errorMessage}\n` +
    (failingCode ? `\nBroken code:\n${failingCode.slice(0, 8000)}\n` : '') +
    `\nReturn ONLY the fixed complete HTML inside \`\`\`html fences. No explanations.`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);

  try {
    const r = await fetch(`${baseUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, max_tokens: 2048 }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const text = await r.text();
    if (!r.ok) return res.status(502).json({ success: false, error: `Model HTTP ${r.status}` });

    let data: any = {};
    try { data = JSON.parse(text); } catch { /* fall through */ }
    const response = String(data.response || '').trim();
    const fenced = response.match(/```html\s*([\s\S]*?)```/i);
    const fixedCode = (fenced ? fenced[1] : response).trim();

    if (!fixedCode.includes('<')) {
      return res.status(200).json({ success: false, error: 'Model did not return fixed code.' });
    }
    return res.status(200).json({ success: true, fixedCode });
  } catch (e: any) {
    clearTimeout(timer);
    return res.status(502).json({
      success: false,
      error: e?.name === 'AbortError' ? 'Model timeout (120s)' : (e?.message || 'fetch failed'),
    });
  }
}
