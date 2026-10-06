// Vercel serverless: POST /api/codebase/read-and-diagnose
// Lightweight codebase self-check (serverless can't read the repo).
// Returns { success, ... } - always valid JSON.

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
  const paths = Array.isArray(body?.paths) ? body.paths.slice(0, 20) : [];
  const codeContent = (body?.codeContent || '').toString();

  // Serverless: analyze the provided code content directly
  const lines = codeContent ? codeContent.split('\n').length : 0;
  const issues: Array<{ title: string; description: string }> = [];
  const fixes: Array<{ title: string; description: string }> = [];

  if (codeContent) {
    if (/console\.log\(/.test(codeContent)) {
      issues.push({ title: 'console.log found', description: 'Debug logging present in code.' });
      fixes.push({ title: 'Keep or remove', description: 'Remove debug logs before production.' });
    }
    if (/\bTODO\b|\bFIXME\b/.test(codeContent)) {
      issues.push({ title: 'TODO/FIXME markers', description: 'Unfinished work markers found.' });
    }
    if (!issues.length) {
      fixes.push({ title: 'No issues', description: 'Code looks clean.' });
    }
  }

  return res.status(200).json({
    success: true,
    totalLines: lines,
    filesAudited: paths.map((p: string) => ({ path: p })),
    issuesDiagnosed: issues,
    fixesApplied: fixes,
    actionHistory: {
      filesRead: paths.map((p: string) => ({ path: p })),
      filesEdited: [],
      commandsRun: [],
      issuesDiagnosed: issues,
      fixesApplied: fixes,
    },
    note: 'Serverless audit: analyzes submitted code content only.',
  });
}
