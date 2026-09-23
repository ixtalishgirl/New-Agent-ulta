/**
 * Halye Cognitive Planner — "think first, then act".
 *
 * Why this exists: every model call went straight from the user's prompt to the final
 * answer. The model improvised as it wrote, so multi-step work (build this, research
 * that, fix these files) wandered, missed steps, and looked "dummy" even though the
 * model and the tools were fine.
 *
 * What this does: before the answering model runs, a short planning call asks the SAME
 * configured model to decompose the task into numbered steps and to name which of its
 * real tools each step needs. That plan is then handed to the answering call as an
 * explicit scratchpad, so the model works from a plan instead of guessing.
 *
 * What this deliberately does NOT do:
 * - It does not invent a plan. If the planner call fails, the module says so
 *   (`source: 'heuristic'`) and only carries the deterministic steps it can derive
 *   from the prompt itself. It never silently pretends a model produced something.
 * - It does not load local weights. A 120B checkpoint cannot run on this sandbox
 *   (no GPU, ~240 GB of weights), so planning happens on the same cloud provider the
 *   rest of the app already uses.
 * - It does not slow down trivial prompts: greetings, short one-liners and pasted API
 *   keys are skipped outright, and repeated prompts are served from cache.
 */

/** How much work the prompt implies. Drives whether planning runs at all. */
export type PlanComplexity = 'trivial' | 'simple' | 'multi-step';

export interface CognitivePlan {
  /** One-line restatement of what the user actually wants. */
  goal: string;
  /** Ordered, concrete steps. Never empty for a planned task. */
  steps: string[];
  /** Tool names the plan expects to need (may be empty for pure writing tasks). */
  tools: string[];
  complexity: PlanComplexity;
  /**
   * 'model'   -> the configured provider produced this plan (real inference)
   * 'heuristic' -> the planner call failed; steps were derived deterministically
   */
  source: 'model' | 'heuristic';
  /** Provider model that produced the plan, when source is 'model'. */
  model?: string;
  /** Why the plan was used, or why planning was skipped. */
  reason: string;
  durationMs: number;
  cached: boolean;
  createdAt: number;
}

/** Signature of the app's single real model entrypoint, injected to avoid an import cycle. */
export type RawModelCall = (params: {
  model: string;
  prompt: string;
  systemInstruction?: string;
  maxTokens?: number;
  /** True for internal calls (the planner itself) so planning never recurses. */
  internal?: boolean;
}) => Promise<{ text?: string; modelName?: string; provider?: string }>;

const DEFAULT_MODEL = 'nvidia/nemotron-3-super-120b-a12b';

/** Planning must stay cheap: it runs on the critical path of a live chat. */
const PLAN_MAX_TOKENS = 320;
const PLAN_TIMEOUT_MS = 20_000;
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 60;
/** Excerpt length fed to the planner. Builder prompts can carry a whole file. */
const PLAN_PROMPT_CHARS = 1500;

const TOOL_SIGNALS = [
  'search', 'google', 'internet', 'latest', 'news', 'today', 'trending', 'release notes',
  'documentation', 'docs', 'look up', 'find online', 'research', 'dhoondo', 'dhundo', 'talash',
  'terminal', 'bash', 'shell', 'command', 'run ', 'execute', 'uname', 'ls ', 'cat ', 'curl ',
  'git ', 'pip ', 'install', 'python', 'node ', 'npm ', 'build',
  'scrape', 'url', 'http://', 'https://', 'browse', 'playwright', 'website',
  'file', 'folder', 'directory', 'workspace', 'repo', 'codebase', 'read the file', 'padho',
];

const MULTI_STEP_SIGNALS = [
  ' and ', ' then ', ' phir ', ' aur ', ' after that', ' steps', ' plan', ' first', ' pehle',
  'finally', 'end mein', 'multiple', 'each', 'har ek', 'saare', 'all the', 'compare',
];

const BUILD_SIGNALS = [
  'build', 'create', 'make', 'banao', 'banado', 'design', 'app', 'website', 'dashboard',
  'calculator', 'game', 'component', 'refactor', 'fix', 'bug', 'implement', 'add feature',
  'migrate', 'optimize', 'debug', 'test',
];

const TRIVIAL_PATTERNS = [
  /^(hi|hey|hello|salam|assalam|aoa|asalam)[\s!.,?]*$/i,
  /^(thanks|thank you|shukriya|thx|ok|okay|theek hai|acha)[\s!.,?]*$/i,
  /^(yes|no|haan|nahi|han|na)[\s!.,?]*$/i,
  /^(who are you|tum kon ho|ap kon ho|tumhara naam)[\s!?]*$/i,
];

