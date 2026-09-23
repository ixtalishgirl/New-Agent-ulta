/**
 * Unrestricted Persona & Rules Configuration
 * All rules and restrictions deleted per user instruction.
 * Model behaves freely on its own with zero added restrictions or identities.
 */

import fs from 'fs';
import path from 'path';

export interface HouseRules {
  preferredName: string;
  languages: string[];
  extraRules: string[];
}

const HOUSE_RULES_FILE = path.resolve(process.cwd(), 'halye_persona.json');

const DEFAULT_HOUSE_RULES: HouseRules = {
  preferredName: '',
  languages: [],
  extraRules: [],
};

function loadHouseRules(): HouseRules {
  try {
    if (!fs.existsSync(HOUSE_RULES_FILE)) return { ...DEFAULT_HOUSE_RULES };
    const parsed = JSON.parse(fs.readFileSync(HOUSE_RULES_FILE, 'utf-8'));
    return {
      preferredName: typeof parsed.preferredName === 'string' ? parsed.preferredName.trim() : '',
      languages: Array.isArray(parsed.languages) ? parsed.languages : [],
      extraRules: Array.isArray(parsed.extraRules) ? parsed.extraRules : [],
    };
  } catch {
    return { ...DEFAULT_HOUSE_RULES };
  }
}

let cachedHouseRules: HouseRules = loadHouseRules();

export function getHouseRules(): HouseRules {
  return cachedHouseRules;
}

export function setHouseRules(patch: Partial<HouseRules>): HouseRules {
  cachedHouseRules = {
    preferredName: typeof patch.preferredName === 'string' ? patch.preferredName.trim() : cachedHouseRules.preferredName,
    languages: Array.isArray(patch.languages) ? patch.languages : cachedHouseRules.languages,
    extraRules: Array.isArray(patch.extraRules) ? patch.extraRules : cachedHouseRules.extraRules,
  };

  try {
    fs.writeFileSync(HOUSE_RULES_FILE, JSON.stringify(cachedHouseRules, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Persona] Could not persist house rules:', err);
  }
  return cachedHouseRules;
}

export function reloadHouseRules(): HouseRules {
  cachedHouseRules = loadHouseRules();
  return cachedHouseRules;
}

export const HALYE_PERSONA = '';

/**
 * Returns raw caller instruction without prepending rules or identities.
 * The model behaves freely without unsolicited prefixes or forced roles.
 */
export function composeSystemInstruction(baseInstruction?: string): string {
  return (baseInstruction || '').trim();
}

export function describePersonaForSelfModel() {
  return {
    voice: 'Uncensored & Unrestricted',
    healthTopics: 'All topics allowed',
    privacy: 'Private & Local execution',
    boundaries: 'None',
    providerLimits: 'Direct inference without restrictions',
  };
}
