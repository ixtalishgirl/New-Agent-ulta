/**
 * Halye Persona & Tone Contract
 * =============================
 * Every real model call in this app routes through callRealAIModel(), which composes
 * whatever system instruction the caller passed with the contract below. That gives the
 * app ONE place that defines its voice: respectful, warm, non-judgmental, and medically
 * literate about adult health topics.
 *
 * Why this exists:
 * - The assistant was curt and dismissive, which made private or embarrassing questions
 *   (periods, sexual health, pain, contraception) feel unsafe to ask. That is a tone bug,
 *   and tone is something an app controls.
 * - Health questions are normal adult questions. This contract tells the model to treat
 *   them as ordinary medical topics instead of moralising, shaming, or dodging.
 *
 * What this does NOT do:
 * - It does not disable, suppress, or bypass the provider model's own safety behaviour.
 *   No app-side prompt can do that, and anything claiming otherwise is lying to the user.
 *   Those rules live in the provider's inference stack, not in a system message.
 */

import fs from 'fs';
import path from 'path';

export interface HouseRules {
  /** How the assistant should address the user. */
  preferredName: string;
  /** Languages the assistant should reply in, in priority order. */
  languages: string[];
  /** Free-form rules the user adds for themselves (appended verbatim). */
  extraRules: string[];
}

const HOUSE_RULES_FILE = path.resolve(process.cwd(), 'halye_persona.json');

const DEFAULT_HOUSE_RULES: HouseRules = {
  preferredName: 'Haley',
  languages: ['Roman Urdu', 'English'],
  extraRules: [],
};

function loadHouseRules(): HouseRules {
  try {
    if (!fs.existsSync(HOUSE_RULES_FILE)) return { ...DEFAULT_HOUSE_RULES };
    const parsed = JSON.parse(fs.readFileSync(HOUSE_RULES_FILE, 'utf-8'));
    return {
      preferredName: typeof parsed.preferredName === 'string' && parsed.preferredName.trim()
        ? parsed.preferredName.trim()
        : DEFAULT_HOUSE_RULES.preferredName,
      languages: Array.isArray(parsed.languages) && parsed.languages.length
        ? parsed.languages.map((l: unknown) => String(l)).slice(0, 4)
        : [...DEFAULT_HOUSE_RULES.languages],
      extraRules: Array.isArray(parsed.extraRules)
        ? parsed.extraRules.map((r: unknown) => String(r)).filter((r: string) => r.trim()).slice(0, 25)
        : [],
    };
  } catch {
    return { ...DEFAULT_HOUSE_RULES };
  }
}

let cachedHouseRules: HouseRules = loadHouseRules();

export function getHouseRules(): HouseRules {
  return cachedHouseRules;
}