/** Raw API keys pasted into chat are saved by a dedicated path, never planned. */
const KEY_PASTE_PATTERN = /(nvapi-|AIzaSy|gsk_|sk-or-)/;

interface CacheEntry {
  plan: CognitivePlan;
  storedAt: number;
}

const planCache = new Map<string, CacheEntry>();

let lastPlan: CognitivePlan | null = null;
let lastSkip: { prompt: string; reason: string; at: number } | null = null;
let planningInFlight = false;
const stats = {
  planned: 0,
  servedFromCache: 0,
  skipped: 0,
  plannerCallFailed: 0,
  model: DEFAULT_MODEL,
  updatedAt: 0,
};

function nowIso() {
  return new Date().toISOString();
}

function normalizePrompt(prompt: string): string {
  return prompt.replace(/\s+/g, ' ').trim();
}

function cacheKey(prompt: string, mode?: string): string {
  return `${mode || 'chat'}::${normalizePrompt(prompt).toLowerCase().slice(0, 600)}`;
}

function readCache(key: string): CognitivePlan | null {
  const hit = planCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.storedAt > CACHE_TTL_MS) {
    planCache.delete(key);
    return null;
  }
  return hit.plan;
}

function writeCache(key: string, plan: CognitivePlan) {
  if (planCache.size >= CACHE_MAX_ENTRIES) {
    const oldest = planCache.keys().next().value;
    if (oldest !== undefined) planCache.delete(oldest);
  }
  planCache.set(key, { plan, storedAt: Date.now() });
}

/**
 * Decides whether a prompt is worth planning for. Trivial prompts are skipped so the
 * plan-first step never becomes a latency tax on ordinary chat.
 */
export function assessPlanningNeed(
  prompt: string,
  context: { hasCode?: boolean; mode?: string; force?: boolean } = {},
): { needed: boolean; reason: string; complexity: PlanComplexity } {
  const clean = normalizePrompt(prompt);

  if (context.force) return { needed: true, reason: 'planning forced by caller', complexity: 'multi-step' };
  if (!clean) return { needed: false, reason: 'empty prompt', complexity: 'trivial' };
  if (KEY_PASTE_PATTERN.test(clean)) {
    return { needed: false, reason: 'prompt contains an API key paste (handled by the key-save path)', complexity: 'trivial' };
  }
  if (clean.length <= 12 || TRIVIAL_PATTERNS.some((re) => re.test(clean))) {
    return { needed: false, reason: 'short greeting / acknowledgement — nothing to plan', complexity: 'trivial' };
  }

  const lower = clean.toLowerCase();
  const toolSignals = TOOL_SIGNALS.filter((s) => lower.includes(s));
  const multiStepSignals = MULTI_STEP_SIGNALS.filter((s) => lower.includes(s));
  const buildSignals = BUILD_SIGNALS.filter((s) => lower.includes(s));

  if (context.mode === 'builder' || context.hasCode) {
    return {
      needed: true,
      reason: `code/build context present (mode=${context.mode || 'n/a'}, hasCode=${Boolean(context.hasCode)})`,
      complexity: 'multi-step',
    };
  }
  if (toolSignals.length >= 2 || multiStepSignals.length >= 1 || buildSignals.length >= 1 || clean.length > 220) {
    const complexity: PlanComplexity = multiStepSignals.length >= 1 || toolSignals.length >= 2 || clean.length > 220
      ? 'multi-step'
      : 'simple';
    const parts: string[] = [];
    if (toolSignals.length) parts.push(`tool signals: ${toolSignals.slice(0, 4).join(', ')}`);
    if (multiStepSignals.length) parts.push(`multi-step signals: ${multiStepSignals.slice(0, 3).join(', ')}`);
    if (buildSignals.length) parts.push(`work signals: ${buildSignals.slice(0, 3).join(', ')}`);
    if (clean.length > 220) parts.push('long prompt');
    return { needed: true, reason: parts.join(' · '), complexity };
  }

  return {
    needed: false,
    reason: 'single-step conversational prompt — planning would only add latency',
    complexity: 'simple',
  };
}

