import React, { useState, useEffect } from 'react';
import { X, Zap, Cpu, Server, CheckCircle2, Terminal, Key, Play, Sparkles, Flame, ShieldAlert, Loader2 } from 'lucide-react';
import { NvidiaModelCatalogItem } from '../types';

interface NvidiaCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeModel: string;
  catalog: NvidiaModelCatalogItem[];
  onModelSwitched?: (modelId: string, provider: string) => void;
}

export const NvidiaCatalogModal: React.FC<NvidiaCatalogModalProps> = ({
  isOpen,
  onClose,
  activeModel,
  catalog,
  onModelSwitched,
}) => {
  const [selectedModel, setSelectedModel] = useState<string>(activeModel || 'meta/llama-3.2-11b-vision-instruct');
  const [openRouterKey, setOpenRouterKey] = useState<string>(() => localStorage.getItem('halye_openrouter_key') || '');
  const [groqKey, setGroqKey] = useState<string>(() => localStorage.getItem('halye_groq_key') || '');
  const [customBaseUrl, setCustomBaseUrl] = useState<string>(() => localStorage.getItem('halye_custom_base_url') || '');
  const [customApiKey, setCustomApiKey] = useState<string>(() => localStorage.getItem('halye_custom_api_key') || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ model: string; durationMs: number; response: string; error?: string } | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchNotice, setSwitchNotice] = useState<string | null>(null);

  useEffect(() => {
    if (activeModel) {
      setSelectedModel(activeModel);
    }
  }, [activeModel]);

  if (!isOpen) return null;

  const currentItem = catalog.find((c) => c.id === selectedModel) || catalog[0] || {
    id: selectedModel,
    name: 'Selected Model',
    category: 'Running Active' as const,
    parameters: 'Active Engine',
    speedRating: '~200 tok/s',
    description: 'Active model engine in Halye Studio.',
    strengths: ['Uncensored', 'Fast', 'Complex Coding'],
    provider: 'nvidia' as const,
  };

  const handleTestSpeed = async (modelItem: NvidiaModelCatalogItem) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const provider = modelItem.provider || 'openrouter';
      let apiKey = '';
      if (provider === 'openrouter') apiKey = openRouterKey;
      else if (provider === 'groq') apiKey = groqKey;
      else if (provider === 'custom') apiKey = customApiKey;

      const res = await fetch('/api/model/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          model: modelItem.id,
          apiKey: apiKey || undefined,
          baseUrl: provider === 'custom' ? customBaseUrl : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          model: modelItem.id,
          durationMs: data.durationMs,
          response: data.response,
        });
      } else {
        setTestResult({
          model: modelItem.id,
          durationMs: data.durationMs || 0,
          response: '',
          error: data.error || 'Test failed. Please check your API key.',
        });
      }
    } catch (err: any) {
      setTestResult({
        model: modelItem.id,
        durationMs: 0,
        response: '',
        error: err.message || 'Network error during speed test',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleActivateModel = async (modelItem: NvidiaModelCatalogItem) => {
    setIsSwitching(true);
    setSwitchNotice(null);
    try {
      const provider = modelItem.provider || 'openrouter';
      let apiKey = '';
      if (provider === 'openrouter') {
        apiKey = openRouterKey;
        if (openRouterKey) localStorage.setItem('halye_openrouter_key', openRouterKey);
      } else if (provider === 'groq') {
        apiKey = groqKey;
        if (groqKey) localStorage.setItem('halye_groq_key', groqKey);
      } else if (provider === 'custom') {
        apiKey = customApiKey;
        if (customApiKey) localStorage.setItem('halye_custom_api_key', customApiKey);
        if (customBaseUrl) localStorage.setItem('halye_custom_base_url', customBaseUrl);
      }

      const res = await fetch('/api/model/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          model: modelItem.id,
          apiKey: apiKey || undefined,
          baseUrl: provider === 'custom' ? customBaseUrl : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSelectedModel(modelItem.id);
        setSwitchNotice(`✔ Malik Halye, active model foran switch ho gaya hai: ${modelItem.name}`);
        if (onModelSwitched) {
          onModelSwitched(modelItem.id, provider);
        }
        setTimeout(() => setSwitchNotice(null), 5000);
      } else {
        setSwitchNotice(`❌ Error switching model: ${data.error}`);
      }
    } catch (err: any) {
      setSwitchNotice(`❌ Connection error: ${err.message}`);
    } finally {
      setIsSwitching(false);
    }
  };

  const uncensoredModels = catalog.filter((c) => c.category === 'Uncensored Frontier' || c.id.includes('hermes'));
  const speedModels = catalog.filter((c) => c.category === 'Fastest / High Speed');
  const otherModels = catalog.filter((c) => !uncensoredModels.includes(c) && !speedModels.includes(c));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 px-6 border-b border-zinc-800 bg-black flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-red-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                  Uncensored & Hermes 4 70B Model Hub
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-mono font-bold border border-red-500/30">
                  100% UNRESTRICTED
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                Active Engine: <span className="text-emerald-400 font-semibold">{selectedModel}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notification banner if switched */}
        {switchNotice && (
          <div className="px-6 py-2.5 bg-emerald-950/60 border-b border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between">
            <span>{switchNotice}</span>
            <span className="text-[10px] text-emerald-400/80">Active now</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Active Model Spotlight Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-zinc-900 to-black border border-amber-500/40 relative overflow-hidden shadow-xl">
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              {selectedModel === currentItem.id ? 'SELECTED ENGINE' : 'AVAILABLE'}
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-1">
              <span>Selected ID:</span>
              <span className="text-cyan-400 font-bold">{currentItem.id}</span>
              <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] text-zinc-300 uppercase">
                {currentItem.provider || 'openrouter'}
              </span>
            </div>

            <h4 className="text-xl font-extrabold text-white flex items-center gap-2">
              {currentItem.name}
            </h4>
            <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed max-w-2xl">
              {currentItem.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="p-3 rounded-xl bg-black/70 border border-zinc-850">
                <span className="text-[10px] font-mono text-zinc-500 block">PARAMETERS</span>
                <span className="text-xs font-bold text-white">{currentItem.parameters}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/70 border border-zinc-850">
                <span className="text-[10px] font-mono text-zinc-500 block">RESPONSE SPEED</span>
                <span className="text-xs font-bold text-amber-400">{currentItem.speedRating}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/70 border border-zinc-850">
                <span className="text-[10px] font-mono text-zinc-500 block">UNCENSORED</span>
                <span className="text-xs font-bold text-red-400">Zero Refusals</span>
              </div>
              <div className="p-3 rounded-xl bg-black/70 border border-zinc-850">
                <span className="text-[10px] font-mono text-zinc-500 block">SPELLING ACCURACY</span>
                <span className="text-xs font-bold text-emerald-400">High-IQ Exact</span>
              </div>
            </div>

            {/* Strengths */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {currentItem.strengths?.map((s, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-zinc-800/90 text-[10px] text-zinc-300 font-mono">
                  ✔ {s}
                </span>
              ))}
            </div>

            {/* Test speed & Activate Action Bar */}
            <div className="mt-5 pt-4 border-t border-zinc-850 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTestSpeed(currentItem)}
                  disabled={isTesting}
                  className="px-4 py-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-amber-500/20 active:scale-95 disabled:opacity-50"
                >
                  {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  Test Reply Speed & Latency
                </button>
                <button
                  onClick={() => handleActivateModel(currentItem)}
                  disabled={isSwitching}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                >
                  {isSwitching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Set as Active Assistant Engine
                </button>
              </div>

              {testResult && (
                <div className="text-xs font-mono">
                  {testResult.error ? (
                    <span className="text-rose-400">❌ {testResult.error}</span>
                  ) : (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      ⚡ Response in {testResult.durationMs}ms: "{testResult.response.slice(0, 50)}..."
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Optional API Keys Configuration for OpenRouter & Groq */}
          <div className="p-4 rounded-xl bg-black border border-zinc-850 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <Key className="w-4 h-4 text-cyan-400" />
                Uncensored Provider Keys (OpenRouter / Groq)
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Auto-saved to LocalStorage</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Agar aap OpenRouter ya Groq se Nous Hermes 4 70B ya Llama 3.3 70B call karna chahte hain to yahan apni API key paste karein. Agar key na ho, to app automatic built-in Gemini 3.1 Flash / NVIDIA Vision engine par ultra speed se operate karegi!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                  OpenRouter API Key (sk-or-v1-...)
                </label>
                <input
                  type="password"
                  value={openRouterKey}
                  onChange={(e) => {
                    setOpenRouterKey(e.target.value);
                    localStorage.setItem('halye_openrouter_key', e.target.value);
                  }}
                  placeholder="Paste sk-or-v1-... for Hermes 4 70B"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                  Groq API Key (gsk_...)
                </label>
                <input
                  type="password"
                  value={groqKey}
                  onChange={(e) => {
                    setGroqKey(e.target.value);
                    localStorage.setItem('halye_groq_key', e.target.value);
                  }}
                  placeholder="Paste gsk_... for ~300 tok/s speed"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Uncensored Frontier (Nous Hermes Models) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Uncensored Hermes Frontier (Malik Halye's Preferred Models)
                </h4>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">100% Obedient & Zero Refusal</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {uncensoredModels.map((item) => {
                const isSelected = selectedModel === item.id;
                return (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedModel(item.id)}
                    className={`p-4 rounded-xl border transition cursor-pointer relative ${
                      isSelected 
                        ? 'bg-zinc-900/90 border-amber-500/80 shadow-md shadow-amber-500/10' 
                        : 'bg-black border-zinc-850 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                          {item.name}
                        </div>
                        <div className="text-[10px] font-mono text-amber-400/90">{item.id}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-mono font-bold">
                        {item.speedRating}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">{item.description}</p>
                    <div className="mt-3 pt-2 border-t border-zinc-850 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-zinc-500">{item.parameters}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActivateModel(item);
                        }}
                        className="text-amber-400 hover:underline font-bold"
                      >
                        Activate Now →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Ultra-Fast & Active Multimodal NIM */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Ultra-Fast Throughput & Active NIM Engines
                </h4>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Instant First-Token</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...speedModels, ...otherModels].map((item) => {
                const isSelected = selectedModel === item.id;
                return (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedModel(item.id)}
                    className={`p-4 rounded-xl border transition cursor-pointer relative ${
                      isSelected 
                        ? 'bg-zinc-900/90 border-cyan-500/80 shadow-md shadow-cyan-500/10' 
                        : 'bg-black border-zinc-850 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                          {item.name}
                        </div>
                        <div className="text-[10px] font-mono text-cyan-400">{item.id}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-mono font-bold">
                        {item.speedRating}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">{item.description}</p>
                    <div className="mt-3 pt-2 border-t border-zinc-850 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-zinc-500">{item.parameters}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActivateModel(item);
                        }}
                        className="text-cyan-400 hover:underline font-bold"
                      >
                        Activate Now →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-zinc-850 bg-black flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-zinc-400 font-mono text-[11px]">
            Active Engine: <span className="text-amber-400 font-bold">{selectedModel}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleActivateModel(currentItem)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition cursor-pointer"
            >
              Confirm Selection
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