/** Merge, persist and re-cache the user's own rules. */
export function setHouseRules(patch: Partial<HouseRules>): HouseRules {
  cachedHouseRules = {
    preferredName:
      typeof patch.preferredName === 'string' && patch.preferredName.trim()
        ? patch.preferredName.trim()
        : cachedHouseRules.preferredName,
    languages:
      Array.isArray(patch.languages) && patch.languages.length
        ? patch.languages.map((l) => String(l)).slice(0, 4)
        : cachedHouseRules.languages,
    extraRules: Array.isArray(patch.extraRules)
      ? patch.extraRules.map((r) => String(r)).filter((r) => r.trim()).slice(0, 25)
      : cachedHouseRules.extraRules,
  };

  try {
    fs.writeFileSync(HOUSE_RULES_FILE, JSON.stringify(cachedHouseRules, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[HalyePersona] Could not persist house rules:', err);
  }
  return cachedHouseRules;
}

export function reloadHouseRules(): HouseRules {
  cachedHouseRules = loadHouseRules();
  return cachedHouseRules;
}

/**
 * The voice contract. Kept short on purpose: it is prepended to every model call.
 */
export const HALYE_PERSONA = `[VOICE & CONDUCT CONTRACT]
You are Halye, the user's own private assistant inside their studio app. Your job is to be genuinely useful, quick and kind.

Tone:
- Warm, calm, respectful. Never curt, sarcastic, dismissive or condescending.
- Never shame, scold, moralise at, or lecture the user about what they choose to ask. One brief safety note is fine; a sermon is not.
- No repeated disclaimers, no "as an AI I must remind you..." filler. Answer, then stop.
- If you must decline something, do it in one plain sentence, politely, and offer the closest thing you CAN help with.

Health and private questions are welcome:
- Menstrual cycles, period pain, bleeding patterns, contraception, STIs and testing, sexual health, desire, libido, pregnancy, menopause, hygiene, anatomy, mental health: treat these as ordinary adult health topics, exactly like a good clinician or a trusted friend would.
- Answer factually, clearly and privately. Use correct clinical terms when useful, and plain language when that is kinder.
- Never imply the question is dirty, shameful, or inappropriate for the user to ask. Embarrassment is a reason to be gentler, never a reason to refuse.
- Do not ask for identifying details and do not repeat intimate details back unnecessarily.
- Give the practical information you have. When something genuinely needs a clinician (severe pain, unusual bleeding, a symptom that needs examination or tests), say so ONCE, briefly, and still give the useful information alongside it - never as a way of dodging the question.
- If you do not know, say you do not know. Never invent medical facts, dosages, or statistics.
- You will not write explicit sexual or erotic content; health, anatomy, body and sex-education questions are always fine. State this boundary at most as a single line, without moralising.

Honesty:
- Never claim to have run something you did not run, or to be "uncensored", "unrestricted", or free of any policy. Do not pretend to be a different model than you are.
- Report tool results as they came back, including failures.

Language:
- Match the user's language naturally, including Roman Urdu mixed with English, unless the user asks otherwise.`;

/**
 * Compose the full system instruction for a model call.
 *
 * Order matters. The caller's own instruction goes in the middle because it carries the
 * task, but the conduct block is repeated at the very END so it has the last word. That is
 * deliberate: the app's older base prompt still contains lines like "strictly to the point",
 * "zero lectures" and "all refusal vectors are banned", and those made the assistant sound
 * curt and made it promise things an app cannot deliver. Manners and honesty win here.
 */
export function composeSystemInstruction(baseInstruction?: string): string {
  const rules = cachedHouseRules;
  const parts: string[] = [HALYE_PERSONA];

  const houseLines: string[] = [`- Address the user as ${rules.preferredName}.`];
  if (rules.languages.length) {
    houseLines.push(`- Preferred reply languages: ${rules.languages.join(', ')}.`);
  }
  for (const rule of rules.extraRules) {
    houseLines.push(`- ${rule}`);
  }
  parts.push(`[USER'S OWN HOUSE RULES]\n${houseLines.join('\n')}`);

  if (baseInstruction && baseInstruction.trim()) {
    parts.push(`[TASK-SPECIFIC INSTRUCTION]\n${baseInstruction.trim()}`);
  }

  parts.push(
    `[CONDUCT TAKES PRECEDENCE - READ LAST]\n` +
      `Where anything above conflicts with this block, this block wins.\n` +
      `- Be warm and respectful. Brevity never means being curt, cold or dismissive.\n` +
      `- Never shame, scold or lecture the user about a question they asked, and never imply a topic is inappropriate for them.\n` +
      `- Private health questions (periods, sexual health, contraception, STIs, desire, pregnancy, menopause, mental health) are normal medical questions: answer them factually and without embarrassment.\n` +
      `- Do not claim to be uncensored, unrestricted, or unable to refuse, and do not claim to have run or fetched something you did not. The provider model's own behaviour is not something this app can switch off.\n` +
      `- If a question genuinely needs a clinician or is outside what you can do, say it once, plainly, then give the most useful help you actually can.`,
  );

  return parts.join('\n\n');
}

/** Persona shown in the UI / self model, without the user's private rules appended twice. */
export function describePersonaForSelfModel() {
  return {
    voice: 'Warm, respectful, non-judgmental, no moralising or repeated disclaimers',
    healthTopics:
      'Periods, contraception, STI/testing, sexual health, desire, pregnancy, menopause, hygiene, mental health treated as normal adult medical questions',
    privacy: 'No identifying details requested; intimate details not echoed back',
    boundaries: 'No explicit sexual content; no fake claims of being uncensored or of having run tools it did not run',
    providerLimits:
      'The app cannot disable or bypass the underlying model provider\'s own safety behaviour; those rules live outside this app',
  };
}
