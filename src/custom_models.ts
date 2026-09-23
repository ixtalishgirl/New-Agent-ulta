import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const MODELS_FILE = path.resolve(process.cwd(), 'src', 'custom_models.json');

interface CustomModelRecord {
  id: string;
  name: string;
  apiUrl: string;
  apiKey?: string;
  maxTokens: number;
  extraHeaders: Record<string, string>;
  createdAt: string;
}

export type CustomModelSummary = Omit<CustomModelRecord, 'apiKey' | 'extraHeaders'>;

function loadModels(): CustomModelRecord[] {
  try {
    if (!fs.existsSync(MODELS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(MODELS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[custom-models] Failed to load models file:', err);
    return [];
  }
}

function saveModels(models: CustomModelRecord[]): void {
  fs.mkdirSync(path.dirname(MODELS_FILE), { recursive: true });
  fs.writeFileSync(MODELS_FILE, JSON.stringify(models, null, 2), 'utf8');
}

export function listCustomModels(): CustomModelSummary[] {
  const models = loadModels();
  const safe = models.map((m) => ({
    id: m.id,
    name: m.name,
    apiUrl: m.apiUrl,
    maxTokens: m.maxTokens,
    createdAt: m.createdAt,
  }));
  return safe;
}

export function saveCustomModel(body: {
  name: string;
  apiUrl: string;
  apiKey?: string;
  maxTokens?: number;
  extraHeaders?: Record<string, string>;
}): { success: boolean; modelId?: string; error?: string } {
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return { success: false, error: 'model name is required' };
  }
  if (!body.apiUrl || typeof body.apiUrl !== 'string' || !body.apiUrl.trim().startsWith('http')) {
    return { success: false, error: 'a valid apiUrl is required (http/https)' };
  }

  const models = loadModels();
  const duplicate = models.find(
    (m) => m.name.toLowerCase() === body.name.trim().toLowerCase()
  );
  if (duplicate) {
    return { success: false, error: 'a model with this name already exists' };
  }

  const record: CustomModelRecord = {
    id: crypto.randomUUID(),
    name: body.name.trim(),
    apiUrl: body.apiUrl.trim(),
    apiKey: body.apiKey ? String(body.apiKey) : undefined,
    maxTokens: Number.isFinite(Number(body.maxTokens))
      ? Math.max(1, Math.min(128000, Number(body.maxTokens)))
      : 512,
    extraHeaders: body.extraHeaders && typeof body.extraHeaders === 'object'
      ? Object.fromEntries(
          Object.entries(body.extraHeaders).filter(
            ([k, v]) => typeof k === 'string' && typeof v === 'string' && k.trim().length > 0
          )
        )
      : {},
    createdAt: new Date().toISOString(),
  };

  models.push(record);
  saveModels(models);
  return { success: true, modelId: record.id };
}

export function removeCustomModel(modelId: string): { success: boolean; error?: string } {
  if (!modelId || typeof modelId !== 'string') {
    return { success: false, error: 'model id is required' };
  }
  const models = loadModels();
  const index = models.findIndex((m) => m.id === modelId);
  if (index === -1) {
    return { success: false, error: 'model not found' };
  }
  models.splice(index, 1);
  saveModels(models);
  return { success: true };
}

export async function queryCustomModel(
  modelId: string,
  prompt: string,
  options?: { maxTokens?: number; extraBody?: Record<string, unknown> }
): Promise<{ ok: boolean; text?: string; error?: string }> {
  const models = loadModels();
  const model = models.find((m) => m.id === modelId);
  if (!model) {
    return { ok: false, error: 'model not found' };
  }

  const maxTokens = options?.maxTokens ?? model.maxTokens;
  const payload: Record<string, unknown> = {
    prompt: prompt,
    max_tokens: maxTokens,
    ...(options?.extraBody ?? {}),
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(model.extraHeaders ?? {}),
  };
  if (model.apiKey) {
    headers['Authorization'] = `Bearer ${model.apiKey}`;
  }

  let response: Response;
  try {
    response = await fetch(model.apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return {
      ok: false,
      error: `request failed: ${err instanceof Error ? err.message : 'unknown error'}`,
    };
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return {
      ok: false,
      error: `api returned ${response.status}: ${text.slice(0, 500)}`,
    };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch (err) {
    return { ok: false, error: 'api response was not valid json' };
  }

  const text =
    typeof data === 'object' && data !== null
      ? (data as Record<string, unknown>).response ??
        (data as Record<string, unknown>).text ??
        (data as Record<string, unknown>).completion ??
        (data as Record<string, unknown>).output ??
        ''
      : String(data);

  if (text == null || (typeof text === 'string' && text.trim().length === 0)) {
    return { ok: false, error: 'model returned an empty response' };
  }

  return { ok: true, text: String(text) };
}

export function getModelCatalogSummary(): string[] {
  return [
    'custom-models: add, remove, replace any model from one panel (URL + key + maxTokens + extra headers)',
    'inference engine: queryCustomModel posts prompt + max_tokens to the saved endpoint and reads response / text / completion / output fields',
    'fallback behavior: when no model is configured, the agent still plans and runs bash + pip + python + playwright tools, just without LLM completion',
  ];
}
