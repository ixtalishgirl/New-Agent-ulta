// Vercel serverless: GET /api/model/test
// Pings HALEY_API_URL root. Returns { success, alive, latencyMs } - always valid JSON.

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const baseUrl = (process.env.HALEY_API_URL || '').trim().replace(/\/+$/, '');
  if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) {
    return res.status(200).json({
      success: true,
      alive: false,
      configured: false,
      error: 'HALEY_API_URL set karo.',
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  const start = Date.now();

  try {
    const r = await fetch(baseUrl + '/', { signal: controller.signal });
    clearTimeout(timer);
    const text = await r.text();
    return res.status(200).json({
      success: true,
      alive: r.ok,
      configured: true,
      latencyMs: Date.now() - start,
      status: r.status,
      body: text.slice(0, 200),
      url: baseUrl,
    });
  } catch (e: any) {
    clearTimeout(timer);
    return res.status(200).json({
      success: true,
      alive: false,
      configured: true,
      latencyMs: Date.now() - start,
      error: e?.message || 'unreachable',
      url: baseUrl,
    });
  }
}
