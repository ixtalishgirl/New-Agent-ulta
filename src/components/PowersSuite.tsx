import React, { useState, useEffect } from 'react';
import {
  Zap,
  Plus,
  RefreshCw,
  Loader2,
  Code2,
} from 'lucide-react';

interface CustomTool {
  id: string;
  name: string;
  description: string;
  runtime: 'javascript' | 'python' | 'bash';
  code: string;
  createdAt: string;
  invocationsCount: number;
}

interface PowersSuiteProps {
  onRunInTerminal?: (cmd: string) => void;
}

async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { success: false, error: 'Invalid server response (not JSON).' };
  }
}

export const PowersSuite: React.FC<PowersSuiteProps> = () => {
  const [tools, setTools] = useState<CustomTool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [execArgs, setExecArgs] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [execResult, setExecResult] = useState<{ out: string; err: string; exit: number; ms: number } | null>(null);

  const [showBuild, setShowBuild] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [runtime, setRuntime] = useState<'javascript' | 'python' | 'bash'>('python');
  const [code, setCode] = useState(`# Halye custom tool\nimport sys, json\n\ndef main():\n    print("Halye tool executed!")\n\nif __name__ == "__main__":\n    main()\n`);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildMsg, setBuildMsg] = useState<string | null>(null);

  const fetchTools = async () => {
    setIsLoading(true);
    try {
      const data = await safeJson(await fetch('/api/agent/tools'));
      if (data.success && Array.isArray(data.tools)) {
        setTools(data.tools);
        if (!selectedId && data.tools.length > 0) setSelectedId(data.tools[0].id);
      }
    } catch (e: any) {
      console.error('fetchTools failed:', e?.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTools(); }, []);

  const handleExecute = async () => {
    if (!selectedId || isExecuting) return;
    setIsExecuting(true);
    setExecResult(null);
    const start = Date.now();
    try {
      let args: any = {};
      const t = execArgs.trim();
      if (t) {
        try { args = JSON.parse(t); } catch { args = { raw: t }; }
      }
      const data = await safeJson(await fetch('/api/agent/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: selectedId, inputParams: args }),
      }));
      setExecResult({
        out: data.stdout || (data.result !== undefined ? String(data.result) : '') || (data.logs || []).join('\n'),
        err: data.stderr || data.error || '',
        exit: data.exitCode ?? (data.success ? 0 : 1),
        ms: data.durationMs ?? (Date.now() - start),
      });
      fetchTools();
    } catch (e: any) {
      setExecResult({ out: '', err: e?.message || 'Execution failed', exit: 1, ms: Date.now() - start });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || isBuilding) return;
    setIsBuilding(true);
    setBuildMsg(null);
    try {
      const data = await safeJson(await fetch('/api/agent/tools/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), code, runtime }),
      }));
      if (data.success && data.tool) {
        setBuildMsg(`✓ Tool "${data.tool.name}" created (${data.tool.runtime})`);
        await fetchTools();
        setSelectedId(data.tool.id);
        setTimeout(() => { setShowBuild(false); setBuildMsg(null); setName(''); setDescription(''); }, 1200);
      } else {
        setBuildMsg(`✗ ${data.error || 'Build failed'}`);
      }
    } catch (e: any) {
      setBuildMsg(`✗ Network error: ${e?.message}`);
    } finally {
      setIsBuilding(false);
    }
  };

  const active = tools.find((t) => t.id === selectedId);

  return (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-black text-zinc-100">
      <div className="w-full md:w-80 h-1/3 md:h-full flex flex-col border-b md:border-b-0 md:border-r border-zinc-900 bg-zinc-950 shrink-0">
        <div className="p-3 border-b border-zinc-900 bg-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Halye Tools</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-400 font-mono">
              {tools.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowBuild(true)} className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 transition cursor-pointer" title="Build new tool">
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button onClick={fetchTools} disabled={isLoading} className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 transition cursor-pointer" title="Refresh">
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs">
          {tools.length === 0 && !isLoading && (
            <p className="text-zinc-600 text-[11px] p-3 text-center">No tools yet. Build one with +</p>
          )}
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => { setSelectedId(t.id); setExecResult(null); setExecArgs(''); }}
              className={`w-full text-left p-2.5 rounded-xl transition cursor-pointer border ${
                selectedId === t.id ? 'bg-amber-500/10 border-amber-500/40 text-white' : 'bg-black/60 border-zinc-800 hover:bg-zinc-900 text-zinc-400'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold truncate">{t.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-500 shrink-0">{t.runtime}</span>
              </div>
              <p className="text-[10px] text-zinc-500 truncate mt-0.5">{t.description}</p>
              <p className="text-[9px] text-zinc-600 mt-0.5">used {t.invocationsCount}x</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {active ? (
          <>
            <div className="p-3 border-b border-zinc-900 bg-zinc-950/60">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm text-white">{active.name}</span>
                <span className="text-[10px] font-mono text-zinc-500">{active.runtime} · {active.id}</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">{active.description}</p>
            </div>
            <div className="p-3 border-b border-zinc-900">
              <label className="text-[10px] font-mono text-zinc-500">INPUT (JSON, optional)</label>
              <textarea
                value={execArgs}
                onChange={(e) => setExecArgs(e.target.value)}
                placeholder='{"key": "value"}'
                rows={2}
                className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-[11px] font-mono text-zinc-200 outline-none focus:border-amber-500/60 resize-none"
              />
              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className="mt-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                {isExecuting ? 'Running...' : 'Execute Tool'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {execResult ? (
                <div className="space-y-2 font-mono text-[11px]">
                  {execResult.out && (
                    <pre className="p-2.5 rounded-lg bg-black border border-zinc-800 text-emerald-300 whitespace-pre-wrap break-words max-h-64 overflow-y-auto">{execResult.out}</pre>
                  )}
                  {execResult.err && (
                    <pre className="p-2.5 rounded-lg bg-black border border-rose-900/50 text-rose-300 whitespace-pre-wrap break-words max-h-40 overflow-y-auto">{execResult.err}</pre>
                  )}
                  <p className="text-zinc-600">exit {execResult.exit} · {execResult.ms}ms</p>
                </div>
              ) : (
                <p className="text-zinc-600 text-[11px]">Run the tool to see output.</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-600 text-xs">Select a tool</div>
        )}
      </div>

      {showBuild && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowBuild(false)}>
          <form onSubmit={handleBuild} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-sm text-white flex items-center gap-2"><Plus className="w-4 h-4 text-amber-400" /> Build New Tool</h3>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tool name (e.g. my_tool)" className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 outline-none focus:border-amber-500/60 font-mono" />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 outline-none focus:border-amber-500/60" />
            <div className="flex gap-2">
              {(['javascript', 'python', 'bash'] as const).map((r) => (
                <button key={r} type="button" onClick={() => setRuntime(r)} className={`px-3 py-1.5 rounded-lg text-[11px] font-mono border transition cursor-pointer ${runtime === r ? 'bg-amber-500/15 border-amber-500/50 text-amber-300' : 'bg-black border-zinc-800 text-zinc-500'}`}>{r}</button>
              ))}
            </div>
            <textarea value={code} onChange={(e) => setCode(e.target.value)} rows={10} spellCheck={false} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-[11px] font-mono text-zinc-200 outline-none focus:border-amber-500/60 resize-y" />
            {buildMsg && <p className={`text-[11px] font-mono ${buildMsg.startsWith('✓') ? 'text-emerald-400' : 'text-rose-400'}`}>{buildMsg}</p>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowBuild(false)} className="px-4 py-2 rounded-lg bg-zinc-900 text-zinc-300 text-xs font-bold hover:bg-zinc-800 transition cursor-pointer">Cancel</button>
              <button type="submit" disabled={isBuilding || !name.trim() || !code.trim()} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-xs font-bold transition cursor-pointer flex items-center gap-1.5">
                {isBuilding && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create Tool
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
