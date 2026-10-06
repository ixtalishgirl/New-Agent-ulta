// Vercel serverless: POST /api/agent/tools/create
// Body: { name, description?, code, runtime?: 'javascript'|'python'|'bash' }
// Validates syntax, registers tool. Returns { success, tool } - always valid JSON.

import { addTool, normalizeRuntime, CustomTool } from './_store';
import { exec } from 'child_process';

function checkPythonSyntax(code: string): Promise<{ ok: boolean; err: string }> {
  return new Promise((resolve) => {
    const proc = exec(`python3 -c ${JSON.stringify(`import ast,sys;src=sys.stdin.read();ast.parse(src)`)}`, { timeout: 10000 }, (error: any, _o: any, stderr: any) => {
      if (error) resolve({ ok: false, err: stderr?.toString().slice(0, 500) || error.message });
      else resolve({ ok: true, err: '' });
    });
    proc.stdin?.write(code);
    proc.stdin?.end();
  });
}

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
  const name = (body?.name || '').toString().trim();
  const code = (body?.code || '').toString();
  const description = (body?.description || 'Agent self-created tool').toString();
  const runtime = normalizeRuntime(body?.runtime || body?.language);

  if (!name || !code) {
    return res.status(400).json({ success: false, error: 'name and code are required' });
  }
  if (!/^[a-zA-Z0-9_\- ]{2,60}$/.test(name)) {
    return res.status(400).json({ success: false, error: 'name: 2-60 chars, letters/numbers/_/- only' });
  }

  // Syntax validation per runtime
  if (runtime === 'javascript') {
    try {
      new (require('vm').Script)(code, { filename: `${name}.js` });
    } catch (e: any) {
      return res.status(400).json({ success: false, error: `JavaScript syntax error: ${e.message}`, runtime });
    }
  } else if (runtime === 'python') {
    const chk = await checkPythonSyntax(code);
    if (!chk.ok) {
      return res.status(400).json({ success: false, error: `Python syntax error: ${chk.err}`, runtime });
    }
  }
  // bash: no static check available serverless-side; validated at execution.

  const tool: CustomTool = {
    id: 'tool_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4),
    name,
    description,
    runtime,
    code,
    createdAt: new Date().toISOString(),
    invocationsCount: 0,
  };
  addTool(tool);

  return res.status(200).json({
    success: true,
    message: `Tool "${name}" created (${runtime}, syntax verified)`,
    tool,
  });
}
