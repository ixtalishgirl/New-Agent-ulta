// Vercel serverless: POST /api/self/theme/rollback
// Always valid JSON.

const g: any = globalThis as any;

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).json({ success: true });

  if (g.__themePrev) {
    g.__theme = { ...g.__themePrev };
    return res.status(200).json({ success: true, theme: g.__theme, rolledBack: true });
  }
  return res.status(200).json({ success: true, theme: g.__theme || { accent: 'cyan', mode: 'dark' }, rolledBack: false });
}
