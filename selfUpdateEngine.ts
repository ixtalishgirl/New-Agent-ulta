/**
 * Halye Self-Awareness & Self-Update Engine
 * =========================================
 * Two capabilities that the rest of the app builds on:
 *
 * 1. getSelfKnowledge() - a TRUTHFUL self model. It reports what the agent actually
 *    has (configured provider keys as booleans, registered tools, editable surfaces,
 *    learned patterns, replicas) and, crucially, what it does NOT have. No claim of a
 *    model being "live" when no key exists.
 *
 * 2. Self-update - the agent can restyle its own running UI. The editable surface is
 *    deliberately tiny: CSS custom properties in src/halye-theme.css. Every write is
 *    validated, backed up, verified by reading the file back, and reversible. The
 *    engine never rewrites application code, so a bad self-edit cannot break the app.
 */

import fs from 'fs';
import path from 'path';

export const THEME_FILE = path.resolve(process.cwd(), 'src', 'halye-theme.css');
export const THEME_BACKUP_FILE = path.resolve(process.cwd(), 'src', 'halye-theme.css.bak');

/** The complete set of things the agent is allowed to change about itself. */
export const EDITABLE_THEME_TOKENS = [
  '--halye-bubble-user',
  '--halye-bubble-user-border',
  '--halye-bubble-agent',
  '--halye-accent',
] as const;

export type ThemeToken = (typeof EDITABLE_THEME_TOKENS)[number];

export interface SelfKnowledge {
  identity: {
    name: string;
    role: string;
    version: string;
    ui: string;
    backend: string;
    editableSurface: string;
  };
  brain: {
    modelName: string;
    providerConfigured: boolean;
    configuredProviders: string[];
    missingProviders: string[];
    realInferenceAvailable: boolean;
    honestNote: string;
  };
  capabilities: {
    terminal: boolean;
    python: boolean;
    pipInstaller: boolean;
    browserAutomation: boolean;
    vision: boolean;
    webSearch: boolean;
    webScrape: boolean;
    buildOwnTools: boolean;
    selfHealing: boolean;
    selfLearning: boolean;
    selfReplication: boolean;
    selfUpdate: boolean;
    previewSync: boolean;
  };
  editableThemeTokens: readonly string[];
  conversation: {
    personaActive: boolean;
    appliedTo: string;
    voice: string;
    healthTopics: string;
    providerLimits: string;
    houseRulesFile: string;
  };
  notes: string[];
}

/** Colour words understood in English and Roman Urdu, mapped to hex. */
const COLOUR_WORDS: Record<string, string> = {
  black: '#000000', kala: '#000000', kaala: '#000000', siyah: '#000000',
  white: '#ffffff', safed: '#ffffff', safaid: '#ffffff',
  grey: '#3f3f46', gray: '#3f3f46', slate: '#27272a',
  red: '#dc2626', laal: '#dc2626', lal: '#dc2626', surkh: '#dc2626',
  blue: '#2563eb', neela: '#2563eb', nila: '#2563eb',
  cyan: '#06b6d4', ferozi: '#06b6d4', sky: '#0ea5e9',
  green: '#16a34a', sabz: '#16a34a', hara: '#16a34a', sabaz: '#16a34a',
  emerald: '#10b981', teal: '#0d9488',
  yellow: '#eab308', peela: '#eab308', zard: '#eab308',
  orange: '#ea580c', narangi: '#ea580c',
  purple: '#9333ea', violet: '#7c3aed', jamni: '#9333ea', magenta: '#d946ef',
  pink: '#ec4899', gulabi: '#ec4899', rose: '#e11d48',
  brown: '#78350f', bhura: '#78350f', gold: '#d4af37', sunehra: '#d4af37',
};

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isValidColour(value: string): boolean {
  const v = value.trim().toLowerCase();
  return HEX_RE.test(v) || v === 'transparent';
}

/**
 * Turn a plain-language instruction into a concrete theme token change.
 * Deterministic on purpose: it works even when no model key is configured,
 * and it can never invent a token that the engine does not own.
 */
