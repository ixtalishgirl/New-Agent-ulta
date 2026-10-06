// Vercel serverless: GET /api/system/status
// System dashboard: model health, server stats, tools. Always valid JSON.

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const modelUrl = (process.env.HALEY_API_URL || '').trim();
  const modelConfigured = /^https?:\/\//i.test(modelUrl);

  let modelAlive = false;
  let modelLatency: number | null = null;
  if (modelConfigured) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const start = Date.now();
    try {
      const r = await fetch(modelUrl.replace(/\/+$/, '') + '/', { signal: controller.signal });
      modelAlive = r.ok;
      modelLatency = Date.now() - start;
    } catch { /* unreachable */ }
    clearTimeout(timer);
  }

  const mem = process.memoryUsage();

  return res.status(200).json({
    success: true,
    model: { configured: modelConfigured, alive: modelAlive, latencyMs: modelLatency, url: modelConfigured ? modelUrl : '' },
    server: {
      uptimeSec: Math.round(process.uptime()),
      memoryMB: Math.round(mem.heapUsed / 1024 / 1024),
      node: process.version,
      platform: 'vercel-serverless',
    },
    tools: ['terminal', 'bash', 'python', 'pip', 'playwright(fetch)', 'web-browse', 'web-search', 'snippets', 'godmode', 'screen-eyes'],
    timestamp: new Date().toISOString(),
  });
}
