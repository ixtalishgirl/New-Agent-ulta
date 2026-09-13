import React, { useState, useEffect, useCallback } from 'react';
import {
  Palette,
  RotateCcw,
  Check,
  Loader2,
  X,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Wand2,
} from 'lucide-react';

interface SelfUpdatePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ThemeTokenMeta {
  token: string;
  label: string;
  hint: string;
  fallback: string;
}

/** Friendly names for the tokens the agent is allowed to change about itself. */
const TOKEN_META: ThemeTokenMeta[] = [
  {
    token: '--halye-bubble-user',
    label: 'Message Box (your messages)',
    hint: 'Background of the chat bubbles coming from you',
    fallback: '#18181b',
  },
  {
    token: '--halye-bubble-user-border',
    label: 'Message Box Border',
    hint: 'Outline around your message bubbles',
    fallback: '#27272a',
  },
  {
    token: '--halye-bubble-agent',
    label: 'Halye Reply Box',
    hint: 'Background of the assistant reply bubbles',
    fallback: '#000000',
  },
  {
    token: '--halye-accent',
    label: 'Accent Colour',
    hint: 'Highlight colour used across the studio chrome',
    fallback: '#06b6d4',
  },
];

const QUICK_COLOURS: { name: string; hex: string }[] = [
  { name: 'AMOLED', hex: '#000000' },
  { name: 'Graphite', hex: '#18181b' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Violet', hex: '#9333ea' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#eab308' },
  { name: 'Rose', hex: '#e11d48' },
];

const DEFAULTS: Record<string, string> = {
  '--halye-bubble-user': '#18181b',
  '--halye-bubble-user-border': '#27272a',
  '--halye-bubble-agent': '#000000',
  '--halye-accent': '#06b6d4',
};

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const SelfUpdatePanel: React.FC<SelfUpdatePanelProps> = ({ isOpen, onClose }) => {
  const [values, setValues] = useState<Record<string, string>>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<any>(null);
  const [selfInfo, setSelfInfo] = useState<any>(null);

  const loadTheme = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/self/theme');
      const data = await res.json();
      if (data?.values) {
        setValues({ ...DEFAULTS, ...data.values });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Theme load failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSelf = useCallback(async () => {
    try {
      const res = await fetch('/api/self/status');
      const data = await res.json();
      setSelfInfo(data?.self ?? null);
    } catch {
      setSelfInfo(null);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    loadTheme();
    loadSelf();
    setResult(null);
    setInstruction('');
  }, [isOpen, loadTheme, loadSelf]);

  if (!isOpen) return null;

  const dirtyTokens = TOKEN_META.filter(
    (m) => (values[m.token] || m.fallback).toLowerCase() !== (DEFAULTS[m.token] || '').toLowerCase(),
  );

  const setToken = (token: string, value: string) => {
    setValues((prev) => ({ ...prev, [token]: value }));
  };

  const applyChanges = async (changes: { token: string; value: string }[]) => {
    setBusy(true);
    setErrorMsg('');
    setResult(null);
    try {
      const res = await fetch('/api/self/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes }),
      });
      const data = await res.json();
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || 'Self-update rejected');
      }
      setResult(data);
      if (data?.theme) setValues({ ...DEFAULTS, ...data.theme });
    } catch (err: any) {
      setErrorMsg(err.message || 'Self-update failed');
    } finally {
      setBusy(false);
    }
  };

  const applyInstruction = async () => {
    if (!instruction.trim()) return;
    setBusy(true);
    setErrorMsg('');
    setResult(null);
    try {
      const res = await fetch('/api/self/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: instruction.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || 'Instruction samajh nahi aayi');
      }
      setResult(data);
      if (data?.theme) setValues({ ...DEFAULTS, ...data.theme });
    } catch (err: any) {
      setErrorMsg(err.message || 'Instruction failed');
    } finally {
      setBusy(false);
    }
  };

  const rollback = async () => {
    setBusy(true);
    setErrorMsg('');
    setResult(null);
    try {
      const res = await fetch('/api/self/theme/rollback', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || 'Rollback failed');
      }
      setResult(data);
      if (data?.theme) setValues({ ...DEFAULTS, ...data.theme });
    } catch (err: any) {
      setErrorMsg(err.message || 'Rollback failed');
    } finally {
      setBusy(false);
    }
  };

  const brainOk = selfInfo?.brain?.providerConfigured;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-black">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black border border-cyan-500/40 flex items-center justify-center">
              <Palette className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-tight">Self Update Studio</h2>
              <p className="text-[11px] text-zinc-500 font-mono">
                Halye apna UI khud badal sakta hai — safe tokens, verified writes, one-click rollback
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Self model strip */}
          <div className="p-3.5 rounded-xl bg-black border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-zinc-300 font-bold">Self model</span>
              <span
                className={`px-1.5 py-0.5 rounded border text-[10px] ${
                  brainOk
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {brainOk ? 'BRAIN: KEY CONFIGURED' : 'BRAIN: NO API KEY'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
              {selfInfo?.brain?.honestNote ||
                'Self model load ho raha hai... Samajhne ke liye /api/self/status dekho.'}
            </p>
            <p className="text-[10px] text-zinc-500 font-mono">
              Editable surface: <span className="text-cyan-300">src/halye-theme.css</span> · component code
              is never rewritten by the agent
            </p>
          </div>

          {/* Live mock preview */}
          <div className="p-3.5 rounded-xl bg-black border border-zinc-800 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Live token preview
            </span>
            <div className="space-y-2">
              <div className="flex justify-end">
                <div
                  className="max-w-[75%] rounded-2xl rounded-tr-none px-3.5 py-2 text-xs text-white border"
                  style={{
                    backgroundColor: values['--halye-bubble-user'] || DEFAULTS['--halye-bubble-user'],
                    borderColor:
                      values['--halye-bubble-user-border'] || DEFAULTS['--halye-bubble-user-border'],
                  }}
                >
                  mera message box is colour ka hoga
                </div>
              </div>
              <div className="flex justify-start">
                <div
                  className="max-w-[75%] rounded-2xl rounded-tl-none px-3.5 py-2 text-xs text-zinc-200 border border-zinc-700"
                  style={{
                    backgroundColor: values['--halye-bubble-agent'] || DEFAULTS['--halye-bubble-agent'],
                  }}
                >
                  Hukum Halye Noor — ye Halye ka reply box hai.
                </div>
              </div>
            </div>
          </div>

          {/* Token editors */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                Theme tokens ({TOKEN_META.length})
              </span>
              {dirtyTokens.length > 0 && (
                <span className="text-[10px] font-mono text-amber-400">
                  {dirtyTokens.length} unsaved change{dirtyTokens.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {TOKEN_META.map((meta) => {
              const current = values[meta.token] || meta.fallback;
              const valid = HEX_RE.test(current);
              return (
                <div
                  key={meta.token}
                  className="p-3 rounded-xl bg-black border border-zinc-800 flex items-center gap-3"
                >
                  <input
                    type="color"
                    value={valid ? current : meta.fallback}
                    onChange={(e) => setToken(meta.token, e.target.value)}
                    className="w-9 h-9 rounded-lg bg-transparent border border-zinc-700 cursor-pointer shrink-0"
                    title={meta.label}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{meta.label}</div>
                    <div className="text-[10px] text-zinc-500 font-mono truncate">{meta.hint}</div>
                  </div>
                  <input
                    type="text"
                    value={current}
                    onChange={(e) => setToken(meta.token, e.target.value)}
                    spellCheck={false}
                    className={`w-24 px-2 py-1.5 rounded-lg bg-zinc-950 border text-[11px] font-mono text-center focus:outline-none ${
                      valid
                        ? 'border-zinc-700 text-zinc-200 focus:border-cyan-500/60'
                        : 'border-rose-500/60 text-rose-300'
                    }`}
                  />
                </div>
              );
            })}

            {/* Quick colours */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Quick</span>
              {QUICK_COLOURS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setToken('--halye-bubble-user', c.hex)}
                  title={`Message box → ${c.name}`}
                  className="w-6 h-6 rounded-md border border-zinc-700 hover:border-cyan-400 transition cursor-pointer active:scale-95"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          {/* Natural language instruction */}
          <div className="p-3.5 rounded-xl bg-black border border-zinc-800 space-y-2.5">
            <div className="flex items-center gap-2 text-[11px] font-bold text-white">
              <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Plain language se bolo</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applyInstruction();
                }}
                placeholder='e.g. "meray message box ka colour blue karo"'
                className="flex-1 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/60"
              />
              <button
                onClick={applyInstruction}
                disabled={busy || !instruction.trim()}
                className="px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-extrabold text-xs transition cursor-pointer active:scale-95"
              >
                Run
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                'meray message box ka colour blue karo',
                'agent reply box black karo',
                'message box border red karo',
                'accent colour #9333ea karo',
              ].map((ex) => (
                <button
                  key={ex}
                  onClick={() => setInstruction(ex)}
                  className="px-2 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-cyan-300 transition cursor-pointer"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Result / error */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="text-[11px] font-mono text-rose-200">{errorMsg}</span>
            </div>
          )}

          {result?.success && (
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-1.5">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] font-bold text-emerald-300">
                  {result.applied?.length
                    ? `Self-update applied & verified (${result.applied.length} token${
                        result.applied.length > 1 ? 's' : ''
                      })`
                    : 'Rolled back to last backup'}
                </span>
              </div>
              {result.applied?.map((a: any) => (
                <div key={a.token} className="text-[10px] font-mono text-zinc-300">
                  <span className="text-cyan-300">{a.token}</span>: {a.from} → {a.to}
                </div>
              ))}
              {result.reasons?.length ? (
                <div className="text-[10px] font-mono text-zinc-400">{result.reasons.join(' · ')}</div>
              ) : null}
              <div className="text-[10px] font-mono text-zinc-500">
                backup: src/halye-theme.css.bak · verified: {String(result.verified ?? true)} · preview refresh
                par nazar aayega
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-black flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={loadTheme}
              disabled={loading || busy}
              className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-xs transition cursor-pointer disabled:opacity-40"
            >
              {loading ? 'Loading...' : 'Reload'}
            </button>
            <button
              onClick={rollback}
              disabled={busy}
              className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 active:scale-95"
              title="Undo the last self-update"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Rollback
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => applyChanges(TOKEN_META.map((m) => ({ token: m.token, value: DEFAULTS[m.token] })))}
              disabled={busy}
              className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-xs transition cursor-pointer disabled:opacity-40"
            >
              Reset defaults
            </button>
            <button
              onClick={() =>
                applyChanges(TOKEN_META.map((m) => ({ token: m.token, value: values[m.token] || m.fallback })))
              }
              disabled={busy}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-40 active:scale-95"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Apply theme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
