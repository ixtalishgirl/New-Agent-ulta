import { useState, useCallback } from 'react';
import {
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export interface CustomModelSummary {
  id: string;
  name: string;
  apiUrl: string;
  maxTokens: number;
  createdAt: string;
}

function classNames(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export default function CustomModelPanelInner() {
  const [models, setModels] = useState<CustomModelSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const hideNotification = useCallback(() => setNotification(null), []);

  const loadModels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/models/local/list');
      if (!res.ok) throw new Error('failed to load models');
      const json = await res.json();
      setModels(Array.isArray(json.models) ? json.models : []);
      if (json.models.length > 0 && !activeModelId) {
        setActiveModelId(json.models[0].id);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        text: `Could not load custom models: ${err instanceof Error ? err.message : 'unknown error'}`,
      });
    } finally {
      setLoading(false);
    }
  }, [activeModelId]);

  const saveModel = useCallback(
    async (model: {
      name: string;
      apiUrl: string;
      apiKey?: string;
      maxTokens?: number;
      extraHeaders?: Record<string, string>;
    }) => {
      setSaving(true);
      try {
        const res = await fetch('/api/models/local', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(model),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'failed to save model');
        }
        setNotification({ type: 'success', text: `Custom model “${model.name}” saved.` });
        await loadModels();
      } catch (err) {
        setNotification({
          type: 'error',
          text: `Could not save model: ${err instanceof Error ? err.message : 'unknown error'}`,
        });
      } finally {
        setSaving(false);
      }
    },
    [loadModels]
  );

  const removeModel = useCallback(
    async (modelId: string) => {
      setRemoving(modelId);
      try {
        const res = await fetch(`/api/models/local/${encodeURIComponent(modelId)}`, {
          method: 'DELETE',
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'failed to remove model');
        }
        setNotification({ type: 'success', text: 'Custom model removed.' });
        if (activeModelId === modelId) {
          setActiveModelId(null);
        }
        await loadModels();
      } catch (err) {
        setNotification({
          type: 'error',
          text: `Could not remove model: ${err instanceof Error ? err.message : 'unknown error'}`,
        });
      } finally {
        setRemoving(null);
      }
    },
    [activeModelId, loadModels]
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="font-semibold text-sm tracking-tight text-white">
            Custom Models
          </h3>
          <p className="text-xs text-zinc-500">
            Add, remove, or replace any model endpoint here. The agent queries the one you pick.
          </p>
        </div>
        <button
          type="button"
          onClick={loadModels}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Refreshing
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </>
          )}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-900/70 bg-zinc-950/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-medium text-xs uppercase tracking-wider text-zinc-400">
              Saved endpoints
            </h4>
            <span className="rounded-full bg-zinc-900/70 px-2 py-0.5 text-[10px] font-mono text-zinc-500">
              {models.length}
            </span>
          </div>

          {models.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800/70 py-6 text-center">
              <p className="text-xs text-zinc-500">
                No custom models yet. Create one to use a local or self-hosted inference engine.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {models.map((model) => (
                <li
                  key={model.id}
                  className={classNames(
                    'flex flex-col gap-1.5 rounded-xl border px-3.5 py-3 transition',
                    activeModelId === model.id
                      ? 'border-cyan-500/60 bg-cyan-500/5'
                      : 'border-zinc-800/70 bg-zinc-950/30',
                    'hover:border-zinc-700/80'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-sm text-white">
                          {model.name}
                        </span>
                        {activeModelId === model.id && (
                          <span className="shrink-0 rounded-full bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-cyan-300">
                            active
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-zinc-500">{model.apiUrl}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeModel(model.id)}
                      disabled={removing === model.id}
                      className="shrink-0 rounded-lg p-1.5 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label={`Remove model ${model.name}`}
                    >
                      {removing === model.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                    <span className="rounded bg-zinc-900/60 px-1.5 py-0.5 font-mono">
                      {model.maxTokens}
                    </span>
                    <span>tokens</span>
                    <span className="flex-1" />
                    <span className="text-zinc-600">
                      {model.createdAt ? new Date(model.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-900/70 bg-zinc-950/40 p-4">
          <h4 className="mb-3 font-medium text-xs uppercase tracking-wider text-zinc-400">
            Endpoint editor
          </h4>

          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">Model name</label>
              <input
                type="text"
                id="model-name"
                placeholder="e.g. local-kaggle-nemo"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-cyan-500/70 focus:bg-zinc-900"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">
                Inference endpoint URL
              </label>
              <input
                type="url"
                id="model-url"
                placeholder="https://your-host/generate"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-cyan-500/70 focus:bg-zinc-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">Max tokens</label>
                <input
                  type="number"
                  id="model-max-tokens"
                  defaultValue={512}
                  min={1}
                  max={128000}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-500/70 focus:bg-zinc-900"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">API key <span className="text-zinc-600">(optional)</span></label>
                <input
                  type="password"
                  id="model-apikey"
                  placeholder="sk-... or leave blank"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-cyan-500/70 focus:bg-zinc-900"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">
                Extra headers <span className="text-zinc-600">(optional, JSON)</span>
              </label>
              <textarea
                id="model-extra-headers"
                rows={2}
                placeholder='{"ngrok-skip-browser-warning":"true"}'
                className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-cyan-500/70 focus:bg-zinc-900 font-mono"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <button
                type="button"
                onClick={loadModels}
                disabled={loading || saving}
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-300 transition hover:border-zinc-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Load list
              </button>
              <button
                type="button"
                onClick={async () => {
                  const nameInput = document.getElementById('model-name') as HTMLInputElement;
                  const urlInput = document.getElementById('model-url') as HTMLInputElement;
                  const tokensInput = document.getElementById('model-max-tokens') as HTMLInputElement;
                  const keyInput = document.getElementById('model-apikey') as HTMLInputElement;
                  const headersInput = document.getElementById('model-extra-headers') as HTMLTextAreaElement;

                  const name = nameInput.value.trim();
                  const apiUrl = urlInput.value.trim();
                  const maxTokens = Number(tokensInput.value);
                  const apiKey = keyInput.value.trim() || undefined;
                  let extraHeaders: Record<string, string> | undefined;

                  if (headersInput.value.trim().length > 0) {
                    try {
                      const parsed = JSON.parse(headersInput.value.trim());
                      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                        extraHeaders = parsed;
                      }
                    } catch {
                      setNotification({
                        type: 'error',
                        text: 'Extra headers must be valid JSON.',
                      });
                      return;
                    }
                  }

                  if (!name) {
                    setNotification({ type: 'error', text: 'Model name is required.' });
                    return;
                  }
                  if (!apiUrl) {
                    setNotification({ type: 'error', text: 'Endpoint URL is required.' });
                    return;
                  }

                  await saveModel({ name, apiUrl, apiKey, maxTokens, extraHeaders });
                  nameInput.value = '';
                  urlInput.value = '';
                  tokensInput.value = '512';
                  keyInput.value = '';
                  headersInput.value = '';
                }}
                disabled={loading || saving}
                className="flex-1 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-medium text-black transition hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save model'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {models.length > 0 && (
        <div className="rounded-2xl border border-zinc-900/70 bg-zinc-950/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-medium text-xs uppercase tracking-wider text-zinc-400">
              Agent model selection
            </h4>
            <span className="text-[11px] text-zinc-500">
              Queries go to the endpoint you mark active.
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {models.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => setActiveModelId(model.id)}
                className={classNames(
                  'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition',
                  activeModelId === model.id
                    ? 'border-cyan-500/70 bg-cyan-500/10 text-cyan-200'
                    : 'border-zinc-800/80 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700/80'
                )}
              >
                <CheckCircle
                  className={classNames(
                    'h-3.5 w-3.5',
                    activeModelId === model.id ? 'text-cyan-300' : 'text-zinc-600'
                  )}
                />
                <span className="truncate max-w-[160px]">{model.name}</span>
                <ExternalLink className="shrink-0 h-3 w-3 opacity-60" />
              </button>
            ))}
          </div>
        </div>
      )}

      {notification && (
        <div
          className={classNames(
            'rounded-xl border px-4 py-3 text-sm shadow-2xl transition animate-[fade-in_150ms_ease]',
            notification.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : 'border-red-500/40 bg-red-500/10 text-red-200'
          )}
          role="status"
        >
          {notification.type === 'success' ? (
            <CheckCircle className="inline h-4 w-4 shrink-0 text-emerald-300" />
          ) : (
            <XCircle className="inline h-4 w-4 shrink-0 text-red-300" />
          )}
          <span className="ml-2">{notification.text}</span>
          <button
            type="button"
            onClick={hideNotification}
            className="ml-auto text-current opacity-60 hover:opacity-100"
            aria-label="Dismiss"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
