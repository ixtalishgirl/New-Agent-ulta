// Vercel serverless: POST /api/tools/web-browse
// Body: { url: string }
// Fetches a URL and returns page structure info. Always valid JSON.

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
  const target = (body?.url || '').toString().trim();
  if (!target || !/^https?:\/\//i.test(target)) {
    return res.status(400).json({ success: false, error: 'Valid http(s) url required' });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  const start = Date.now();

  try {
    const r = await fetch(target, {
      signal: controller.signal,
      headers: { 'User-Agent': 'HalyeBot/1.0' },
    });
    clearTimeout(timer);
    const html = await r.text();
    const title = (html.match(/<title[^>]*>([^<]*)/i)?.[1] || '').trim().slice(0, 200);

    const buttons: Array<{ text: string }> = [];
    const btnRe = /<button[^>]*>([^<]{1,80})/gi;
    let m: RegExpExecArray | null;
    while ((m = btnRe.exec(html)) && buttons.length < 30) {
      const t = m[1].trim();
      if (t) buttons.push({ text: t });
    }

    const inputs: Array<{ type: string; name: string }> = [];
    const inRe = /<(input|textarea|select)[^>]*>/gi;
    while ((m = inRe.exec(html)) && inputs.length < 30) {
      const tag = m[0];
      const typeM = tag.match(/type=["']?([^"'\s>]+)/i);
      const nameM = tag.match(/(?:name|placeholder|aria-label)=["']?([^"'>]{1,60})/i);
      inputs.push({ type: (m[1] || '').toLowerCase(), name: (nameM?.[1] || typeM?.[1] || '').trim() });
    }

    const links: Array<{ text: string; href: string }> = [];
    const aRe = /<a[^>]*href=["']([^"']{1,200})["'][^>]*>([^<]{1,80})/gi;
    while ((m = aRe.exec(html)) && links.length < 30) {
      links.push({ href: m[1], text: m[2].trim() });
    }

    return res.status(200).json({
      success: r.ok,
      url: target,
      title,
      httpStatus: r.status,
      touchable_elements: { buttons, inputs, interactive_links: links },
      durationMs: Date.now() - start,
    });
  } catch (e: any) {
    clearTimeout(timer);
    return res.status(200).json({
      success: false,
      url: target,
      error: e?.name === 'AbortError' ? 'Fetch timeout (20s)' : (e?.message || 'fetch failed'),
      touchable_elements: { buttons: [], inputs: [], interactive_links: [] },
      durationMs: Date.now() - start,
    });
  }
}
