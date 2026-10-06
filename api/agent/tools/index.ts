// Vercel serverless: GET /api/agent/tools
// Lists registered custom tools. In-memory per instance (serverless).
// Returns { success, tools, totalCreated } - always valid JSON.

import { getStore } from './_store';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Use GET.' });

  const tools = getStore();
  return res.status(200).json({
    success: true,
    tools,
    totalCreated: tools.length,
  });
}
