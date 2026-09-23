/**
 * Python tool-runtime bootstrap for the Halye agent.
 *
 * Why this exists: the platform's install step is Node-only (`bun install`), so a
 * fresh sandbox contains no LangChain, no Playwright and no scraping libraries.
 * Every Python-backed tool the agent advertises — the LangChain AgentExecutor,
 * Playwright touch automation, the requests/bs4 scrapers — then dies with
 * `ModuleNotFoundError`, the server catches it and silently falls back, and the
 * agent ends up looking like it has no tools and no way to use them.
 *
 * This module closes that gap: it detects which declared requirements are missing,
 * installs them, then installs the Playwright Chromium binary once per process.
 * It is idempotent, non-fatal, and reports what it did so the UI/agent can see the
 * real state of its own sandbox instead of guessing.
 */

import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const REQUIREMENTS_FILE = path.resolve(PROJECT_ROOT, 'requirements.txt');

/**
 * Browsers are installed into the project so `halye_powers/playwright_automation.py`
 * finds them deterministically — it looks for `<project>/.playwright-browsers`
 * first, and the dev server's HOME is not guaranteed to match the shell's.
 */
const BROWSERS_PATH = path.resolve(PROJECT_ROOT, '.playwright-browsers');

/** Modules probed to decide whether the tool runtime is usable. */
const CORE_MODULES = [
  'langchain_core',
  'langchain_classic',
  'playwright',
  'requests',
  'bs4',
] as const;

export interface PythonEnvStatus {
  /** True when every CORE_MODULES import resolves. */
  ok: boolean;
  missing: string[];
  /** True when this process ran a pip install (even if nothing was missing). */
  installAttempted: boolean;
  packagesInstalled: boolean;
  browserInstalled: boolean;
  requirementsFile: string;
  browsersPath: string;
  detail: string;
  updatedAt: number;
}

let status: PythonEnvStatus = {
  ok: false,
  missing: [...CORE_MODULES],
  installAttempted: false,
  packagesInstalled: false,
  browserInstalled: false,
  requirementsFile: REQUIREMENTS_FILE,
  browsersPath: BROWSERS_PATH,
  detail: 'Python tool-runtime check has not run yet.',
  updatedAt: 0,
};

let bootstrapPromise: Promise<PythonEnvStatus> | null = null;

interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

function run(cmd: string, args: string[], timeoutMs: number, extraEnv?: Record<string, string>): Promise<RunResult> {
  return new Promise((resolve) => {
    execFile(
      cmd,
      args,
      {
        timeout: timeoutMs,
        maxBuffer: 16 * 1024 * 1024,
        env: { ...process.env, ...(extraEnv || {}) },
      },
      (err: any, stdout, stderr) => {
        resolve({
          code: err ? (typeof err.code === 'number' ? err.code : 1) : 0,
          stdout: String(stdout || ''),
          stderr: String(stderr || err?.message || ''),
        });
      },
    );
  });
}

/** One interpreter call reports exactly which declared modules are unavailable. */
async function findMissingModules(): Promise<string[]> {
  const probe = [
    'import importlib.util, sys',
    `mods = ${JSON.stringify([...CORE_MODULES])}`,
    `missing = [m for m in mods if importlib.util.find_spec(m) is None]`,
    `print(','.join(missing))`,
  ].join('\n');

  const res = await run('python3', ['-c', probe], 20000);
  if (res.code !== 0) {
    // No python3 at all, or the probe itself failed: treat everything as missing.
    return [...CORE_MODULES];
  }
  return res.stdout.trim() ? res.stdout.trim().split(',').filter(Boolean) : [];
}

/**
 * Installs requirements.txt into the interpreter that actually runs the tools.
 * Handles the two real-world failure modes: PEP 668 "externally-managed-environment"
 * (needs --break-system-packages) and a non-writable site-packages (needs --user).
 */
async function installRequirements(): Promise<{ ok: boolean; detail: string }> {
  if (!fs.existsSync(REQUIREMENTS_FILE)) {
    return { ok: false, detail: `requirements.txt not found at ${REQUIREMENTS_FILE}` };
  }

  const base = ['-m', 'pip', 'install', '--disable-pip-version-check', '-r', REQUIREMENTS_FILE];

  let res = await run('python3', base, 300000);
  if (res.code === 0) return { ok: true, detail: 'requirements.txt installed' };

  if (/externally-managed-environment|externally managed/i.test(res.stderr)) {
    res = await run('python3', [...base, '--break-system-packages'], 300000);
    if (res.code === 0) return { ok: true, detail: 'requirements.txt installed (--break-system-packages)' };
  }

  if (/permission denied|not writable|EACCES/i.test(res.stderr)) {
    res = await run('python3', [...base, '--user'], 300000);
    if (res.code === 0) return { ok: true, detail: 'requirements.txt installed (--user)' };
  }

  const tail = (res.stderr || res.stdout || '').trim().split('\n').slice(-3).join(' | ');
  return { ok: false, detail: `pip install failed: ${tail || `exit ${res.code}`}` };
}

