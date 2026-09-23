import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, RefreshCw, Globe, Key, Cpu, ExternalLink } from 'lucide-react';

interface QwenEndpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (status: 'online' | 'offline' | 'checking') => void;
}

export const QwenEndpointModal: React.FC<QwenEndpointModalProps> = ({ isOpen, onClose, onStatusChange }) => {
  const [baseUrl, setBaseUrl] = useState('https://sampling-stainless-research.ngrok-free.dev/v1');
  const [apiKey, setApiKey] = useState('sk-fake-key');
  const [modelName] = useState('noillum123/qwen3-8-27b-uncensored-fp8');
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const checkEndpoint = async (urlToCheck?: string, keyToCheck?: string) => {
    setIsTesting(true);
    setStatus('checking');
    try {
      const resp = await fetch('/api/custom-endpoint/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: urlToCheck || baseUrl,
          apiKey: keyToCheck || apiKey,
          model: modelName,
        }),
      });
      const data = await resp.json();
      if (data.online) {
        setStatus('online');
        setStatusMessage(`Connected successfully (${data.latencyMs}ms)`);
        setLatencyMs(data.latencyMs);
        onStatusChange?.('online');
      } else {
        setStatus('offline');
        setStatusMessage(data.error || 'Endpoint offline / ngrok tunnel disconnected');
        setLatencyMs(null);
        onStatusChange?.('offline');
      }
    } catch (err: any) {
      setStatus('offline');
      setStatusMessage(err.message || 'Connection test failed');
      setLatencyMs(null);
      onStatusChange?.('offline');
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Fetch active settings from server
      fetch('/api/custom-endpoint/status')
        .then((r) => r.json())
        .then((data) => {
          if (data.baseUrl) setBaseUrl(data.baseUrl);
          if (data.apiKey) setApiKey(data.apiKey);
          if (data.online) {
            setStatus('online');
            setStatusMessage(`Connected (${data.latencyMs || 0}ms)`);
            onStatusChange?.('online');
          } else {
            setStatus('offline');
            setStatusMessage(data.error || 'Endpoint offline');
            onStatusChange?.('offline');
          }
        })
        .catch(() => {
          checkEndpoint();
        });
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const resp = await fetch('/api/custom-endpoint/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl, apiKey }),
      });
      const data = await resp.json();
      if (data.success) {
        await checkEndpoint(baseUrl, apiKey);
      }
    } catch (e: any) {
      setStatusMessage(`Save failed: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="qwen-endpoint-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div id="qwen-endpoint-modal-dialog" className="w-full max-w-xl rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-6 space-y-5 text-zinc-100 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              👑
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Qwen 3 27B Uncensored Endpoint
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                  status === 'online'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                    : status === 'offline'
                    ? 'bg-red-950 text-red-300 border border-red-500/50'
                    : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {status === 'online' ? '● Online' : status === 'offline' ? '● Offline' : 'Checking...'}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Pure autonomous model • Zero restrictions • OpenAI-compatible vLLM</p>
            </div>
          </div>
          <button
            id="close-qwen-endpoint-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Card */}
        <div className={`p-4 rounded-xl border font-mono text-xs space-y-1.5 ${
          status === 'online'
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
            : status === 'offline'
            ? 'bg-red-950/30 border-red-500/40 text-red-300'
            : 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-2">
              {status === 'online' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
              {status === 'online' ? 'Endpoint Connected & Active' : 'Endpoint Offline / Not Reachable'}
            </span>
            {latencyMs !== null && (
              <span className="text-[11px] text-zinc-400">{latencyMs}ms latency</span>
            )}
          </div>
          <p className="text-[11px] opacity-90 break-all">{statusMessage}</p>
          {status === 'offline' && (
            <div className="mt-2 pt-2 border-t border-red-500/20 text-[11px] text-zinc-300 font-sans space-y-1">
              <p className="text-red-200 font-semibold">Agent jawab kyu nahi de raha tha?</p>
              <p className="text-zinc-400">
                Aapka ngrok tunnel (<code className="text-emerald-400 font-mono text-[10px]">sampling-stainless-research.ngrok-free.dev</code>) filhal offline hai (ERR_NGROK_3200).
                Apne system par vLLM aur ngrok start karein:
              </p>
              <pre className="p-2 rounded-lg bg-black/80 border border-zinc-800 text-emerald-400 text-[10px] overflow-x-auto">
                vllm serve noillum123/qwen3-8-27b-uncensored-fp8 --port 8000{'\n'}
                ngrok http 8000
              </pre>
              <p className="text-zinc-400">Agar naya ngrok URL bana hai to niche Base URL me update karke "Save & Connect" karein.</p>
            </div>
          )}
        </div>

        {/* Form Inputs */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-300 font-semibold mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              vLLM Endpoint Base URL:
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://your-tunnel.ngrok-free.dev/v1"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-cyan-500 focus:outline-none text-zinc-100 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              API Key (Optional / Fake Key for vLLM):
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-fake-key"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-cyan-500 focus:outline-none text-zinc-100 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              Active Model:
            </label>
            <div className="px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-850 text-emerald-300 font-mono text-xs flex items-center justify-between">
              <span>{modelName}</span>
              <span className="text-[10px] text-zinc-500 font-sans">Locked Sovereign Core</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-zinc-850 pt-4">
          <button
            type="button"
            onClick={() => checkEndpoint()}
            disabled={isTesting}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-950/40"
            >
              {isSaving ? 'Saving...' : 'Save & Connect'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default QwenEndpointModal;
