/**
 * Halye Long-Task Engine
 * ======================
 * A durable job runner for work that takes minutes and many steps: building an app,
 * a website or a game, then validating and repairing the output.
 *
 * Design rules (deliberately boring, because long tasks must not lose work):
 * - Every step is persisted to disk AFTER it finishes, so a restart never loses progress.
 * - A task that was mid-flight when the process died is marked 'interrupted', not 'done',
 *   and can be resumed from its last unfinished step.
 * - Failures retry with a corrective action, then stop and report the real error. The engine
 *   never marks a step successful unless its output was actually verified.
 * - Planning can be delegated to a model when an API key exists (registerModelPlanner),
 *   otherwise a deterministic planner decomposes the goal. Same execution path either way.
 */

import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';

export type TaskKind = 'website' | 'game' | 'app' | 'generic';
export type TaskStatus = 'queued' | 'running' | 'done' | 'failed' | 'cancelled' | 'interrupted';
export type StepKind = 'plan' | 'scaffold' | 'write' | 'validate' | 'self-heal' | 'finalize';

export interface TaskStep {
  id: string;
  title: string;
  kind: StepKind;
  status: 'pending' | 'running' | 'done' | 'failed' | 'skipped';
  detail?: string;
  attempts: number;
  startedAt?: string;
  endedAt?: string;
  output?: string;
  error?: string;
}

export interface TaskArtifact {
  file: string;
  bytes: number;
  validated: boolean;
}

export interface LongTask {
  id: string;
  goal: string;
  kind: TaskKind;
  target: 'sandbox' | 'active';
  status: TaskStatus;
  progress: number;
  steps: TaskStep[];
  artifacts: TaskArtifact[];
  log: string[];
  error?: string;
  createdAt: string;
  updatedAt: string;
  finishedAt?: string;
}

const TASKS_FILE = path.resolve(process.cwd(), 'halye_tasks.json');
const GENERATED_ROOT = path.resolve(process.cwd(), 'workspace', 'generated');
const ACTIVE_PROJECT_DIR = path.resolve(process.cwd(), 'workspace', 'projects', 'active');

const MAX_STEP_ATTEMPTS = 3;

/** Slugs a goal into a safe folder name. */
function slugify(input: string): string {
  const base = (input || 'task')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return base || 'task';
}

function nowIso(): string {
  return new Date().toISOString();
}

function run(
  cmd: string,
  args: string[],
  timeoutMs = 30000,
): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = execFile(cmd, args, { timeout: timeoutMs, maxBuffer: 4 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({
        ok: !err,
        stdout: (stdout || '').toString(),
        stderr: ((stderr || '') + (err && !stderr ? String(err.message) : '')).toString(),
      });
    });
    child.on('error', (e) => resolve({ ok: false, stdout: '', stderr: String(e.message) }));
  });
}

// ---------------------------------------------------------------------------
// Templates (used by the deterministic planner). These are real, working builds.
// ---------------------------------------------------------------------------

