// Vercel serverless: GET /api/models/local/list
// Always valid JSON.

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const url = (process.env.HALEY_API_URL || '').trim();
  const configured = /^https?:\/\//i.test(url);

  return res.status(200).json({
    success: true,
    models: configured ? [{ id: 'haley-v2', name: 'Haley v2 (Custom LLM)', url, active: true }] : [],
    note: 'Single model via HALEY_API_URL.',
  });
}
