// Vercel serverless: GET/POST /api/github/repo
// GitHub repo info (public API, no auth needed for public repos). Always valid JSON.

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).json({ success: true });

  const repo = (req.query?.repo || '').toString() || 'ixtalishgirl/New-Agent-ulta';

  if (req.method === 'GET') {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const r = await fetch(`https://api.github.com/repos/${repo}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'HalyeBot/1.0' },
      });
      clearTimeout(timer);
      if (!r.ok) return res.status(200).json({ success: false, error: `GitHub HTTP ${r.status}` });
      const d: any = await r.json();
      return res.status(200).json({
        success: true,
        repo: { name: d.name, full_name: d.full_name, description: d.description, stars: d.stargazers_count, updated: d.updated_at },
      });
    } catch (e: any) {
      clearTimeout(timer);
      return res.status(200).json({ success: false, error: e?.message || 'fetch failed' });
    }
  }

  // POST: return repo file tree (shallow, via GitHub API)
  let body: any = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const path = (body?.path || '').toString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const r = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'HalyeBot/1.0' },
    });
    clearTimeout(timer);
    if (!r.ok) return res.status(200).json({ success: false, error: `GitHub HTTP ${r.status}` });
    const d: any = await r.json();
    const items = Array.isArray(d) ? d.map((x: any) => ({ name: x.name, path: x.path, type: x.type, size: x.size })) : [];
    return res.status(200).json({ success: true, items });
  } catch (e: any) {
    clearTimeout(timer);
    return res.status(200).json({ success: false, error: e?.message || 'fetch failed' });
  }
}
