// Vercel serverless: GET /api/self/status
// Always valid JSON.

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json({
    success: true,
    status: 'active',
    version: '2.0',
    engine: 'haley-v2',
    platform: 'vercel-serverless',
  });
}
