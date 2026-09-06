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
  const [gemmaKey, setGemmaKey] = useState('');
  const [lagunaKey, setLagunaKey] = useState('');
  const [deepseekKey, setDeepseekKey] = useState('');
  const [minimaxKey, setMinimaxKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');

  const [showNvidia, setShowNvidia] = useState(false);
  const [showGemma, setShowGemma] = useState(false);
  const [showLaguna, setShowLaguna] = useState(false);
  const [showDeepseek, setShowDeepseek] = useState(false);
  const [showMinimax, setShowMinimax] = useState(false);
  const [showGemini, setShowGemini] = useState(false);

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
          gemmaKey: gemmaKey.trim() || undefined,
          lagunaKey: lagunaKey.trim() || undefined,
          deepseekKey: deepseekKey.trim() || undefined,
          minimaxKey: minimaxKey.trim() || undefined,
          geminiKey: geminiKey.trim() || undefined,
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
    const gm = gemmaKey.trim() || (configuredStatus.gemma?.configured ? 'configured_in_environment' : '');
    const lg = lagunaKey.trim() || (configuredStatus.laguna?.configured ? 'configured_in_environment' : '');
    const ds = deepseekKey.trim() || (configuredStatus.deepseek?.configured ? 'configured_in_environment' : '');
    const mm = minimaxKey.trim() || (configuredStatus.minimax?.configured ? 'configured_in_environment' : '');
    const g = geminiKey.trim() || (configuredStatus.gemini?.configured ? 'configured_in_environment' : '');

    return `# Halye AI Assistant & 4-Core Models Secrets
# Add these variables to your GitHub Repository Secrets or .env file

# Master NVIDIA NIM API Key (Powers all 4 Models simultaneously)
NVIDIA_API_KEY=${n || 'your_nvidia_api_key_here'}

# Individual Model API Keys
GEMMA_API_KEY=${gm || ''}
LAGUNA_API_KEY=${lg || ''}
DEEPSEEK_API_KEY=${ds || ''}
MINIMAX_API_KEY=${mm || ''}

# Google AI Studio Fallback Key
GEMINI_API_KEY=${g || ''}

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
              {/* Squad banner & 4 Models Grid */}
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-cyan-500/30 text-xs text-zinc-300 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white text-sm">
                      4 Real AI Models Squad Activation
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 font-mono text-[10px]">
                    Zero Fake Responses
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                  <div className="p-2 rounded-lg bg-black border border-zinc-800">
                    <div className="text-cyan-400 font-bold flex items-center gap-1 text-[10px]">
                      <span>💎</span> Model 1
                    </div>
                    <div className="text-white font-semibold truncate text-[11px] mt-0.5">Gemma 4 (31B)</div>
                    <div className="text-zinc-500 text-[9px]">Lead Orchestrator</div>
                  </div>
                  <div className="p-2 rounded-lg bg-black border border-zinc-800">
                    <div className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                      <span>⚡</span> Model 2
                    </div>
                    <div className="text-white font-semibold truncate text-[11px] mt-0.5">Laguna XS (33B)</div>
                    <div className="text-zinc-500 text-[9px]">Terminal Master</div>
                  </div>
                  <div className="p-2 rounded-lg bg-black border border-zinc-800">
                    <div className="text-indigo-400 font-bold flex items-center gap-1 text-[10px]">
                      <span>🧠</span> Model 3
                    </div>
                    <div className="text-white font-semibold truncate text-[11px] mt-0.5">DeepSeek V4</div>
                    <div className="text-zinc-500 text-[9px]">Deep Logic & Code</div>
                  </div>
                  <div className="p-2 rounded-lg bg-black border border-zinc-800">
                    <div className="text-fuchsia-400 font-bold flex items-center gap-1 text-[10px]">
                      <span>👁️</span> Model 4
                    </div>
                    <div className="text-white font-semibold truncate text-[11px] mt-0.5">MiniMax M3</div>
                    <div className="text-zinc-500 text-[9px]">UI Reviewer & QA</div>
                  </div>
                </div>

                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  💡 <strong>Tip:</strong> Aap chaaron models ke liye alag alag API keys enter kar sakte hain, ya sirf <strong>1 Master NVIDIA NIM API Key (<code className="text-cyan-300">nvapi-...</code>)</strong> se in sabhi ko ek sath live connect kar sakte hain (Free credits at <em>build.nvidia.com</em>).
                </p>
              </div>

              {/* Master NVIDIA Key */}
              <div className="space-y-1.5 p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/40">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-white flex items-center gap-1.5">
                    <span>🌐 Master NVIDIA NIM API Key</span>
                    <span className="text-[10px] text-cyan-300 font-mono bg-cyan-900/60 px-1.5 py-0.2 rounded border border-cyan-700/60">
                      Universal 4-Model Key
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
                    className="text-zinc-400 hover:text-white transition p-1 cursor-pointer"
                  >
                    {showNvidia ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Powers Gemma 4, Laguna XS, DeepSeek V4, and MiniMax M3 automatically. Free keys at build.nvidia.com.
                </p>
              </div>

              {/* 4 Dedicated Model API Keys Section */}
              <div className="pt-2 space-y-3 border-t border-zinc-850">
                <div className="text-xs font-mono font-bold text-zinc-300 flex items-center justify-between">
                  <span>DEDICATED PER-MODEL API KEYS (OPTIONAL OVERRIDES)</span>
                  <span className="text-[10px] text-zinc-500">Individual Control</span>
                </div>

                {/* Model 1: Google Gemma 4 Key */}
                <div className="space-y-1.5 p-2.5 rounded-xl bg-black/60 border border-zinc-800">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-cyan-400 flex items-center gap-1.5">
                      <span>💎 Google Gemma 4 (31B) Key</span>
                    </label>
                    {configuredStatus.gemma?.configured && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                        <ShieldCheck className="w-3 h-3" /> Active: {configuredStatus.gemma.masked}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center bg-zinc-950 border border-zinc-800 focus-within:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs transition">
                    <input
                      type={showGemma ? 'text' : 'password'}
                      value={gemmaKey}
                      onChange={(e) => setGemmaKey(e.target.value)}
                      placeholder="Gemma 4 Dedicated API Key (nvapi-...)"
                      className="flex-1 bg-transparent text-white outline-none font-mono text-xs placeholder:text-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGemma(!showGemma)}
                      className="text-zinc-400 hover:text-white transition p-1 cursor-pointer"
                    >
                      {showGemma ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Model 2: Poolside Laguna XS Key */}
                <div className="space-y-1.5 p-2.5 rounded-xl bg-black/60 border border-zinc-800">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <span>⚡ Poolside Laguna XS (33B) Key</span>
                    </label>
                    {configuredStatus.laguna?.configured && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                        <ShieldCheck className="w-3 h-3" /> Active: {configuredStatus.laguna.masked}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center bg-zinc-950 border border-zinc-800 focus-within:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs transition">
                    <input
                      type={showLaguna ? 'text' : 'password'}
                      value={lagunaKey}
                      onChange={(e) => setLagunaKey(e.target.value)}
                      placeholder="Laguna XS Dedicated API Key (nvapi-...)"
                      className="flex-1 bg-transparent text-white outline-none font-mono text-xs placeholder:text-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLaguna(!showLaguna)}
                      className="text-zinc-400 hover:text-white transition p-1 cursor-pointer"
                    >
                      {showLaguna ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Model 3: DeepSeek V4 Key */}
                <div className="space-y-1.5 p-2.5 rounded-xl bg-black/60 border border-zinc-800">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-indigo-400 flex items-center gap-1.5">
                      <span>🧠 DeepSeek V4 Pro (1M MoE) Key</span>
                    </label>
                    {configuredStatus.deepseek?.configured && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                        <ShieldCheck className="w-3 h-3" /> Active: {configuredStatus.deepseek.masked}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center bg-zinc-950 border border-zinc-800 focus-within:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs transition">
                    <input
                      type={showDeepseek ? 'text' : 'password'}
                      value={deepseekKey}
                      onChange={(e) => setDeepseekKey(e.target.value)}
                      placeholder="DeepSeek V4 Dedicated Key (nvapi-... or sk-...)"
                      className="flex-1 bg-transparent text-white outline-none font-mono text-xs placeholder:text-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeepseek(!showDeepseek)}
                      className="text-zinc-400 hover:text-white transition p-1 cursor-pointer"
                    >
                      {showDeepseek ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Model 4: MiniMax M3 Key */}
                <div className="space-y-1.5 p-2.5 rounded-xl bg-black/60 border border-zinc-800">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-fuchsia-400 flex items-center gap-1.5">
                      <span>👁️ MiniMax M3 (Multimodal) Key</span>
                    </label>
                    {configuredStatus.minimax?.configured && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                        <ShieldCheck className="w-3 h-3" /> Active: {configuredStatus.minimax.masked}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center bg-zinc-950 border border-zinc-800 focus-within:border-fuchsia-500 rounded-lg px-2.5 py-1.5 text-xs transition">
                    <input
                      type={showMinimax ? 'text' : 'password'}
                      value={minimaxKey}
                      onChange={(e) => setMinimaxKey(e.target.value)}
                      placeholder="MiniMax M3 Dedicated Key (nvapi-...)"
                      className="flex-1 bg-transparent text-white outline-none font-mono text-xs placeholder:text-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMinimax(!showMinimax)}
                      className="text-zinc-400 hover:text-white transition p-1 cursor-pointer"
                    >
                      {showMinimax ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Optional Gemini AI Studio Key */}
                <div className="space-y-1.5 p-2.5 rounded-xl bg-black/40 border border-zinc-850">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
                      <span>Google AI Studio Gemini Key (Fallback)</span>
                    </label>
                    {configuredStatus.gemini?.configured && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                        <ShieldCheck className="w-3 h-3" /> Active: {configuredStatus.gemini.masked}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center bg-zinc-950 border border-zinc-800 focus-within:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs transition">
                    <input
                      type={showGemini ? 'text' : 'password'}
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AIzaSy... (optional fallback)"
                      className="flex-1 bg-transparent text-white outline-none font-mono text-xs placeholder:text-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGemini(!showGemini)}
                      className="text-zinc-400 hover:text-white transition p-1 cursor-pointer"
                    >
                      {showGemini ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
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