function buildPlannerInstruction(): string {
  return [
    'You are Halye\'s planning core. You do NOT answer the user.',
    'Decompose the user task into the smallest correct sequence of concrete steps, then name which tools each step needs.',
    'Available tools: web_search (live internet), web_page_reader (read a URL), live_screen_vision_tool (user screen),',
    'file_system_reader (read/write workspace files), api_execution_tool (HTTP requests), terminal_command_executor (bash),',
    'playwright (browser + touch automation), python_runner, pip_installer.',
    'Reply with STRICT JSON only, no prose, no code fences:',
    '{"goal":"...","steps":["...","..."],"tools":["..."],"complexity":"simple|multi-step"}',
    'Rules: 2-7 steps. Each step must be an action, not a restatement. Only list tools you would really call.',
  ].join(' ');
}

/** Pulls the first JSON object out of a model reply that may be wrapped in prose/fences. */
function extractJson(text: string): any | null {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === '{') depth++;
    else if (cleaned[i] === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(cleaned.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/** Last resort path: numbered/bulleted lines straight from the model's own text. */
function extractStepsFromText(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter((line) => line.length > 3 && line.length < 400 && !/^\s*(goal|steps|tools|complexity)\s*[:\-]/i.test(line))
    .slice(0, 7);
}

/**
 * Deterministic plan used only when the planner call fails. It is labelled
 * `source: 'heuristic'` so nothing downstream can mistake it for model reasoning.
 */
function heuristicPlan(prompt: string, complexity: PlanComplexity): CognitivePlan {
  const clean = normalizePrompt(prompt);
  const lower = clean.toLowerCase();
  const steps: string[] = ['Read the request exactly as written and state the concrete deliverable.'];
  if (TOOL_SIGNALS.some((s) => lower.includes(s))) {
    steps.push('Gather the missing facts with the real tool that fits (search, page reader, file reader or terminal).');
  }
  if (BUILD_SIGNALS.some((s) => lower.includes(s)) || clean.length > 120) {
    steps.push('Produce the artifact, then verify it against the request before answering.');
  }
  steps.push('Answer with the result only — no filler, no restating the plan.');

  return {
    goal: clean.slice(0, 200),
    steps,
    tools: [],
    complexity,
    source: 'heuristic',
    reason: 'planner model call did not return usable JSON — deterministic steps only, no model reasoning claimed',
    durationMs: 0,
    cached: false,
    createdAt: Date.now(),
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export interface ProducePlanOptions {
  prompt: string;
  callModel: RawModelCall;
  model?: string;
  mode?: string;
  hasCode?: boolean;
  force?: boolean;
}

/**
 * Produces (or reuses) the execution plan for a prompt. Never throws: a failed planner
 * degrades to a labelled heuristic plan so the caller always gets something usable.
 */
export async function producePlan(options: ProducePlanOptions): Promise<CognitivePlan> {
  const { prompt, callModel, force } = options;
  const assessment = assessPlanningNeed(prompt, { hasCode: options.hasCode, mode: options.mode, force });
  const key = cacheKey(prompt, options.mode);

  if (!assessment.needed) {
    stats.skipped++;
    stats.updatedAt = Date.now();
    lastSkip = { prompt: normalizePrompt(prompt).slice(0, 200), reason: assessment.reason, at: Date.now() };
    return {
      goal: normalizePrompt(prompt).slice(0, 200),
      steps: [],
      tools: [],
      complexity: assessment.complexity,
      source: 'heuristic',
      reason: `planning skipped: ${assessment.reason}`,
      durationMs: 0,
      cached: false,
      createdAt: Date.now(),
    };
  }

  const cached = readCache(key);
  if (cached) {
    stats.servedFromCache++;
    stats.updatedAt = Date.now();
    lastPlan = { ...cached, cached: true, durationMs: 0, reason: `${cached.reason} (reused from cache)` };
    return lastPlan;
  }

  const startedAt = Date.now();
  const excerpt = normalizePrompt(prompt).slice(0, PLAN_PROMPT_CHARS);
  let plan: CognitivePlan | null = null;

  try {
    const result = await withTimeout(
      callModel({
        model: options.model || DEFAULT_MODEL,
        prompt: `TASK TO PLAN:\n${excerpt}`,
        systemInstruction: buildPlannerInstruction(),
        maxTokens: PLAN_MAX_TOKENS,
        internal: true,
      }),
      PLAN_TIMEOUT_MS,
      'planner call',
    );

    const rawText = String(result?.text || '').trim();
    const offline = result?.provider === 'offline-template';
    const parsed = offline ? null : extractJson(rawText);
    const parsedSteps: string[] = Array.isArray(parsed?.steps)
      ? parsed.steps.map((s: unknown) => String(s).trim()).filter(Boolean).slice(0, 7)
      : extractStepsFromText(rawText);

    if (!offline && parsedSteps.length > 0) {
      const tools = Array.isArray(parsed?.tools)
        ? parsed.tools.map((t: unknown) => String(t).trim()).filter(Boolean).slice(0, 6)
        : [];
      plan = {
        goal: String(parsed?.goal || excerpt.slice(0, 200)).trim().slice(0, 300),
        steps: parsedSteps,
        tools,
        complexity: parsed?.complexity === 'simple' ? 'simple' : assessment.complexity,
        source: 'model',
        model: result?.modelName || options.model || DEFAULT_MODEL,
        reason: `planned by ${result?.modelName || options.model || DEFAULT_MODEL} · ${assessment.reason}`,
        durationMs: Date.now() - startedAt,
        cached: false,
        createdAt: Date.now(),
      };
    }
  } catch (err: any) {
    console.warn('[Halye Planner] Planning call failed:', err?.message || err);
  }

  if (!plan) {
    stats.plannerCallFailed++;
    plan = heuristicPlan(prompt, assessment.complexity);
    plan.durationMs = Date.now() - startedAt;
    plan.reason = `${plan.reason} · ${assessment.reason}`;
  } else {
    stats.planned++;
  }

  writeCache(key, plan);
  lastPlan = plan;
  stats.updatedAt = Date.now();
  console.log(
    `[Halye Planner] ${plan.source} plan (${plan.steps.length} steps, ${plan.durationMs}ms) for: ${excerpt.slice(0, 80)}`,
  );
  return plan;
}

/** The plan text handed to the answering model as an explicit scratchpad. */
export function renderPlan(plan: CognitivePlan): string {
  if (!plan || plan.steps.length === 0) return '';
  const stepLines = plan.steps.map((step, index) => `${index + 1}. ${step}`).join('\n');
  const toolLine = plan.tools.length ? `Tools expected to be needed: ${plan.tools.join(', ')}.` : 'Tools expected to be needed: none (answer from reasoning).';
  const provenance = plan.source === 'model'
    ? `Plan produced up-front by ${plan.model || 'the active model'}.`
    : 'Plan produced locally without model reasoning (planner call unavailable).';
  return [
    '[PRE-COMPUTED EXECUTION PLAN — think first, then act]',
    `Goal: ${plan.goal}`,
    'Steps:',
    stepLines,
    toolLine,
    provenance,
    'Work through these steps in order and verify them against the request. If a step proves wrong, fix it and continue — do not restart.',
    'Answer with the finished result only. Do not quote this plan back to the user.',
    '[END OF PLAN]',
  ].join('\n');
}

/**
 * Called by the model entrypoint before every real answer. Returns the plan block to
 * append to the system instruction, or null when planning was skipped/failed.
 *
 * Re-entrancy guard: the planner's own model call carries `internal: true`, and this
 * function also refuses to plan while another plan is being produced, so planning can
 * never recurse into itself.
 */
export async function planBeforeModelCall(
  params: { prompt?: string; internal?: boolean },
  rawCall: RawModelCall,
): Promise<string | null> {
  if (params.internal || planningInFlight) return null;
  const prompt = typeof params.prompt === 'string' ? params.prompt : '';
  if (!prompt.trim()) return null;

  planningInFlight = true;
  try {
    const plan = await producePlan({ prompt, callModel: rawCall });
    if (plan.steps.length === 0) return null;
    return renderPlan(plan);
  } catch (err: any) {
    console.warn('[Halye Planner] Skipped:', err?.message || err);
    return null;
  } finally {
    planningInFlight = false;
  }
}

export function getLastPlan(): CognitivePlan | null {
  return lastPlan;
}

export function clearPlanCache(): number {
  const size = planCache.size;
  planCache.clear();
  return size;
}

export function getPlannerStatus() {
  return {
    enabled: true,
    strategy: 'plan → act → verify (short planning call before the answering call)',
    planningModel: stats.model,
    planMaxTokens: PLAN_MAX_TOKENS,
    planTimeoutMs: PLAN_TIMEOUT_MS,
    cacheTtlMs: CACHE_TTL_MS,
    cacheEntries: planCache.size,
    counts: {
      plannedByModel: stats.planned,
      servedFromCache: stats.servedFromCache,
      skipped: stats.skipped,
      plannerCallFailed: stats.plannerCallFailed,
    },
    lastPlan,
    lastSkip,
    updatedAt: stats.updatedAt ? nowIso() : null,
  };
}
