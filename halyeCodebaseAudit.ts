/**
 * Real codebase self-audit for the Halye agent.
 *
 * Why this replaced the old inline handler: that handler did read files for real, but
 * its `issuesDiagnosed` and `fixesApplied` payloads were hardcoded template text, and
 * the UI repeated the claim "zero fatal runtime issues detected". The agent therefore
 * appeared to have audited and repaired its own code when nothing had been checked or
 * changed. This module only reports findings it actually derived from the file
 * contents, lists exactly which checks ran, and never claims a fix it did not make.
 */

import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';

export interface AuditFinding {
  title: string;
  severity: 'error' | 'warning' | 'info';
  description: string;
}

export interface AuditFileRead {
  path: string;
  linesCount: number;
  preview: string;
}

export interface CodebaseAuditResult {
  success: true;
  totalLines: number;
  filesAudited: AuditFileRead[];
  issuesDiagnosed: AuditFinding[];
  fixesApplied: Array<{ title: string; description: string }>;
  actionHistory: {
    thought: { durationSeconds: number; summary: string; detailedSteps?: string[] };
    filesRead: AuditFileRead[];
    filesEdited: Array<{ path: string; linesModified?: number; diffSummary?: string; status?: string }>;
    commandsRun: Array<{ command: string; exitCode: number; stdoutSummary?: string }>;
    issuesDiagnosed: AuditFinding[];
    fixesApplied: Array<{ title: string; description: string }>;
  };
  checksRun: string[];
  scannedAt: string;
}

const PROJECT_ROOT = process.cwd();

/** Directories that are vendor output, generated artefacts or secrets — never audited. */
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.playwright-browsers',
  '.vite',
  'coverage',
  'workspace',
  'replicas',
  '__pycache__',
]);

const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.py', '.css', '.html']);
const MAX_FILES = 80;
const MAX_FILE_BYTES = 600 * 1024;

const CHECKS_RUN = [
  'todo/fixme markers',
  'typescript suppressions',
  'empty catch blocks',
  'oversized files',
  'explicit any usage',
  'python syntax (ast.parse)',
];

interface SourceFile {
  rel: string;
  abs: string;
  content: string;
  lines: number;
}

function discoverSourceFiles(): string[] {
  const found: string[] = [];

  const walk = (dir: string) => {
    if (found.length >= MAX_FILES) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (found.length >= MAX_FILES) return;
      if (entry.name.startsWith('.') && entry.name !== '.') continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        walk(abs);
      } else if (entry.isFile()) {
        // This module embeds the marker/suppression patterns as literals, so sweeping
        // it would always report the scanner itself as the offender. An explicit
        // `paths` request can still include it.
        if (entry.name === 'halyeCodebaseAudit.ts') continue;
        const ext = path.extname(entry.name).toLowerCase();
        if (!CODE_EXTENSIONS.has(ext)) continue;
        try {
          if (fs.statSync(abs).size > MAX_FILE_BYTES) continue;
        } catch {
          continue;
        }
        found.push(abs);
      }
    }
  };

  walk(PROJECT_ROOT);
  return found;
}

function collectSources(requestedPaths?: string[], codeContent?: string): SourceFile[] {
  const sources: SourceFile[] = [];

  const addFile = (abs: string, rel: string) => {
    try {
      if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return;
      if (fs.statSync(abs).size > MAX_FILE_BYTES) return;
      const content = fs.readFileSync(abs, 'utf-8');
      sources.push({ rel, abs, content, lines: content.split('\n').length });
    } catch {
      /* unreadable file is simply not audited */
    }
  };

  if (typeof codeContent === 'string' && codeContent.trim()) {
    sources.push({
      rel: 'active_codebase_buffer',
      abs: '',
      content: codeContent,
      lines: codeContent.split('\n').length,
    });
  }

  const explicit = Array.isArray(requestedPaths) ? requestedPaths.filter(Boolean) : [];
  if (explicit.length > 0) {
    for (const p of explicit) {
      const abs = path.resolve(PROJECT_ROOT, p);
      addFile(abs, p);
    }
  } else {
    for (const abs of discoverSourceFiles()) {
      addFile(abs, path.relative(PROJECT_ROOT, abs));
    }
  }

  return sources;
}

