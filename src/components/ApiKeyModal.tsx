import React, { useState, useEffect } from 'react';
import {
  Key,
  X,
  Check,
  Copy,
  Eye,
  EyeOff,
  Save,
  Download,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Lock,
  GitBranch,
  Sparkles
} from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeysUpdated,
}) => {
  const [nvidiaKey, setNvidiaKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [groqKey, setGroqKey] = useState('');

  const [showNvidia, setShowNvidia] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [showOpenrouter, setShowOpenrouter] = useState(false);
  const [showGroq, setShowGroq] = useState(false);

  const [configuredStatus, setConfiguredStatus] = useState<Record<string, { configured: boolean; masked: string | null }>>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [activeTab, setActiveTab] = useState<'keys' | 'github'>('keys');

  // Load existing configuration status on open
  useEffect(() => {
    if (isOpen) {
      fetch('/api/model/keys')
        .then((r) => r.json())
        .then((data) => {
          if (data.keys) {
            setConfiguredStatus(data.keys);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveKeys = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/model/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nvidiaKey: nvidiaKey.trim() || undefined,
          geminiKey: geminiKey.trim() || undefined,
          openrouterKey: openrouterKey.trim() || undefined,
          groqKey: groqKey.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        if (onKeysUpdated) onKeysUpdated();
        // Refresh status
        const statusRes = await fetch('/api/model/keys');
        const statusData = await statusRes.json();
        if (statusData.keys) {
          setConfiguredStatus(statusData.keys);
        }
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save API keys:', err);
    } finally {
      setSaving(false);
    }
  };

  const generateEnvContent = () => {
    const n = nvidiaKey.trim() || (configuredStatus.nvidia?.configured ? 'configured_in_environment' : '');
    const g = geminiKey.trim() || (configuredStatus.gemini?.configured ? 'configured_in_environment' : '');
    const o = openrouterKey.trim() || (configuredStatus.openrouter?.configured ? 'configured_in_environment' : '');
    const q = groqKey.trim() || (configuredStatus.groq?.configured ? 'configured_in_environment' : '');

    return `# Halye AI Assistant & 4-Core Models Secrets
# Add these variables to your GitHub Repository Secrets or .env file

NVIDIA_API_KEY=${n || 'your_nvidia_api_key_here'}
GEMINI_API_KEY=${g || 'your_gemini_api_key_here'}
OPENROUTER_API_KEY=${o || 'your_openrouter_api_key_here'}
GROQ_API_KEY=${q || 'your_groq_api_key_here'}
NVIDIA_MODEL=squad-ensemble
PORT=3000
NODE_ENV=production`;
  };

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(generateEnvContent());
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const handleDownloadEnv = () => {
    const blob = new Blob([generateEnvContent()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '.env';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="halye-api-key-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="halye-api-key-modal-dialog"
        className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-850 flex items-center justify-between bg-black">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                API Keys & GitHub Secrets
                <span className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-zinc-900 text-cyan-400 border border-zinc-800">
                  4-Model Squad
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Configure keys for the 4 core models and export to your GitHub repository.
              </p>
            </div>
          </div>
          <button
            id="close-api-key-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-zinc-850 bg-black/50 text-xs font-mono">
          <button
            onClick={() => setActiveTab('keys')}
            className={`px-3 py-2 border-b-2 font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'keys'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Enter API Keys</span>
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`px-3 py-2 border-b-2 font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'github'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>GitHub Repos & .env Export</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'keys' ? (
            <>
              {/* Squad banner */}
              <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-white">
                    1 Key for All 4 Models (NVIDIA NIM)
                  </p>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Apni <strong>NVIDIA API Key</strong> enter karein jo direct chaaron models ko power karti hai:
                    <span className="text-amber-300 font-mono"> Gemma 4 (31B)</span>,
                    <span className="text-emerald-300 font-mono"> Laguna XS (33B)</span>,
                    <span className="text-blue-300 font-mono"> DeepSeek V4 Pro</span>, aur
                    <span className="text-purple-300 font-mono"> MiniMax M3</span>.
                  </p>
                </div>
              </div>

              {/* 1. NVIDIA Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-zinc-200 flex items-center gap-1.5">
                    <span>NVIDIA NIM API Key</span>
                    <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/40 px-1.5 py-0.2 rounded border border-cyan-900/60">
                      Required for 4-Model Squad
                    </span>
                  </label>
                  {configuredStatus.nvidia?.configured && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                      <ShieldCheck className="w-3 h-3" />
                      Active: {configuredStatus.nvidia.masked}
                    </span>
                  )}
                </div>
                <div className="flex items-center bg-black border border-zinc-800 focus-within:border-cyan-500 rounded-xl px-3 py-2 text-xs transition">
                  <input
                    id="input-nvidia-api-key"
                    type={showNvidia ? 'text' : 'password'}
                    value={nvidiaKey}
                    onChange={(e) => setNvidiaKey(e.target.value)}
                    placeholder={
                      configuredStatus.nvidia?.configured
                        ? 'Key already active on server. Enter new key to replace.'
                        : 'nvapi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
                    }
                    className="flex-1 bg-transparent text-white outline-none font-mono text-xs placeholder:text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNvidia(!showNvidia)}
                    className="text-zinc-400 hover:text-white transition p-1"
                  >
                    {showNvidia ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500">
                  Free keys available at build.nvidia.com (1,000 free credits per model).
                </p>
              </div>

              {/* 2. Gemini API Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-zinc-200 flex items-center gap-1.5">
                    <span>Google Gemini API Key</span>
                    <span className="text-[10px] text-zinc-500 font-mono">(Google AI Studio / Fallback)</span>
                  </label>
                  {configuredStatus.gemini?.configured && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                      <ShieldCheck className="w-3 h-3" />
                      Active: {configuredStatus.gemini.masked}
                    </span>
                  )}
                </div>
                <div className="flex items-center bg-black border border-zinc-800 focus-within:border-cyan-500 rounded-xl px-3 py-2 text-xs transition">
                  <input
                    id="input-gemini-api-key"
                    type={showGemini ? 'text' : 'password'}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder={
                      configuredStatus.gemini?.configured
                        ? 'Configured via Google AI Studio environment'
                        : 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
                    }
                    className="flex-1 bg-transparent text-white outline-none font-mono text-xs placeholder:text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGemini(!showGemini)}
                    className="text-zinc-400 hover:text-white transition p-1"
                  >
                    {showGemini ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* 3. OpenRouter API Key (Optional) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-zinc-200 flex items-center gap-1.5">
                    <span>OpenRouter API Key</span>
                    <span className="text-[10px] text-zinc-500 font-mono">(Optional Multi-Provider)</span>
                  </label>
                  {configuredStatus.openrouter?.configured && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                      <ShieldCheck className="w-3 h-3" />
                      Active: {configuredStatus.openrouter.masked}
                    </span>
                  )}
                </div>
                <div className="flex items-center bg-black border border-zinc-800 focus-within:border-cyan-500 rounded-xl px-3 py-2 text-xs transition">
                  <input
                    id="input-openrouter-api-key"
                    type={showOpenrouter ? 'text' : 'password'}
                    value={openrouterKey}
                    onChange={(e) => setOpenrouterKey(e.target.value)}
                    placeholder="sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="flex-1 bg-transparent text-white outline-none font-mono text-xs placeholder:text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenrouter(!showOpenrouter)}
                    className="text-zinc-400 hover:text-white transition p-1"
                  >
                    {showOpenrouter ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* 4. Groq API Key (Optional Fast Llama fallback) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-zinc-200 flex items-center gap-1.5">
                    <span>Groq API Key</span>
                    <span className="text-[10px] text-zinc-500 font-mono">(Optional Ultra-Fast Inference)</span>
                  </label>
                  {configuredStatus.groq?.configured && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                      <ShieldCheck className="w-3 h-3" />
                      Active: {configuredStatus.groq.masked}
                    </span>
                  )}
                </div>
                <div className="flex items-center bg-black border border-zinc-800 focus-within:border-cyan-500 rounded-xl px-3 py-2 text-xs transition">
                  <input
                    id="input-groq-api-key"
                    type={showGroq ? 'text' : 'password'}
                    value={groqKey}
                    onChange={(e) => setGroqKey(e.target.value)}
                    placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="flex-1 bg-transparent text-white outline-none font-mono text-xs placeholder:text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGroq(!showGroq)}
                    className="text-zinc-400 hover:text-white transition p-1"
                  >
                    {showGroq ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* GitHub Repos & .env Export Tab */
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <Lock className="w-4 h-4" />
                  <span>GitHub Repository Secrets Guide</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Keys ko repository ke code me direct commit nahi kiya jata taake woh public leak na hon. GitHub ke official <strong>Repository Secrets</strong> me add karne se yeh aapki deployment me <strong>hamesha chalti rahengi</strong>:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-300 pt-1 font-sans">
                  <li>Apni GitHub Repo kholein → <strong>Settings</strong> tab par click karein.</li>
                  <li>Left sidebar se <strong>Secrets and variables</strong> → <strong>Actions</strong> select karein.</li>
                  <li><strong>New repository secret</strong> par click karein.</li>
                  <li>
                    Name: <code className="text-cyan-300 font-mono bg-black/60 px-1 py-0.5 rounded">NVIDIA_API_KEY</code>, Value: Apni key paste karein aur Save karein.
                  </li>
                  <li>
                    Optional: <code className="text-cyan-300 font-mono bg-black/60 px-1 py-0.5 rounded">GEMINI_API_KEY</code> bhi isi tarah add karein.
                  </li>
                </ol>
              </div>

              {/* Code block preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-300 font-mono flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    .env / Secrets Template
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyEnv}
                      className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-[11px] font-mono flex items-center gap-1 transition cursor-pointer"
                    >
                      {copiedEnv ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-cyan-400" />}
                      <span>{copiedEnv ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadEnv}
                      className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-[11px] font-mono flex items-center gap-1 transition cursor-pointer"
                    >
                      <Download className="w-3 h-3 text-emerald-400" />
                      <span>Download .env</span>
                    </button>
                  </div>
                </div>

                <pre className="p-3 rounded-xl bg-black border border-zinc-850 text-[11px] font-mono text-zinc-300 overflow-x-auto whitespace-pre leading-relaxed">
                  {generateEnvContent()}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-zinc-850 bg-black flex items-center justify-between">
          <div className="text-xs font-mono">
            {saveSuccess ? (
              <span className="text-emerald-400 flex items-center gap-1 font-bold animate-in fade-in">
                <Check className="w-4 h-4" />
                Keys saved to server runtime!
              </span>
            ) : (
              <span className="text-zinc-500 text-[11px]">
                Keys remain active in runtime memory.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-mono text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="save-api-keys-btn"
              type="button"
              onClick={handleSaveKeys}
              disabled={saving}
              className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save & Activate'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