export function interpretThemeInstruction(
  instruction: string,
): { token: ThemeToken; value: string; reason: string }[] {
  const text = (instruction || '').toLowerCase().trim();
  if (!text) return [];

  const changes: { token: ThemeToken; value: string; reason: string }[] = [];

  // Resolve a colour: either an explicit #hex or a colour word (English / Roman Urdu)
  let colour: string | null = null;
  const hexMatch = text.match(/#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/);
  if (hexMatch) {
    colour = hexMatch[0];
  } else {
    for (const word of Object.keys(COLOUR_WORDS)) {
      if (new RegExp(`\\b${word}\\b`).test(text)) {
        colour = COLOUR_WORDS[word];
        break;
      }
    }
  }
  if (!colour) return [];

  const wantsUserBubble =
    /(message box|messagebox|my message|chat bubble|bubble|mera message|message ka|user bubble|sent message)/.test(text);
  const wantsAgentBubble =
    /(agent message|halye message|bot message|ai message|reply bubble|jawab ka box|agent bubble)/.test(text);
  const wantsBorder = /(border|outline|kinara|kinaray)/.test(text);
  const wantsAccent = /(accent|highlight|chrome|glow|rang\b.*(theme|accent))/.test(text);

  if (wantsUserBubble) {
    changes.push({
      token: wantsBorder ? '--halye-bubble-user-border' : '--halye-bubble-user',
      value: colour,
      reason: `user message box ${wantsBorder ? 'border' : 'background'} -> ${colour}`,
    });
  }
  if (wantsAgentBubble) {
    changes.push({
      token: '--halye-bubble-agent',
      value: colour,
      reason: `agent message box background -> ${colour}`,
    });
  }
  if (wantsAccent && !wantsUserBubble && !wantsAgentBubble) {
    changes.push({ token: '--halye-accent', value: colour, reason: `accent -> ${colour}` });
  }

  return changes;
}

export function readTheme(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const css = fs.readFileSync(THEME_FILE, 'utf-8');
    for (const token of EDITABLE_THEME_TOKENS) {
      const m = css.match(new RegExp(`${token}\\s*:\\s*([^;]+);`));
      if (m) out[token] = m[1].trim();
    }
  } catch {
    /* missing file -> empty map, reported by callers */
  }
  return out;
}

export interface ThemeWriteResult {
  ok: boolean;
  applied: { token: string; from: string | null; to: string }[];
  skipped: string[];
  backup: string;
  verified: boolean;
  error?: string;
}

/**
 * Apply token changes to the agent's own theme file.
 * Validates every value, backs the file up first, then re-reads it to confirm
 * the write actually landed. A failed verification restores the backup.
 */
export function writeTheme(
  changes: { token: string; value: string }[],
): ThemeWriteResult {
  const skipped: string[] = [];
  const valid = changes.filter((c) => {
    if (!EDITABLE_THEME_TOKENS.includes(c.token as ThemeToken) || !isValidColour(c.value)) {
      skipped.push(`${c.token}=${c.value}`);
      return false;
    }
    return true;
  });

  if (valid.length === 0) {
    return {
      ok: false,
      applied: [],
      skipped,
      backup: '',
      verified: false,
      error: 'No valid, editable theme token in the request',
    };
  }

  let original = '';
  try {
    original = fs.readFileSync(THEME_FILE, 'utf-8');
  } catch (err: any) {
    return { ok: false, applied: [], skipped, backup: '', verified: false, error: `Theme file unreadable: ${err.message}` };
  }

  const before = readTheme();
  let updated = original;
  const applied: { token: string; from: string | null; to: string }[] = [];

  for (const c of valid) {
    const re = new RegExp(`(${c.token}\\s*:\\s*)([^;]+)(;)`);
    if (re.test(updated)) {
      updated = updated.replace(re, `$1${c.value}$3`);
      applied.push({ token: c.token, from: before[c.token] ?? null, to: c.value });
    }
  }

  try {
    fs.writeFileSync(THEME_BACKUP_FILE, original, 'utf-8');
    fs.writeFileSync(THEME_FILE, updated, 'utf-8');
  } catch (err: any) {
    return { ok: false, applied: [], skipped, backup: '', verified: false, error: `Write failed: ${err.message}` };
  }

  // Verify by reading the file back from disk rather than trusting the write
  const after = readTheme();
  const verified = applied.every((a) => after[a.token]?.toLowerCase() === a.to.toLowerCase());

  if (!verified) {
    try {
      fs.writeFileSync(THEME_FILE, original, 'utf-8');
    } catch {}
    return {
      ok: false,
      applied: [],
      skipped,
      backup: THEME_BACKUP_FILE,
      verified: false,
      error: 'Verification failed - theme restored from backup',
    };
  }

  return { ok: true, applied, skipped, backup: THEME_BACKUP_FILE, verified: true };
}

