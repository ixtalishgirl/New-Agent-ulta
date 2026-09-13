import React, { useCallback, useEffect, useState } from 'react';
import {
  Key,
  X,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Zap,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

interface NemotronKeyPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NemotronKeyStatus {
  configured: boolean;
  hasOwnKey?: boolean;
  masked: string | null;
}

/**
 * Dedicated, always-reachable place to store the Nemotron-3 Super 120B API key.
 * Saves through POST /api/model/keys with `nemotronKey`, which the backend now
 * accepts and mirrors to a local keystore so the key survives restarts.
 */
export const NemotronKeyPanel: React.FC<NemotronKeyPanelProps> = ({ isOpen, onClose }) => {
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<NemotronKeyStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/model/keys');
      const data = await res.json();
      if (data?.success && data.keys?.nemotron) {
        setStatus(data.keys.nemotron);
      }
    } catch {
      /* status is best-effort only */
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setKeyInput('');
      setFeedback(null);
      loadStatus();
    }
  }, [isOpen, loadStatus]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const cleanKey = keyInput.trim();
    if (!cleanKey) {
      setFeedback({ kind: 'err', text: 'Pehle apni NVIDIA key (nvapi-...) paste karein.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/model/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nemotronKey: cleanKey }),
      });
      const data = await res.json();
      if (data?.success) {
        setKeyInput('');
        setFeedback({
          kind: 'ok',
          text: '✓ Nemotron key save ho gayi aur activate ho gayi. Server restart ke baad bhi rahegi.',
        });
        loadStatus();
      } else {
        setFeedback({ kind: 'err', text: `Save fail: ${data?.error || 'unknown error'}` });
      }
    } catch (err: any) {
      setFeedback({ kind: 'err', text: `Save error: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/model/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'nvidia',
          model: 'nvidia/nemotron-3-super-120b-a12b',
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setFeedback({
          kind: 'ok',
          text: `✓ Model jawab de raha hai (${data.durationMs}ms): ${String(data.response || '').slice(0, 240)}`,
        });
      } else {
        setFeedback({
          kind: 'err',
          text: `Test fail: ${data?.error || 'key invalid ya network block hai'}`,
        });
      }
    } catch (err: any) {
      setFeedback({ kind: 'err', text: `Test error: ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  const hasKey = Boolean(status?.configured);

  return (
    <div
      id="nemotron-key-panel-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="nemotron-key-panel-dialog"
        className="bg-zinc-950 border border-emerald-500/40 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-850 flex items-center justify-between bg-black">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Nemotron-3 Super 120B — API Key</h2>
              <p className="text-xs text-zinc-400">
                Default brain ka key yahan save karein. Disk par persist hota hai.
              </p>
            </div>
          </div>
          <button
            id="close-nemotron-key-panel-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-black border border-zinc-850">
            <div className="flex items-center gap-2 text-xs font-mono">
              {hasKey ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Key Active</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 font-bold">Key Missing</span>
                </>
              )}
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              {hasKey ? status?.masked || 'stored' : 'agent offline fallback par chalega'}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span>NVIDIA API Key</span>
              <span className="text-[10px] font-mono text-zinc-500">(nvapi-...)</span>
            </label>
            <div className="flex items-center bg-black border border-zinc-800 focus-within:border-emerald-500 rounded-xl px-3 py-2 transition">
              <input
                id="input-nemotron-api-key"
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder={hasKey ? 'Naya key paste karein (replace karne ke liye)' : 'nvapi-xxxxxxxxxxxxxxxxxxxxxxxx'}
                className="flex-1 bg-transparent text-white outline-none font-mono text-xs placeholder:text-zinc-600"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-zinc-400 hover:text-white transition p-1 cursor-pointer"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <a
              href="https://build.nvidia.com"
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-cyan-400 hover:underline font-mono flex items-center gap-1 w-fit"
            >
              <span>build.nvidia.com par free key lein</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          {feedback && (
            <div
              className={`p-2.5 rounded-lg text-[11px] font-mono ${
                feedback.kind === 'ok'
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/50'
                  : 'bg-rose-950/40 text-rose-300 border border-rose-800/50'
              }`}
            >
              {feedback.text}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              <span>Save Nemotron Key</span>
            </button>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              <span>Test</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NemotronKeyPanel;