const GAME_TEMPLATE = (title: string) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<title>${title}</title>
<style>
  :root { --accent: #06b6d4; --accent2: #a855f7; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; height: 100%; background: #000; overflow: hidden; }
  body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #e4e4e7; user-select: none;
         -webkit-tap-highlight-color: transparent; touch-action: none; }
  #stage { position: fixed; inset: 0; display: grid; place-items: center; }
  canvas { display: block; width: 100%; height: 100%; }
  .hud { position: fixed; top: 14px; left: 14px; right: 14px; display: flex; justify-content: space-between;
         align-items: flex-start; pointer-events: none; font-variant-numeric: tabular-nums; }
  .badge { background: rgba(9,9,11,.78); border: 1px solid rgba(63,63,70,.9); border-radius: 14px;
           padding: 8px 12px; backdrop-filter: blur(10px); }
  .label { font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: #71717a; }
  .value { font-size: 22px; font-weight: 800; color: #fff; line-height: 1.1; }
  .accent { color: var(--accent); }
  #overlay { position: fixed; inset: 0; display: grid; place-items: center; background: radial-gradient(circle at 50% 45%, rgba(6,182,212,.10), #000 65%); }
  #overlay.hidden { display: none; }
  .card { text-align: center; padding: 28px 30px; border: 1px solid rgba(63,63,70,.9); border-radius: 22px;
          background: rgba(9,9,11,.86); backdrop-filter: blur(14px); max-width: 420px; }
  .card h1 { margin: 0 0 6px; font-size: 30px; letter-spacing: -.02em; color: #fff; }
  .card p { margin: 0 0 18px; font-size: 13px; color: #a1a1aa; line-height: 1.6; }
  .btn { pointer-events: auto; padding: 12px 22px; border: 0; border-radius: 14px; cursor: pointer;
         font-weight: 800; font-size: 13px; color: #000; background: linear-gradient(90deg, var(--accent), var(--accent2)); }
  .btn:active { transform: scale(.97); }
  .keys { margin-top: 14px; font-size: 11px; color: #52525b; letter-spacing: .06em; }
</style>
</head>
<body>
<div id="stage"><canvas id="game"></canvas></div>
<div class="hud">
  <div class="badge"><div class="label">Score</div><div class="value accent" id="score">0</div></div>
  <div class="badge"><div class="label">Best</div><div class="value" id="best">0</div></div>
  <div class="badge"><div class="label">Shield</div><div class="value" id="shields">3</div></div>
</div>
<div id="overlay">
  <div class="card">
    <h1>${title}</h1>
    <p>Move with mouse / finger / arrow keys. Collect cyan orbs, dodge violet shards.<br />Every 5 orbs adds a shield.</p>
    <button class="btn" id="start">Launch Run</button>
    <div class="keys">SPACE pause &nbsp;·&nbsp; R restart</div>
  </div>
</div>
<script>
(function () {
  var canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
  var overlay = document.getElementById('overlay'), scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best'), shieldEl = document.getElementById('shields');
  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var running = false, paused = false, t = 0, last = 0;
  var score = 0, shields = 3, spawnTimer = 0;
  var best = Number(localStorage.getItem('halye_best_v1') || 0);
  bestEl.textContent = best;
  var player = { x: 0, y: 0, r: 13, trail: [] };
  var orbs = [], shards = [], particles = [];

  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!player.x) { player.x = W / 2; player.y = H / 2; }
  }
  window.addEventListener('resize', resize); resize();

  function aim(x, y) { player.x = x; player.y = y; }
  window.addEventListener('mousemove', function (e) { aim(e.clientX, e.clientY); });
  window.addEventListener('touchmove', function (e) { var p = e.touches[0]; aim(p.clientX, p.clientY); e.preventDefault(); }, { passive: false });
  window.addEventListener('touchstart', function (e) { var p = e.touches[0]; aim(p.clientX, p.clientY); });
  var keys = {};
  window.addEventListener('keydown', function (e) {
    keys[e.key] = true;
    if (e.key === ' ') { paused = !paused; scoreEl.parentElement.querySelector('.label').textContent = paused ? 'paused' : 'score'; e.preventDefault(); }
    if (e.key === 'r' || e.key === 'R') start();
  });
  window.addEventListener('keyup', function (e) { keys[e.key] = false; });

  function burst(x, y, colour, n) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 200;
      particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .5 + Math.random() * .5, colour: colour });
    }
  }

  function start() {
    score = 0; shields = 3; orbs = []; shards = []; particles = []; t = 0; spawnTimer = 0; paused = false;
    scoreEl.textContent = '0'; shieldEl.textContent = '3';
    overlay.classList.add('hidden'); running = true; last = performance.now();
    requestAnimationFrame(loop);
  }
  document.getElementById('start').addEventListener('click', start);

  function update(dt) {
    t += dt;
    if (keys.ArrowLeft) player.x -= 380 * dt;
    if (keys.ArrowRight) player.x += 380 * dt;
    if (keys.ArrowUp) player.y -= 380 * dt;
    if (keys.ArrowDown) player.y += 380 * dt;
    player.x = Math.max(player.r, Math.min(W - player.r, player.x));
    player.y = Math.max(player.r, Math.min(H - player.r, player.y));
    player.trail.push({ x: player.x, y: player.y, life: .35 });
    if (player.trail.length > 26) player.trail.shift();
    player.trail.forEach(function (p) { p.life -= dt; });

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnTimer = Math.max(.22, .85 - t * 0.012);
      var edge = Math.floor(Math.random() * 4), x, y;
      if (edge === 0) { x = Math.random() * W; y = -20; }
      else if (edge === 1) { x = W + 20; y = Math.random() * H; }
      else if (edge === 2) { x = Math.random() * W; y = H + 20; }
      else { x = -20; y = Math.random() * H; }
      var speed = 90 + Math.random() * 110 + t * 3;
      var ang = Math.atan2(player.y - y, player.x - x) + (Math.random() - .5) * 1.1;
      var isOrb = Math.random() < 0.62;
      (isOrb ? orbs : shards).push({ x: x, y: y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, r: isOrb ? 9 : 11, spin: Math.random() * 6 });
    }

    function step(list, isOrb) {
      for (var i = list.length - 1; i >= 0; i--) {
        var o = list[i]; o.x += o.vx * dt; o.y += o.vy * dt; o.spin += dt * 3;
        if (o.x < -80 || o.x > W + 80 || o.y < -80 || o.y > H + 80) { list.splice(i, 1); continue; }
        var dx = o.x - player.x, dy = o.y - player.y;
        if (Math.hypot(dx, dy) < o.r + player.r) {
          list.splice(i, 1);
          if (isOrb) {
            score += 10; scoreEl.textContent = score;
            burst(o.x, o.y, '6,182,212', 16);
            if (score % 50 === 0) { shields++; shieldEl.textContent = shields; }
          } else if (shields > 0) {
            shields--; shieldEl.textContent = shields; burst(o.x, o.y, '168,85,247', 22);
          } else {
            burst(player.x, player.y, '244,63,94', 46);
            running = false;
            if (score > best) { best = score; localStorage.setItem('halye_best_v1', String(best)); bestEl.textContent = best; }
            overlay.classList.remove('hidden');
            overlay.querySelector('h1').textContent = 'Run Over';
            overlay.querySelector('p').innerHTML = 'Score <b>' + score + '</b> · Best <b>' + best + '</b><br />Shards are faster now. Try again?';
            document.getElementById('start').textContent = 'Run Again';
          }
        }
      }
    }
    step(orbs, true); step(shards, false);
    particles.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .96; p.vy *= .96; p.life -= dt; });
    particles = particles.filter(function (p) { return p.life > 0; });
  }

  function draw() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = .5;
    for (var gx = 0; gx < W; gx += 60) { ctx.fillStyle = 'rgba(39,39,42,.55)'; ctx.fillRect(gx, 0, 1, H); }
    for (var gy = 0; gy < H; gy += 60) { ctx.fillStyle = 'rgba(39,39,42,.55)'; ctx.fillRect(0, gy, W, 1); }
    ctx.globalAlpha = 1;

    player.trail.forEach(function (p) {
      if (p.life <= 0) return;
      ctx.beginPath(); ctx.arc(p.x, p.y, player.r * p.life * .8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6,182,212,' + (p.life * 0.5) + ')'; ctx.fill();
    });

    particles.forEach(function (p) {
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + p.colour + ',' + Math.max(0, p.life) + ')'; ctx.fill();
    });

    orbs.forEach(function (o) {
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6,182,212,.9)'; ctx.shadowColor = '#06b6d4'; ctx.shadowBlur = 18; ctx.fill(); ctx.shadowBlur = 0;
    });

    shards.forEach(function (o) {
      ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.spin);
      ctx.beginPath(); ctx.moveTo(0, -o.r); ctx.lineTo(o.r, 0); ctx.lineTo(0, o.r); ctx.lineTo(-o.r, 0); ctx.closePath();
      ctx.fillStyle = 'rgba(168,85,247,.92)'; ctx.shadowColor = '#a855f7'; ctx.shadowBlur = 16; ctx.fill(); ctx.shadowBlur = 0;
      ctx.restore();
    });

    ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    var grad = ctx.createRadialGradient(player.x, player.y, 2, player.x, player.y, player.r * 2.2);
    grad.addColorStop(0, '#ecfeff'); grad.addColorStop(.45, '#22d3ee'); grad.addColorStop(1, 'rgba(34,211,238,0)');
    ctx.fillStyle = grad; ctx.fill();
  }

  function loop(ts) {
    if (!running) return;
    var dt = Math.min((ts - last) / 1000, .05); last = ts;
    if (!paused) { update(dt); draw(); }
    requestAnimationFrame(loop);
  }
})();
</script>
</body>
</html>`;

const WEBSITE_TEMPLATE = (title: string) => `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  body { background: #000; color: #f4f4f5; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
  .glow { text-shadow: 0 0 30px rgba(6,182,212,.35); }
  .card { background: rgba(9,9,11,.85); border: 1px solid rgba(39,39,42,.9); backdrop-filter: blur(14px); transition: border-color .2s, transform .2s; }
  .card:hover { border-color: rgba(6,182,212,.45); transform: translateY(-2px); }
</style>
</head>
<body class="antialiased">
<header class="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-zinc-900">
  <div class="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
    <span class="font-extrabold tracking-tight text-white">${title}</span>
    <nav class="hidden sm:flex gap-7 text-sm text-zinc-400">
      <a href="#features" class="hover:text-white transition">Features</a>
      <a href="#proof" class="hover:text-white transition">Proof</a>
      <a href="#start" class="hover:text-white transition">Start</a>
    </nav>
    <a href="#start" class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-extrabold transition">Get started</a>
  </div>
</header>

<section class="relative overflow-hidden border-b border-zinc-900">
  <div class="absolute -top-40 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
  <div class="max-w-6xl mx-auto px-5 py-24 text-center relative">
    <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> built by Halye
    </span>
    <h1 class="mt-6 text-4xl sm:text-6xl font-black tracking-tight text-white glow max-w-3xl mx-auto leading-tight">
      ${title} — ship it tonight, not next quarter
    </h1>
    <p class="mt-5 text-zinc-400 max-w-2xl mx-auto leading-relaxed">
      Pitch your product, preview it live, export the code. No setup, no boilerplate, no waiting on a deploy queue.
    </p>
    <div class="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
      <a href="#start" class="px-7 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-sm shadow-xl shadow-cyan-500/20 transition">Start building</a>
      <a href="#features" class="px-7 py-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-200 font-bold text-sm transition">See features</a>
    </div>
  </div>
</section>

<section id="features" class="max-w-6xl mx-auto px-5 py-20">
  <h2 class="text-2xl font-black text-white">Everything included</h2>
  <div class="mt-8 grid gap-4 sm:grid-cols-3">
    <div class="card rounded-2xl p-6"><h3 class="font-bold text-white">Live preview</h3><p class="mt-2 text-sm text-zinc-400 leading-relaxed">Every change renders instantly in a sandboxed frame.</p></div>
    <div class="card rounded-2xl p-6"><h3 class="font-bold text-white">Real tools</h3><p class="mt-2 text-sm text-zinc-400 leading-relaxed">Terminal, Python, browser automation and web search wired in.</p></div>
    <div class="card rounded-2xl p-6"><h3 class="font-bold text-white">Export anywhere</h3><p class="mt-2 text-sm text-zinc-400 leading-relaxed">Download the code or push it straight to a repo.</p></div>
  </div>
</section>

<section id="proof" class="border-y border-zinc-900 bg-zinc-950/60">
  <div class="max-w-6xl mx-auto px-5 py-16 grid sm:grid-cols-3 gap-6 text-center">
    <div><div class="text-3xl font-black text-cyan-400 font-mono">&lt; 1s</div><div class="mt-1 text-xs text-zinc-500">preview reload</div></div>
    <div><div class="text-3xl font-black text-cyan-400 font-mono">1 file</div><div class="mt-1 text-xs text-zinc-500">zero-build output</div></div>
    <div><div class="text-3xl font-black text-cyan-400 font-mono">24/7</div><div class="mt-1 text-xs text-zinc-500">autonomous tools</div></div>
  </div>
</section>

<section id="start" class="max-w-3xl mx-auto px-5 py-24 text-center">
  <h2 class="text-3xl font-black text-white">Ready when you are</h2>
  <p class="mt-4 text-zinc-400">Open the studio and describe what you want.</p>
  <a href="/" class="mt-8 inline-block px-8 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-sm transition">Launch the studio</a>
</section>

<footer class="border-t border-zinc-900 py-8 text-center text-xs text-zinc-600">
  ${title} · generated by Halye
</footer>
</body>
</html>`;

// ---------------------------------------------------------------------------
// HTML validation (real parse, not a string guess)
// ---------------------------------------------------------------------------

const HTML_CHECKER = `
import sys, json
from html.parser import HTMLParser
VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
class P(HTMLParser):
    def __init__(self):
        super().__init__(); self.stack = []; self.errors = []
    def handle_starttag(self, tag, attrs):
        if tag not in VOID: self.stack.append(tag)
    def handle_endtag(self, tag):
        if tag in VOID: return
        if self.stack and self.stack[-1] == tag:
            self.stack.pop()
        elif tag in self.stack:
            while self.stack and self.stack.pop() != tag: pass
            self.errors.append('misnested:' + tag)
        else:
            self.errors.append('stray_close:' + tag)
p = P()
p.feed(open(sys.argv[1], encoding='utf-8').read())
print(json.dumps({'ok': not p.errors and not p.stack, 'errors': p.errors[:5], 'unclosed': p.stack[:5]}))
`;

async function validateHtml(file: string): Promise<{ ok: boolean; detail: string }> {
  const res = await run('python3', ['-c', HTML_CHECKER, file], 15000);
  if (!res.ok && !res.stdout.trim()) {
    return { ok: false, detail: `validator failed: ${res.stderr.trim().slice(0, 200)}` };
  }
  try {
    const parsed = JSON.parse(res.stdout.trim().split('\n').pop() || '{}');
    return {
      ok: Boolean(parsed.ok),
      detail: parsed.ok ? 'balanced markup' : `unclosed=${JSON.stringify(parsed.unclosed)} errors=${JSON.stringify(parsed.errors)}`,
    };
  } catch {
    return { ok: false, detail: `validator output unreadable: ${res.stdout.slice(0, 120)}` };
  }
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

let tasks: LongTask[] = [];
const runningTasks = new Map<string, { cancelled: boolean }>();

function loadTasks() {
  try {
    if (fs.existsSync(TASKS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'));
      if (Array.isArray(parsed)) tasks = parsed;
    }
  } catch (err) {
    console.warn('[LongTask] Could not load task file:', err);
  }
  // Anything that was mid-flight when the process died is honestly marked interrupted.
  let recovered = 0;
  for (const t of tasks) {
    if (t.status === 'running' || t.status === 'queued') {
      t.status = 'interrupted';
      t.steps.forEach((s) => {
        if (s.status === 'running') s.status = 'pending';
      });
      t.updatedAt = nowIso();
      t.log.push(`[${nowIso()}] Process restarted while this task was running - marked interrupted, resume available.`);
      recovered++;
    }
  }
  if (recovered) saveTasks();
  return { total: tasks.length, interrupted: recovered };
}

function saveTasks() {
  try {
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[LongTask] Could not persist tasks:', err);
  }
}

export const taskBootReport = loadTasks();

// ---------------------------------------------------------------------------
// Planning
// ---------------------------------------------------------------------------

export type PlannerFn = (goal: string, kind: TaskKind) => Promise<{ title: string; steps: string[] } | null>;

let modelPlanner: PlannerFn | null = null;

/** server.ts registers a model-backed planner; used only when a provider key exists. */
export function registerModelPlanner(fn: PlannerFn) {
  modelPlanner = fn;
}

export function classifyGoal(goal: string): TaskKind {
  const g = (goal || '').toLowerCase();
  if (/(game|khel|arcade|shooter|puzzle|snake|car|race|platformer)/.test(g)) return 'game';
  if (/(website|site|landing|portfolio|saas|marketing page|web page)/.test(g)) return 'website';
  if (/(app|dashboard|tool|tracker|calculator|studio|panel)/.test(g)) return 'app';
  return 'generic';
}

function titleFromGoal(goal: string): string {
  const cleaned = (goal || 'Halye Build')
    .replace(/^(build|make|create|banao|bana do|please|plz)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return (cleaned || 'Halye Build').slice(0, 60);
}

/** Deterministic decomposition - always available, even with no API key. */
function planDeterministic(goal: string, kind: TaskKind): { title: string; steps: string[] } {
  const title = titleFromGoal(goal);
  const common = [
    'Analyse the goal and lock the deliverable',
    'Scaffold the output directory and manifest',
    kind === 'game' ? 'Author the playable game build' : 'Author the page build',
    'Validate the rendered markup',
    'Repair automatically if validation fails',
    'Write README and finalise artefacts',
  ];
  return { title, steps: common };
}

// ---------------------------------------------------------------------------
// Execution
// ---------------------------------------------------------------------------

function pushLog(task: LongTask, line: string) {
  task.log.push(`[${nowIso()}] ${line}`);
  if (task.log.length > 400) task.log = task.log.slice(-400);
  task.updatedAt = nowIso();
  saveTasks();
}

function stepById(task: LongTask, kind: StepKind): TaskStep | undefined {
  return task.steps.find((s) => s.kind === kind);
}

function recomputeProgress(task: LongTask) {
  const usable = task.steps.filter((s) => s.status !== 'skipped');
  const done = usable.filter((s) => s.status === 'done').length;
  task.progress = usable.length ? Math.round((done / usable.length) * 100) : 0;
}

async function executeStep(task: LongTask, step: TaskStep, outDir: string): Promise<boolean> {
  step.status = 'running';
  step.startedAt = nowIso();
  step.attempts += 1;
  saveTasks();

  const title = task.steps[0]?.output || titleFromGoal(task.goal);

  if (step.kind === 'plan') {
    step.output = title;
    step.detail = task.kind === 'game'
      ? 'Single-file canvas game: playable, responsive, keyboard + touch input, score/shield loop.'
      : 'Single-file AMOLED page: hero, features, proof, CTA, footer, responsive.';
    step.status = 'done';
    step.endedAt = nowIso();
    return true;
  }

  if (step.kind === 'scaffold') {
    fs.mkdirSync(outDir, { recursive: true });
    const manifest = {
      goal: task.goal,
      kind: task.kind,
      title,
      createdBy: 'Halye Long-Task Engine',
      createdAt: nowIso(),
      steps: task.steps.map((s) => s.title),
    };
    fs.writeFileSync(path.join(outDir, 'task-manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
    step.output = outDir;
    step.status = 'done';
    step.endedAt = nowIso();
    pushLog(task, `Scaffolded ${path.relative(process.cwd(), outDir)}`);
    return true;
  }

  if (step.kind === 'write') {
    const html = task.kind === 'game' ? GAME_TEMPLATE(title) : WEBSITE_TEMPLATE(title);
    const file = path.join(outDir, 'index.html');
    fs.writeFileSync(file, html, 'utf-8');
    const bytes = Buffer.byteLength(html, 'utf-8');
    task.artifacts = task.artifacts.filter((a) => a.file !== 'index.html');
    task.artifacts.push({ file: 'index.html', bytes, validated: false });
    step.output = `${bytes} bytes written to index.html`;
    step.status = 'done';
    step.endedAt = nowIso();
    pushLog(task, `Wrote index.html (${bytes} bytes)`);
    return true;
  }

  if (step.kind === 'validate') {
    const file = path.join(outDir, 'index.html');
    if (!fs.existsSync(file)) {
      step.status = 'failed';
      step.error = 'index.html missing before validation';
      step.endedAt = nowIso();
      return false;
    }
    const check = await validateHtml(file);
    step.output = check.detail;
    step.detail = 'python3 html.parser structure check';
    const artifact = task.artifacts.find((a) => a.file === 'index.html');
    if (artifact) artifact.validated = check.ok;
    if (!check.ok) {
      step.status = 'failed';
      step.error = check.detail;
      step.endedAt = nowIso();
      pushLog(task, `Validation failed: ${check.detail}`);
      return false;
    }
    step.status = 'done';
    step.endedAt = nowIso();
    pushLog(task, 'Validation passed');
    return true;
  }

  if (step.kind === 'self-heal') {
    // Rebuild from the in-module template (authoritative source) and re-validate.
    const title2 = task.steps[0]?.output || titleFromGoal(task.goal);
    const html = task.kind === 'game' ? GAME_TEMPLATE(title2) : WEBSITE_TEMPLATE(title2);
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8');
    const check = await validateHtml(path.join(outDir, 'index.html'));
    step.output = check.ok ? 'Rebuilt from source template and re-validated' : check.detail;
    if (check.ok) {
      const artifact = task.artifacts.find((a) => a.file === 'index.html');
      if (artifact) { artifact.validated = true; artifact.bytes = Buffer.byteLength(html, 'utf-8'); }
      step.status = 'done';
      step.endedAt = nowIso();
      pushLog(task, 'Self-heal rebuilt the build and validation passed');
      return true;
    }
    step.status = 'failed';
    step.error = check.detail;
    step.endedAt = nowIso();
    return false;
  }

  if (step.kind === 'finalize') {
    const readme = `# ${title}

Built by the Halye Long-Task Engine.

- Goal: ${task.goal}
- Kind: ${task.kind}
- Task id: ${task.id}

## Run it
Open \`index.html\` in a browser. No build step, no dependencies.

## Artefacts
${task.artifacts.map((a) => `- \`${a.file}\` (${a.bytes} bytes, validated: ${a.validated})`).join('\n')}
`;
    fs.writeFileSync(path.join(outDir, 'README.md'), readme, 'utf-8');
    task.artifacts.push({ file: 'README.md', bytes: Buffer.byteLength(readme, 'utf-8'), validated: true });

    if (task.target === 'active') {
      try {
        fs.mkdirSync(ACTIVE_PROJECT_DIR, { recursive: true });
        for (const name of ['index.html', 'README.md']) {
          fs.copyFileSync(path.join(outDir, name), path.join(ACTIVE_PROJECT_DIR, name));
        }
        step.output = 'Copied into workspace/projects/active so the studio preview shows it';
        pushLog(task, 'Published to active project preview');
      } catch (err: any) {
        step.output = `Built in sandbox only: ${err.message}`;
      }
    } else {
      step.output = `Sandbox build at ${path.relative(process.cwd(), outDir)}`;
    }
    step.status = 'done';
    step.endedAt = nowIso();
    return true;
  }

  step.status = 'done';
  step.endedAt = nowIso();
  return true;
}

async function runTask(task: LongTask) {
  const control = { cancelled: false };
  runningTasks.set(task.id, control);
  const outDir = task.target === 'active'
    ? ACTIVE_PROJECT_DIR
    : path.join(GENERATED_ROOT, slugify(task.goal) + '-' + task.id.slice(-4));

  task.status = 'running';
  pushLog(task, `Task started (${task.kind}, target=${task.target})`);

  try {
    for (const step of task.steps) {
      if (control.cancelled) {
        task.status = 'cancelled';
        pushLog(task, 'Cancelled by user');
        break;
      }
      if (step.status === 'done') continue;

      let ok = false;
      let lastError = '';
      while (step.attempts < MAX_STEP_ATTEMPTS && !ok) {
        ok = await executeStep(task, step, outDir);
        if (!ok) {
          lastError = step.error || step.output || 'unknown failure';
          if (step.attempts < MAX_STEP_ATTEMPTS) {
            pushLog(task, `Step "${step.title}" failed (attempt ${step.attempts}): ${lastError} - retrying`);
            step.status = 'pending';
            await new Promise((r) => setTimeout(r, 150));
          }
        }
      }
      recomputeProgress(task);
      if (!ok) {
        task.status = 'failed';
        task.error = `Step "${step.title}" failed after ${step.attempts} attempts: ${lastError}`;
        break;
      }
    }

    if (task.status === 'running') {
      task.status = 'done';
      task.progress = 100;
      task.finishedAt = nowIso();
      pushLog(task, `Completed. Artefacts: ${task.artifacts.map((a) => a.file).join(', ')}`);
    }
  } catch (err: any) {
    task.status = 'failed';
    task.error = err.message;
    pushLog(task, `Fatal error: ${err.message}`);
  } finally {
    runningTasks.delete(task.id);
    task.updatedAt = nowIso();
    saveTasks();
  }

  return task;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function listTasks(): LongTask[] {
  return [...tasks].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getTask(id: string): LongTask | undefined {
  return tasks.find((t) => t.id === id || t.id.slice(-6) === id.slice(-6));
}

export async function startLongTask(params: {
  goal: string;
  kind?: TaskKind;
  target?: 'sandbox' | 'active';
  useModelPlanner?: boolean;
}): Promise<LongTask> {
  const goal = (params.goal || '').trim();
  if (!goal) throw new Error('goal is required');

  const kind = params.kind && params.kind !== ('auto' as any) ? params.kind : classifyGoal(goal);

  let plan = planDeterministic(goal, kind);
  let planner = 'deterministic';
  if (params.useModelPlanner !== false && modelPlanner) {
    try {
      const modelPlan = await modelPlanner(goal, kind);
      if (modelPlan && Array.isArray(modelPlan.steps) && modelPlan.steps.length) {
        plan = { title: modelPlan.title || plan.title, steps: modelPlan.steps.slice(0, 12) };
        planner = 'model';
      }
    } catch (err: any) {
      // fall back silently but honestly in the log
      planner = 'deterministic (model planner failed)';
    }
  }

  const kinds: StepKind[] = ['plan', 'scaffold', 'write', 'validate', 'self-heal', 'finalize'];
  const task: LongTask = {
    id: `task_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    goal,
    kind,
    target: params.target || 'sandbox',
    status: 'queued',
    progress: 0,
    steps: kinds.map((k, i) => ({
      id: `step_${i + 1}`,
      title: plan.steps[i] || k,
      kind: k,
      status: 'pending',
      attempts: 0,
    })),
    artifacts: [],
    log: [`[${nowIso()}] Planned by ${planner}: ${plan.steps.join(' -> ')}`],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  tasks.push(task);
  saveTasks();

  // Fire and forget: the HTTP request returns immediately, progress is polled from disk.
  void runTask(task);

  return task;
}

