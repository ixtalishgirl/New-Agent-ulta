import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Play, 
  Terminal, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Code2, 
  Cpu, 
  Globe, 
  FolderArchive,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { HalyePowerItem } from '../types';

interface PowersSuiteProps {
  onRunInTerminal?: (cmd: string) => void;
}

export const PowersSuite: React.FC<PowersSuiteProps> = ({ onRunInTerminal }) => {
  const [powers, setPowers] = useState<HalyePowerItem[]>([]);
  const [isLoadingPowers, setIsLoadingPowers] = useState(false);
  const [selectedPowerId, setSelectedPowerId] = useState<string | null>(null);

  // Execution state
  const [execParams, setExecParams] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [execResult, setExecResult] = useState<{ stdout: string; stderr: string; exitCode: number; ms: number } | null>(null);

  // Build New Power Modal state
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [powerName, setPowerName] = useState('');
  const [powerCategory, setPowerCategory] = useState('utility');
  const [powerDescription, setPowerDescription] = useState('');
  const [powerCode, setPowerCode] = useState(`#!/usr/bin/env python3
import sys

def run():
    print("Halye Autonomous Power Executed Successfully!")

if __name__ == "__main__":
    run()
`);
  const [isBuildingPower, setIsBuildingPower] = useState(false);
  const [buildResultMsg, setBuildResultMsg] = useState<string | null>(null);

  const fetchPowers = async () => {
    setIsLoadingPowers(true);
    try {
      const res = await fetch('/api/powers/list');
      const data = await res.json();
      if (data.success && Array.isArray(data.powers)) {
        setPowers(data.powers);
        if (!selectedPowerId && data.powers.length > 0) {
          setSelectedPowerId(data.powers[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load powers:', err);
    } finally {
      setIsLoadingPowers(false);
    }
  };

  useEffect(() => {
    fetchPowers();
  }, []);

  const handleRunPower = async () => {
    if (!selectedPowerId) return;
    setIsExecuting(true);
    setExecResult(null);

    const argsList = execParams.trim() ? execParams.trim().split(/\s+/) : [];
    try {
      const res = await fetch('/api/powers/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          powerId: selectedPowerId,
          args: argsList,
        }),
      });
      const data = await res.json();
      setExecResult({
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        exitCode: data.exitCode || 0,
        ms: data.durationMs || 0,
      });
      fetchPowers();
    } catch (err: any) {
      setExecResult({
        stdout: '',
        stderr: err.message || 'Execution failed',
        exitCode: 1,
        ms: 0,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleBuildNewPower = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!powerName.trim() || !powerCode.trim()) return;

    setIsBuildingPower(true);
    setBuildResultMsg(null);

    try {
      const res = await fetch('/api/powers/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: powerName.trim(),
          category: powerCategory,
          description: powerDescription.trim() || 'Autonomous custom Halye power',
          code: powerCode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBuildResultMsg(`✔ Success: ${data.message || 'Power built & registered'}`);
        await fetchPowers();
        if (data.power?.id) {
          setSelectedPowerId(data.power.id);
        }
        setTimeout(() => {
          setShowBuildModal(false);
          setBuildResultMsg(null);
        }, 1200);
      } else {
        setBuildResultMsg(`❌ Error: ${data.error || data.stderr || 'Build failed'}`);
      }
    } catch (err: any) {
      setBuildResultMsg(`❌ Network Error: ${err.message}`);
    } finally {
      setIsBuildingPower(false);
    }
  };

  const activePower = powers.find(p => p.id === selectedPowerId);

  return (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-black text-zinc-100">
      
      {/* LEFT COLUMN: Registered Powers List */}
      <div className="w-full md:w-80 h-1/3 md:h-full flex flex-col border-b md:border-b-0 md:border-r border-zinc-900 bg-zinc-950 shrink-0">
        
        {/* Header */}
        <div className="p-3 border-b border-zinc-900 bg-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Halye Powers</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-400 font-mono">
              {powers.length} Active
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowBuildModal(true)}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-400 hover:text-amber-300 border border-zinc-800 transition cursor-pointer"
              title="Build New Autonomous Power"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={fetchPowers}
              disabled={isLoadingPowers}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition cursor-pointer"
              title="Refresh Powers"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPowers ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Powers List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs">
          {powers.map((power) => {
            const isSelected = selectedPowerId === power.id;
            return (
              <button
                key={power.id}
                onClick={() => {
                  setSelectedPowerId(power.id);
                  setExecResult(null);
                  setExecParams('');
                }}
                className={`w-full text-left p-2.5 rounded-xl transition cursor-pointer flex flex-col gap-1 border ${
                  isSelected 
                    ? 'bg-amber-500/10 border-amber-500/40 text-white' 
                    : 'bg-black/60 border-zinc-850 hover:bg-zinc-900 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white truncate max-w-[180px]">
                    {power.name}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-500 text-[9px] uppercase">
                    {power.category}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 line-clamp-2">
                  {power.description}
                </p>
                <div className="flex items-center justify-between pt-1 text-[9px] text-zinc-600">
                  <span>v{power.version}</span>
                  <span className="text-emerald-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {power.invocations} runs
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-2 border-t border-zinc-900 bg-black text-[10px] text-zinc-500 flex items-center justify-between font-mono">
          <span>Python 3.11 Powered</span>
          <span className="text-amber-400">Self-Building Engine</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Active Power Dashboard & Trigger */}
      <div className="flex-1 h-2/3 md:h-full flex flex-col overflow-hidden bg-black">
        {activePower ? (
          <div className="w-full h-full overflow-y-auto p-4 sm:p-6 space-y-6">
            
            {/* Power Header Card */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-850 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold uppercase mb-2">
                    <Zap className="w-3.5 h-3.5" /> Active Halye Power
                  </div>
                  <h2 className="text-xl font-black text-white font-mono">{activePower.name}</h2>
                  <p className="text-xs text-zinc-400 font-sans mt-1 max-w-xl leading-relaxed">
                    {activePower.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {onRunInTerminal && (
                    <button
                      onClick={() => onRunInTerminal(`${activePower.command} ${execParams}`.trim())}
                      className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                      title="Run command inside interactive terminal"
                    >
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Open in Terminal</span>
                    </button>
                  )}
                  <button
                    onClick={handleRunPower}
                    disabled={isExecuting}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold font-mono flex items-center gap-2 transition cursor-pointer active:scale-95 shadow-lg shadow-amber-500/20"
                  >
                    {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>Execute Power</span>
                  </button>
                </div>
              </div>

              {/* Execution Command Preview & Parameter Input */}
              <div className="mt-5 pt-4 border-t border-zinc-900 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="px-3 py-2 rounded-xl bg-black border border-zinc-800 font-mono text-xs text-cyan-400 flex items-center gap-2 shrink-0">
                    <span>$ {activePower.command}</span>
                  </div>
                  <input
                    type="text"
                    value={execParams}
                    onChange={(e) => setExecParams(e.target.value)}
                    placeholder="Optional arguments (e.g. --list demo_project.zip, --browse https://example.com)..."
                    className="flex-1 bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Execution Result Console */}
            {execResult && (
              <div className="rounded-2xl bg-zinc-950 border border-zinc-850 overflow-hidden shadow-2xl">
                <div className="p-3 bg-black border-b border-zinc-850 flex items-center justify-between font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${execResult.exitCode === 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                    <span className="text-zinc-300 font-bold">Execution Output</span>
                    <span className="text-zinc-500">({execResult.ms}ms, exit: {execResult.exitCode})</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">Standard I/O</span>
                </div>

                <div className="p-4 bg-black font-mono text-xs overflow-x-auto max-h-80 selection:bg-amber-500 selection:text-black">
                  {execResult.stdout && (
                    <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed">{execResult.stdout}</pre>
                  )}
                  {execResult.stderr && (
                    <pre className="text-rose-400 whitespace-pre-wrap leading-relaxed mt-2">{execResult.stderr}</pre>
                  )}
                  {!execResult.stdout && !execResult.stderr && (
                    <span className="text-zinc-500 italic">Command completed with no output.</span>
                  )}
                </div>
              </div>
            )}

            {/* Power Information Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850">
                <div className="text-[10px] text-zinc-500 mb-1">REGISTERED ID</div>
                <div className="text-zinc-200 truncate">{activePower.id}</div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850">
                <div className="text-[10px] text-zinc-500 mb-1">TOTAL INVOCATIONS</div>
                <div className="text-amber-400 font-bold">{activePower.invocations} executions</div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850">
                <div className="text-[10px] text-zinc-500 mb-1">COMMAND PATH</div>
                <div className="text-cyan-400 truncate">{activePower.command}</div>
              </div>
            </div>

          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500 font-mono text-xs">
            Select a power from the left list.
          </div>
        )}
      </div>

      {/* MODAL: BUILD NEW AUTONOMOUS POWER */}
      {showBuildModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Autonomous Power Builder</span>
            </h3>

            <form onSubmit={handleBuildNewPower} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Power Name</label>
                  <input
                    type="text"
                    required
                    value={powerName}
                    onChange={(e) => setPowerName(e.target.value)}
                    placeholder="e.g. JSON Data Cleaner"
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Category</label>
                  <select
                    value={powerCategory}
                    onChange={(e) => setPowerCategory(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  >
                    <option value="utility">Utility</option>
                    <option value="code">Code Processing</option>
                    <option value="web">Web & Scraping</option>
                    <option value="system">System & Bash</option>
                    <option value="finance">Finance / Crypto</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Description</label>
                <input
                  type="text"
                  value={powerDescription}
                  onChange={(e) => setPowerDescription(e.target.value)}
                  placeholder="What does this autonomous power do?"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Python 3 Script Code</label>
                <textarea
                  rows={8}
                  required
                  value={powerCode}
                  onChange={(e) => setPowerCode(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs text-emerald-400 font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-500 resize-none selection:bg-amber-500 selection:text-black"
                />
              </div>

              {buildResultMsg && (
                <div className="p-3 rounded-xl bg-black border border-amber-500/30 text-amber-300 text-xs font-mono">
                  {buildResultMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBuildModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBuildingPower || !powerName.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-mono transition cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  {isBuildingPower ? 'Building...' : 'Autonomously Build & Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