/** Real Python syntax validation through the interpreter that runs the tools. */
function checkPythonSyntax(files: SourceFile[]): Promise<string[]> {
  const targets = files.filter((f) => f.rel.endsWith('.py') && f.abs).map((f) => f.abs).slice(0, 40);
  if (targets.length === 0) return Promise.resolve([]);

  const script = [
    'import ast, sys',
    'for p in sys.argv[1:]:',
    '    try:',
    "        ast.parse(open(p, encoding='utf-8').read(), filename=p)",
    '    except SyntaxError as e:',
    '        print(f"{p}:{e.lineno}: {e.msg}")',
    '    except Exception:',
    '        pass',
  ].join('\n');

  return new Promise((resolve) => {
    execFile('python3', ['-c', script, ...targets], { timeout: 30000, maxBuffer: 4 * 1024 * 1024 }, (_err, stdout) => {
      const lines = String(stdout || '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      resolve(lines);
    });
  });
}

export async function auditCodebase(
  options: { paths?: string[]; codeContent?: string } = {},
): Promise<CodebaseAuditResult> {
  const startedAt = Date.now();
  const sources = collectSources(options.paths, options.codeContent);
  const filesAudited: AuditFileRead[] = sources.map((f) => ({
    path: f.rel,
    linesCount: f.lines,
    preview: f.content.slice(0, 300),
  }));
  const totalLines = sources.reduce((sum, f) => sum + f.lines, 0);

  const findings: AuditFinding[] = [];
  const markers: string[] = [];
  const suppressions: string[] = [];
  const emptyCatches: string[] = [];
  const oversized: string[] = [];
  let explicitAnyCount = 0;

  for (const file of sources) {
    const lines = file.content.split('\n');

    lines.forEach((line, index) => {
      if (/\b(TODO|FIXME|HACK|XXX)\b/.test(line)) markers.push(`${file.rel}:${index + 1}`);
      if (/@ts-(ignore|nocheck|expect-error)/.test(line)) suppressions.push(`${file.rel}:${index + 1}`);
    });

    const emptyCatchMatches = file.content.match(/catch\s*(\([^)]*\))?\s*\{\s*\}/g);
    if (emptyCatchMatches) emptyCatches.push(...emptyCatchMatches.map(() => file.rel));

    if (file.lines > 1500) oversized.push(`${file.rel} (${file.lines} lines)`);

    const anyMatches = file.content.match(/(:\s*any\b)|(\bas\s+any\b)/g);
    if (anyMatches) explicitAnyCount += anyMatches.length;
  }

  const pythonIssues = await checkPythonSyntax(sources);

  if (pythonIssues.length > 0) {
    findings.push({
      title: `${pythonIssues.length} Python syntax error(s)`,
      severity: 'error',
      description: pythonIssues.slice(0, 5).join(' | '),
    });
  }

  if (emptyCatches.length > 0) {
    findings.push({
      title: `${emptyCatches.length} empty catch block(s)`,
      severity: 'warning',
      description:
        'Errors are swallowed silently in: ' +
        Array.from(new Set(emptyCatches)).slice(0, 6).join(', ') +
        '. Runtime failures there are invisible to both the user and the agent.',
    });
  }

  if (suppressions.length > 0) {
    findings.push({
      title: `${suppressions.length} TypeScript suppression(s)`,
      severity: 'warning',
      description: '@ts-ignore / @ts-expect-error at ' + suppressions.slice(0, 6).join(', ') + '. Type errors are being silenced rather than fixed.',
    });
  }

  if (markers.length > 0) {
    findings.push({
      title: `${markers.length} TODO/FIXME marker(s)`,
      severity: 'info',
      description: 'Unfinished work noted at ' + markers.slice(0, 8).join(', ') + '.',
    });
  }

  if (oversized.length > 0) {
    findings.push({
      title: `${oversized.length} oversized file(s)`,
      severity: 'info',
      description: 'Large files are hard to change safely: ' + oversized.join(', ') + '.',
    });
  }

  if (explicitAnyCount > 0) {
    findings.push({
      title: `${explicitAnyCount} explicit \`any\` usage(s)`,
      severity: 'info',
      description: 'Explicit any annotations weaken type checking across the project.',
    });
  }

  if (findings.length === 0) {
    findings.push({
      title: 'No issues found by the checks that ran',
      severity: 'info',
      description:
        `Scanned ${sources.length} files (${totalLines.toLocaleString()} lines). ` +
        `Checks performed: ${CHECKS_RUN.join(', ')}. This is not a full static analysis.`,
    });
  }

  // This audit is deliberately read-only: it never edits code, so it never reports a fix.
  const fixesApplied: Array<{ title: string; description: string }> = [];
  const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

  return {
    success: true,
    totalLines,
    filesAudited,
    issuesDiagnosed: findings,
    fixesApplied,
    actionHistory: {
      thought: {
        durationSeconds,
        summary: `Read ${sources.length} files (${totalLines.toLocaleString()} lines) and ran ${CHECKS_RUN.length} real checks. No code was modified.`,
        detailedSteps: [
          `Discovered and read ${sources.length} source files (${totalLines.toLocaleString()} lines).`,
          `Ran checks: ${CHECKS_RUN.join(', ')}.`,
          `Reported ${findings.length} finding(s); errors: ${findings.filter((f) => f.severity === 'error').length}.`,
          'Audit is read-only — nothing was edited or "repaired".',
        ],
      },
      filesRead: filesAudited,
      filesEdited: [],
      commandsRun: [],
      issuesDiagnosed: findings,
      fixesApplied,
    },
    checksRun: CHECKS_RUN,
    scannedAt: new Date().toISOString(),
  };
}