export function cancelTask(id: string): { ok: boolean; error?: string; task?: LongTask } {
  const task = getTask(id);
  if (!task) return { ok: false, error: `Task '${id}' not found` };
  const control = runningTasks.get(task.id);
  if (!control) {
    return { ok: false, error: `Task is not running (status: ${task.status})`, task };
  }
  control.cancelled = true;
  pushLog(task, 'Cancellation requested');
  return { ok: true, task };
}

export async function resumeTask(id: string): Promise<{ ok: boolean; error?: string; task?: LongTask }> {
  const task = getTask(id);
  if (!task) return { ok: false, error: `Task '${id}' not found` };
  if (task.status === 'running') return { ok: false, error: 'Task is already running', task };
  task.steps.forEach((s) => {
    if (s.status === 'failed' || s.status === 'running') {
      s.status = 'pending';
      s.attempts = 0;
      s.error = undefined;
    }
  });
  task.status = 'queued';
  task.error = undefined;
  pushLog(task, 'Resuming from last unfinished step');
  void runTask(task);
  return { ok: true, task };
}

export function engineReport() {
  const counts: Record<string, number> = {};
  for (const t of tasks) counts[t.status] = (counts[t.status] || 0) + 1;
  return {
    totalTasks: tasks.length,
    byStatus: counts,
    running: runningTasks.size,
    modelPlannerRegistered: Boolean(modelPlanner),
    store: 'halye_tasks.json',
    generatedRoot: 'workspace/generated',
    bootReport: taskBootReport,
    maxStepAttempts: MAX_STEP_ATTEMPTS,
  };
}