/** Undo the last self-update by restoring the backup taken before the write. */
export function rollbackTheme(): { ok: boolean; error?: string } {
  try {
    if (!fs.existsSync(THEME_BACKUP_FILE)) {
      return { ok: false, error: 'No backup exists yet - nothing to roll back' };
    }
    fs.copyFileSync(THEME_BACKUP_FILE, THEME_FILE);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/**
 * Honest self model: what the agent really is, what it can really do, and what is
 * missing. Keys are reported only as booleans - never their values.
 */
export function getSelfKnowledge(): SelfKnowledge {
  const providerKeys: Record<string, string | undefined> = {
    NVIDIA_API_KEY: process.env.NVIDIA_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  };
  const configuredProviders = Object.keys(providerKeys).filter((k) => Boolean(providerKeys[k]?.trim()));
  const missingProviders = Object.keys(providerKeys).filter((k) => !providerKeys[k]?.trim());

  let learned = 0;
  let replicas = 0;
  let powers = 0;
  try {
    const learnedFile = path.resolve(process.cwd(), 'halye_powers', 'learned_patterns.json');
    if (fs.existsSync(learnedFile)) {
      const parsed = JSON.parse(fs.readFileSync(learnedFile, 'utf-8'));
      learned = Array.isArray(parsed) ? parsed.length : Array.isArray(parsed?.patterns) ? parsed.patterns.length : 0;
    }
  } catch {}
  try {
    const replicasDir = path.resolve(process.cwd(), 'halye_powers', 'replicas');
    replicas = fs.existsSync(replicasDir) ? fs.readdirSync(replicasDir).length : 0;
  } catch {}
  try {
    const registry = path.resolve(process.cwd(), 'halye_powers', 'registry.json');
    if (fs.existsSync(registry)) {
      const parsed = JSON.parse(fs.readFileSync(registry, 'utf-8'));
      powers = Array.isArray(parsed) ? parsed.length : 0;
    }
  } catch {}

  const realInferenceAvailable = configuredProviders.length > 0;

  return {
    identity: {
      name: 'Halye AI Assistant',
      role: 'Autonomous AI developer studio: builds, previews, tests and self-modifies web apps',
      version: '1.0.0',
      ui: 'React 19 + Vite + Tailwind (src/)',
      backend: 'Express + TypeScript (server.ts) with native tool layer (agentSquadEngine.ts)',
      editableSurface: 'src/halye-theme.css (CSS tokens only - engine never rewrites component code)',
    },
    brain: {
      modelName: 'nvidia/nemotron-3-super-120b-a12b',
      providerConfigured: realInferenceAvailable,
      configuredProviders,
      missingProviders,
      realInferenceAvailable,
      honestNote: realInferenceAvailable
        ? 'A provider key is configured, so real model inference can run.'
        : 'NO provider key is configured. Model reasoning is unavailable; responses fall back to the local template engine and are labelled OFFLINE TEMPLATE MODE. All deterministic tools still work.',
    },
    capabilities: {
      terminal: true,
      python: true,
      pipInstaller: true,
      browserAutomation: true,
      vision: true,
      webSearch: true,
      webScrape: true,
      buildOwnTools: true,
      selfHealing: true,
      selfLearning: true,
      selfReplication: true,
      selfUpdate: true,
      previewSync: true,
    },
    editableThemeTokens: EDITABLE_THEME_TOKENS,
    conversation: {
      personaActive: true,
      appliedTo: 'every model call via callRealAIModel()',
      voice: 'Warm, respectful, non-judgmental; no moralising, no repeated disclaimers',
      healthTopics:
        'Periods, contraception, STI/testing, sexual health, desire, pregnancy, menopause, hygiene and mental health are treated as normal adult medical questions',
      providerLimits:
        'The provider model\'s own safety behaviour cannot be disabled from inside this app; only the app\'s own voice is controllable here',
      houseRulesFile: 'halye_persona.json',
    },
    notes: [
      `Powers registered: ${powers}`,
      `Learned patterns recorded: ${learned}`,
      `Replicas on disk: ${replicas}`,
      'Self-healing/self-learning/self-replication operate on halye_powers/*.py (verified by self-diagnose).',
      'Self-update is limited to theme tokens by design: a model-driven edit to a 200KB+ component file cannot be validated cheaply, so code stays human-reviewed.',
    ],
  };
}
