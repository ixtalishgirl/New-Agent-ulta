// Vercel serverless: POST /api/agent/tools/playwright
// Body: { url?: string, url_or_script?: string, mode?: string }
// Playwright browsers are NOT available on Vercel serverless.
// This endpoint fetches the URL and returns basic page info instead.
// Returns { success, ... } - always valid JSON.

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
  const target = (body?.url || body?.url_or_script || '').toString().trim();
  if (!target || !/^https?:\/\//i.test(target)) {
    return res.status(400).json({ success: false, error: 'Valid http(s) url required' });
  }

  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  try {
    const r = await fetch(target, {
      signal: controller.signal,
      headers: { 'User-Agent': 'HalyeBot/1.0' },
    });
    clearTimeout(timer);
    const html = await r.text();
    const title = (html.match(/<title[^>]*>([^<]*)/i)?.[1] || '').trim().slice(0, 200);
    const buttons = (html.match(/<button/gi) || []).length;
    const inputs = (html.match(/<input|<textarea|<select/gi) || []).length;
    const links = (html.match(/<a\s/gi) || []).length;

    return res.status(200).json({
      success: r.ok,
      stdout: `Fetched ${target} (HTTP ${r.status})`,
      stderr: r.ok ? '' : `HTTP ${r.status}`,
      exitCode: r.ok ? 0 : 1,
      durationMs: Date.now() - start,
      data: {
        url: target,
        httpStatus: r.status,
        title,
        buttons,
        inputs,
        links,
        htmlBytes: html.length,
        note: 'Serverless fallback: full Playwright browser automation needs a persistent server.',
      },
    });
  } catch (e: any) {
    clearTimeout(timer);
    return res.status(200).json({
      success: false,
      stdout: '',
      stderr: e?.message || 'fetch failed',
      exitCode: 1,
      durationMs: Date.now() - start,
    });
  }
}
