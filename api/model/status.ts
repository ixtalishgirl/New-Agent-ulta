// Vercel serverless: GET /api/model/status
// Returns model info. Always valid JSON.

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const url = (process.env.HALEY_API_URL || '').trim();
  const configured = /^https?:\/\//i.test(url);

  return res.status(200).json({
    success: true,
    status: configured ? 'configured' : 'not_configured',
    provider: 'custom',
    activeModel: 'haley-v2',
    hasVision: false,
    hasTerminal: true,
    configured,
    url: configured ? url : '',
  });
}