/**
 * Installs the Chromium build Playwright needs, then the system libraries Chromium
 * links against. The binary alone is not enough on a minimal image: without
 * libglib/libnss/... the launch dies with "error while loading shared libraries"
 * and the touch engine silently degrades to the DOM fallback. Skipped when the
 * browser cache is already present.
 */
async function installBrowser(): Promise<{ ok: boolean; detail: string }> {
  const res = await run('python3', ['-m', 'playwright', 'install', 'chromium'], 420000, {
    PLAYWRIGHT_BROWSERS_PATH: BROWSERS_PATH,
  });
  if (res.code !== 0) {
    const tail = (res.stderr || res.stdout || '').trim().split('\n').slice(-3).join(' | ');
    return { ok: false, detail: `playwright install chromium failed: ${tail || `exit ${res.code}`}` };
  }

  // Best effort: needs root and a package manager, so never fail the bootstrap here.
  const deps = await run('python3', ['-m', 'playwright', 'install-deps', 'chromium'], 420000, {
    DEBIAN_FRONTEND: 'noninteractive',
  });
  if (deps.code !== 0) {
    console.warn(
      '[Halye PythonEnv] Chromium system libraries could not be installed; native browser ' +
        'automation will use the DOM fallback. Run: python3 -m playwright install-deps chromium',
    );
    return { ok: true, detail: 'Playwright Chromium ready (system libs missing — DOM fallback in use)' };
  }
  return { ok: true, detail: 'Playwright Chromium + system libraries ready' };
}

async function runBootstrap(): Promise<PythonEnvStatus> {
  const notes: string[] = [];
  let installAttempted = false;
  let packagesInstalled = false;
  let browserInstalled = false;

  const missingBefore = await findMissingModules();

  if (missingBefore.length > 0) {
    installAttempted = true;
    console.log(`[Halye PythonEnv] Missing tool dependencies: ${missingBefore.join(', ')} — installing requirements.txt...`);
    const pip = await installRequirements();
    packagesInstalled = pip.ok;
    notes.push(pip.detail);
    if (pip.ok) console.log(`[Halye PythonEnv] ${pip.detail}`);
    else console.warn(`[Halye PythonEnv] ${pip.detail}`);
  }

  const missingAfter = await findMissingModules();
  if (missingAfter.length === 0 && fs.existsSync(path.join(BROWSERS_PATH))) {
    // Browser already installed in a previous boot: nothing heavy left to do.
    browserInstalled = true;
    if (!notes.length) notes.push('Python tool-runtime already installed');
  } else if (missingAfter.includes('playwright')) {
    notes.push('Playwright package unavailable — skipped Chromium install');
  } else {
    console.log('[Halye PythonEnv] Installing Playwright Chromium browser...');
    const browser = await installBrowser();
    browserInstalled = browser.ok;
    notes.push(browser.detail);
    if (browser.ok) console.log(`[Halye PythonEnv] ${browser.detail}`);
    else console.warn(`[Halye PythonEnv] ${browser.detail}`);
  }

  const ok = missingAfter.length === 0;
  status = {
    ok,
    missing: missingAfter,
    installAttempted,
    packagesInstalled,
    browserInstalled,
    requirementsFile: REQUIREMENTS_FILE,
    browsersPath: BROWSERS_PATH,
    detail: notes.join(' • ') || (ok ? 'Python tool-runtime ready' : 'Python tool-runtime incomplete'),
    updatedAt: Date.now(),
  };
  console.log(`[Halye PythonEnv] Status: ${ok ? 'READY' : 'INCOMPLETE'} — ${status.detail}`);
  return status;
}

/**
 * Idempotent: the first caller performs the work, later callers await the same
 * promise. Never throws — a broken toolchain must not take the server down.
 */
export function ensurePythonToolchain(): Promise<PythonEnvStatus> {
  if (!bootstrapPromise) {
    bootstrapPromise = runBootstrap().catch((err: any) => {
      status = {
        ...status,
        ok: false,
        detail: `bootstrap error: ${err?.message || err}`,
        updatedAt: Date.now(),
      };
      console.warn('[Halye PythonEnv] Bootstrap failed (server kept alive):', err?.message || err);
      return status;
    });
  }
  return bootstrapPromise;
}

export function getPythonEnvStatus(): PythonEnvStatus {
  return status;
}
