// Vercel serverless: GET /api/custom-llm/status
// Returns engine configuration status. Always valid JSON.

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const url = (process.env.HALEY_API_URL || '').trim();
  const configured = /^https?:\/\//i.test(url);

  return res.status(200).json({
    success: true,
    configured,
    url: configured ? url : '',
    hasAuthKey: false,
    engine: 'haley-v2',
  });
}
