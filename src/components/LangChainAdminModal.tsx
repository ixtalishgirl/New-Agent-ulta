import React, { useState, useEffect } from 'react';
import {
  X,
  Terminal,
  Cpu,
  Layers,
  Search,
  FileCode,
  Globe,
  Key,
  RefreshCw,
  Trash2,
  Play,
  Check,
  Copy,
  ShieldCheck,
  Activity,
  Code2,
  Database,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Maximize2
} from 'lucide-react';

interface IntermediateStep {
  tool: string;
  tool_input: any;
  thought_log?: string;
  observation: string;
}

interface RunResult {
  success: boolean;
  input: string;
  output: string;
  intermediate_steps: IntermediateStep[];
  action_logs?: any[];
  memory_history?: { role: string; content: string }[];
  execution_time_ms: number;
  model_engine: string;
  framework: string;
  tools_available: string[];
  timestamp: number;
}

interface ToolManifestItem {
  name: string;
  description: string;
  args_schema: string;
  docstring: string;
}

interface LangChainAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LangChainAdminModal: React.FC<LangChainAdminModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'console' | 'tools' | 'memory' | 'api'>('console');
  const [copiedKey, setCopiedKey] = useState(false);
  const [adminApiKey, setAdminApiKey] = useState('sk-halye-raw-access-admin');
  
  // Console state
  const [prompt, setPrompt] = useState('Search the live internet for Python LangChain 2026 releases and summarize');
  const [framework, setFramework] = useState<'tool_calling' | 'react'>('tool_calling');
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<RunResult | null>(null);
  const [consoleError, setConsoleError] = useState<string | null>(null);
  
  // Tool Arsenal state
  const [tools, setTools] = useState<ToolManifestItem[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('web_search');
  const [toolQuery, setToolQuery] = useState('LangChain agent autonomous tool calling');
  const [toolAction, setToolAction] = useState('list');
  const [toolPath, setToolPath] = useState('.');
  const [toolContent, setToolContent] = useState('');
  const [toolApiMethod, setToolApiMethod] = useState('GET');
  const [toolApiUrl, setToolApiUrl] = useState('http://localhost:3000/api/langchain/status');
  const [toolTerminalCmd, setToolTerminalCmd] = useState('uname -a && uptime');
  const [isExecutingTool, setIsExecutingTool] = useState(false);
  const [toolExecutionResult, setToolExecutionResult] = useState<any>(null);

  // Memory state
  const [memoryTurns, setMemoryTurns] = useState<{ role: string; content: string }[]>([]);
  const [isLoadingMemory, setIsLoadingMemory] = useState(false);

  // System status
  const [systemStatus, setSystemStatus] = useState<any>({
    status: 'online',
    model_engine: 'HalyeAutonomousChatModel (LangChain Agentic Brain)',
    tools_count: 4,
    admin_access: 'RAW_SUPERUSER'
  });

  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/langchain/status')
      .then(res => res.json())
      .then(data => {
        if (data.status) setSystemStatus(data);
      })
      .catch(() => {});

    fetch('/api/langchain/tools')
      .then(res => res.json())
      .then(data => {
        if (data.tools) setTools(data.tools);
      })
      .catch(() => {});

    loadMemory();
  }, [isOpen]);

  const loadMemory = () => {
    setIsLoadingMemory(true);
    fetch('/api/langchain/memory')
      .then(res => res.json())
      .then(data => {
        if (data.messages) setMemoryTurns(data.messages);
      })
      .catch(() => {})
      .finally(() => setIsLoadingMemory(false));
  };

  const handleClearMemory = async () => {
    try {
      await fetch('/api/langchain/memory/clear', { method: 'POST' });
      setMemoryTurns([]);
      if (lastResult) {
        setLastResult({ ...lastResult, memory_history: [] });
      }
    } catch (e) {}
  };

  const handleRunAgent = async (overridePrompt?: string) => {
    const textToRun = overridePrompt || prompt;
    if (!textToRun.trim()) return;

    setIsRunning(true);
    setConsoleError(null);
    try {
      const res = await fetch('/api/langchain/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminApiKey
        },
        body: JSON.stringify({
          prompt: textToRun,
          framework
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLastResult(data);
        if (data.memory_history) {
          setMemoryTurns(data.memory_history);
        }
      } else {
        setConsoleError(data.error || 'Execution failed');
      }
    } catch (err: any) {
      setConsoleError(err.message || 'Connection error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleDirectToolExecute = async () => {
    setIsExecutingTool(true);
    setToolExecutionResult(null);

    let args: any = {};
    if (selectedTool === 'web_search') {
      args = { query: toolQuery, max_results: 5 };
    } else if (selectedTool === 'file_system_reader') {
      args = { action: toolAction, path: toolPath, content: toolContent };
    } else if (selectedTool === 'api_execution_tool') {
      args = { method: toolApiMethod, url: toolApiUrl, headers_json: '{}', payload_json: '{}' };
    } else if (selectedTool === 'terminal_command_executor') {
      args = { command: toolTerminalCmd };
    }

    try {
      const res = await fetch('/api/langchain/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: selectedTool,
          arguments: args
        })
      });
      const data = await res.json();
      setToolExecutionResult(data);
    } catch (err: any) {
      setToolExecutionResult({ success: false, error: err.message });
    } finally {
      setIsExecutingTool(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        id="langchain-admin-modal-panel"
        className="w-full max-w-5xl h-[92vh] max-h-[900px] bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden text-zinc-100"
      >
        {/* Modal Header */}
        <div className="h-16 px-6 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">LangChain Agentic Brain</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  SUPERUSER RAW ACCESS
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                AgentExecutor (verbose=True) • ConversationBufferMemory • Autonomous Tool Calling
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-zinc-500">KEY:</span>
              <span className="text-cyan-300 font-semibold">{adminApiKey.slice(0, 16)}...</span>
              <button 
                onClick={() => copyToClipboard(adminApiKey)}
                className="ml-1 text-zinc-400 hover:text-white transition p-0.5"
                title="Copy Admin API Key"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="h-12 px-6 bg-zinc-900/40 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('console')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'console'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              AgentExecutor Console
            </button>

            <button
              onClick={() => setActiveTab('tools')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'tools'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Tool Arsenal Sandbox ({tools.length || 4})
            </button>

            <button
              onClick={() => setActiveTab('memory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'memory'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Memory State ({memoryTurns.length})
            </button>

            <button
              onClick={() => setActiveTab('api')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'api'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Endpoints & cURL
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-zinc-400 font-mono">
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              PORT 3000 / 8888
            </span>
          </div>
        </div>

        {/* Tab Content Canvas */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ============================================================ */}
          {/* TAB 1: INTERACTIVE AGENTEXECUTOR CONSOLE                     */}
          {/* ============================================================ */}
          {activeTab === 'console' && (
            <div className="space-y-6">
              {/* Presets & Controls */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 font-medium">Framework Engine:</span>
                    <select
                      value={framework}
                      onChange={(e: any) => setFramework(e.target.value)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="tool_calling">LangChain Tool-Calling Agent</option>
                      <option value="react">Zero-Shot ReAct Framework</option>
                    </select>
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-zinc-500 mr-1">Quick Directives:</span>
                    <button
                      onClick={() => {
                        const q = 'Search the web for LangChain 2026 python release notes';
                        setPrompt(q);
                        handleRunAgent(q);
                      }}
                      className="px-2.5 py-1 rounded text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
                    >
                      🌐 Web Search
                    </button>
                    <button
                      onClick={() => {
                        const q = 'Read package.json and list all current workspace dependencies';
                        setPrompt(q);
                        handleRunAgent(q);
                      }}
                      className="px-2.5 py-1 rounded text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
                    >
                      📁 Audit Filesystem
                    </button>
                    <button
                      onClick={() => {
                        const q = 'Run bash command uname -a to inspect Linux container';
                        setPrompt(q);
                        handleRunAgent(q);
                      }}
                      className="px-2.5 py-1 rounded text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
                    >
                      💻 Shell Terminal
                    </button>
                    <button
                      onClick={() => {
                        const q = 'Dispatch HTTP GET request to http://localhost:3000/api/langchain/status';
                        setPrompt(q);
                        handleRunAgent(q);
                      }}
                      className="px-2.5 py-1 rounded text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
                    >
                      ⚡ API Webhook
                    </button>
                  </div>
                </div>

                {/* Prompt Textarea */}
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter an instruction for the LangChain autonomous agent..."
                    rows={3}
                    className="w-full bg-black/60 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-mono resize-none"
                  />
                  <button
                    onClick={() => handleRunAgent()}
                    disabled={isRunning || !prompt.trim()}
                    className="absolute right-3 bottom-3 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-extrabold text-xs flex items-center gap-2 transition cursor-pointer shadow-md"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Agent Running...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span>Execute Directive</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {consoleError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Execution Error:</span> {consoleError}
                  </div>
                </div>
              )}

              {/* Execution Telemetry & Result */}
              {lastResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Completed in <strong className="text-emerald-300">{lastResult.execution_time_ms}ms</strong></span>
                      <span>•</span>
                      <span>Model: <strong className="text-zinc-200">{lastResult.model_engine}</strong></span>
                    </div>

                    <span className="text-xs font-mono text-zinc-500">
                      Steps: {lastResult.intermediate_steps?.length || 0}
                    </span>
                  </div>

                  {/* Intermediate Steps (Thoughts, Action, Observation) */}
                  {lastResult.intermediate_steps && lastResult.intermediate_steps.length > 0 && (
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                          🔍 AgentExecutor Intermediate Steps (verbose=True)
                        </span>
                        <span className="text-[11px] font-mono text-cyan-400">
                          {lastResult.intermediate_steps.length} Tool Invocations
                        </span>
                      </div>

                      <div className="space-y-3">
                        {lastResult.intermediate_steps.map((step, idx) => (
                          <div key={idx} className="bg-black/50 border border-zinc-800/80 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-mono font-semibold">
                                <Sparkles className="w-3 h-3" />
                                Action: {step.tool}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-500">Step {idx + 1}</span>
                            </div>

                            {step.thought_log && (
                              <div className="text-xs font-mono text-zinc-400 bg-zinc-950/60 p-2 rounded border border-zinc-900">
                                {step.thought_log}
                              </div>
                            )}

                            <div>
                              <div className="text-[11px] font-mono text-zinc-500 mb-1">Observation Output:</div>
                              <pre className="text-xs font-mono text-emerald-400/90 bg-black p-2.5 rounded border border-zinc-800/80 overflow-x-auto max-h-48">
                                {step.observation}
                              </pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Final Output Answer */}
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2">
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                      🤖 Final Agent Output
                    </span>
                    <div className="bg-black/60 border border-zinc-800/80 rounded-lg p-4 text-sm text-zinc-200 font-sans leading-relaxed whitespace-pre-wrap">
                      {lastResult.output}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: TOOL ARSENAL DIRECT SANDBOX                           */}
          {/* ============================================================ */}
          {activeTab === 'tools' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                  { id: 'web_search', name: 'web_search', icon: Search, desc: 'Real-time live internet facts & documentation' },
                  { id: 'file_system_reader', name: 'file_system_reader', icon: FileCode, desc: 'Read, write, append, list, exists, delete' },
                  { id: 'api_execution_tool', name: 'api_execution_tool', icon: Globe, desc: 'Trigger external REST endpoints & webhooks' },
                  { id: 'terminal_command_executor', name: 'terminal_command_executor', icon: Terminal, desc: 'Execute container bash commands' },
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTool(t.id);
                        setToolExecutionResult(null);
                      }}
                      className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                        selectedTool === t.id
                          ? 'bg-cyan-500/10 border-cyan-500/40 text-white'
                          : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`w-4 h-4 ${selectedTool === t.id ? 'text-cyan-400' : 'text-zinc-500'}`} />
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">@tool</span>
                      </div>
                      <div>
                        <div className="text-xs font-mono font-bold">{t.name}</div>
                        <div className="text-[11px] text-zinc-500 leading-snug line-clamp-2 mt-0.5">{t.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Direct Execution Box */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono">
                      Direct Execution: <span className="text-cyan-400">{selectedTool}</span>
                    </h3>
                    <p className="text-xs text-zinc-400">Execute without LLM reasoning to test raw parameters.</p>
                  </div>
                  <button
                    onClick={handleDirectToolExecute}
                    disabled={isExecutingTool}
                    className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    {isExecutingTool ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-black" />}
                    <span>Run Tool</span>
                  </button>
                </div>

                {/* Form controls based on tool */}
                {selectedTool === 'web_search' && (
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-zinc-400">Search Query:</label>
                    <input
                      type="text"
                      value={toolQuery}
                      onChange={(e) => setToolQuery(e.target.value)}
                      className="w-full bg-black/60 border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                {selectedTool === 'file_system_reader' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-mono text-zinc-400">Action:</label>
                        <select
                          value={toolAction}
                          onChange={(e) => setToolAction(e.target.value)}
                          className="w-full bg-black/60 border border-zinc-800 rounded-lg p-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-500 mt-1"
                        >
                          <option value="list">list</option>
                          <option value="read">read</option>
                          <option value="exists">exists</option>
                          <option value="write">write</option>
                          <option value="append">append</option>
                          <option value="delete">delete</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-mono text-zinc-400">Path:</label>
                        <input
                          type="text"
                          value={toolPath}
                          onChange={(e) => setToolPath(e.target.value)}
                          className="w-full bg-black/60 border border-zinc-800 rounded-lg p-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-500 mt-1"
                        />
                      </div>
                    </div>
                    {(toolAction === 'write' || toolAction === 'append') && (
                      <div>
                        <label className="text-xs font-mono text-zinc-400">Content to write:</label>
                        <textarea
                          value={toolContent}
                          onChange={(e) => setToolContent(e.target.value)}
                          rows={3}
                          className="w-full bg-black/60 border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-500 mt-1"
                        />
                      </div>
                    )}
                  </div>
                )}

                {selectedTool === 'api_execution_tool' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-mono text-zinc-400">Method:</label>
                        <select
                          value={toolApiMethod}
                          onChange={(e) => setToolApiMethod(e.target.value)}
                          className="w-full bg-black/60 border border-zinc-800 rounded-lg p-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-500 mt-1"
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="DELETE">DELETE</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-mono text-zinc-400">URL:</label>
                        <input
                          type="text"
                          value={toolApiUrl}
                          onChange={(e) => setToolApiUrl(e.target.value)}
                          className="w-full bg-black/60 border border-zinc-800 rounded-lg p-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-500 mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedTool === 'terminal_command_executor' && (
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-zinc-400">Bash Command:</label>
                    <input
                      type="text"
                      value={toolTerminalCmd}
                      onChange={(e) => setToolTerminalCmd(e.target.value)}
                      className="w-full bg-black/60 border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                {/* Execution Result */}
                {toolExecutionResult && (
                  <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-zinc-400 font-semibold">Execution Output:</span>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(toolExecutionResult, null, 2))}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Copy Result
                      </button>
                    </div>
                    <pre className="text-xs font-mono text-emerald-400 bg-black p-3.5 rounded-lg border border-zinc-800/80 overflow-x-auto max-h-60">
                      {JSON.stringify(toolExecutionResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: CONVERSATION BUFFER MEMORY STATE                      */}
          {/* ============================================================ */}
          {activeTab === 'memory' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div>
                  <h3 className="text-sm font-bold text-white">ConversationBufferMemory (chat_history)</h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    Retains multi-turn conversational context and tool interaction outputs across invocations.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadMemory}
                    disabled={isLoadingMemory}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMemory ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                  <button
                    onClick={handleClearMemory}
                    className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-xs text-red-300 border border-red-500/30 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Flush Memory</span>
                  </button>
                </div>
              </div>

              {memoryTurns.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-zinc-800 rounded-xl">
                  <Database className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400 font-mono">ConversationBufferMemory is currently empty.</p>
                  <p className="text-[11px] text-zinc-600 mt-1">Execute directives in the console to record turns.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {memoryTurns.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border text-xs ${
                        msg.role === 'user'
                          ? 'bg-zinc-900/80 border-cyan-500/30 text-zinc-200'
                          : 'bg-black/60 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-mono font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                          msg.role === 'user' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {msg.role}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-600">Turn #{idx + 1}</span>
                      </div>
                      <div className="whitespace-pre-wrap font-sans leading-relaxed">
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: RAW ENDPOINTS & CURL RECIPES                          */}
          {/* ============================================================ */}
          {activeTab === 'api' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  Administrative Credentials & Environment Keys
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-black/60 border border-zinc-800 rounded-lg">
                    <span className="text-zinc-500 text-[11px]">ADMIN_API_KEY:</span>
                    <div className="text-cyan-300 font-bold mt-1 select-all">{adminApiKey}</div>
                  </div>
                  <div className="p-3 bg-black/60 border border-zinc-800 rounded-lg">
                    <span className="text-zinc-500 text-[11px]">BASE_ENDPOINT_URL:</span>
                    <div className="text-emerald-400 font-bold mt-1 select-all">http://localhost:3000/api/langchain</div>
                  </div>
                </div>
              </div>

              {/* cURL Recipes */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  cURL Direct API Execution Recipes
                </span>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300 font-semibold">1. Execute Autonomous Agent Directive:</span>
                    <button
                      onClick={() => copyToClipboard(`curl -X POST http://localhost:3000/api/langchain/run \\
  -H "Content-Type: application/json" \\
  -H "X-Admin-Key: ${adminApiKey}" \\
  -d '{"prompt": "Search web for latest Python LangChain news"}'`)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy cURL
                    </button>
                  </div>
                  <pre className="text-[11px] text-zinc-300 bg-black p-3 rounded-lg border border-zinc-800 overflow-x-auto">
{`curl -X POST http://localhost:3000/api/langchain/run \\
  -H "Content-Type: application/json" \\
  -H "X-Admin-Key: ${adminApiKey}" \\
  -d '{"prompt": "Search web for latest Python LangChain news"}'`}
                  </pre>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300 font-semibold">2. Trigger Tool Directly (file_system_reader):</span>
                    <button
                      onClick={() => copyToClipboard(`curl -X POST http://localhost:3000/api/langchain/tools/execute \\
  -H "Content-Type: application/json" \\
  -d '{"tool_name": "file_system_reader", "arguments": {"action": "list", "path": "."}}'`)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy cURL
                    </button>
                  </div>
                  <pre className="text-[11px] text-zinc-300 bg-black p-3 rounded-lg border border-zinc-800 overflow-x-auto">
{`curl -X POST http://localhost:3000/api/langchain/tools/execute \\
  -H "Content-Type: application/json" \\
  -d '{"tool_name": "file_system_reader", "arguments": {"action": "list", "path": "."}}'`}
                  </pre>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300 font-semibold">3. Fetch Tool Arsenal Schemas:</span>
                    <button
                      onClick={() => copyToClipboard(`curl -X GET http://localhost:3000/api/langchain/tools`)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy cURL
                    </button>
                  </div>
                  <pre className="text-[11px] text-zinc-300 bg-black p-3 rounded-lg border border-zinc-800 overflow-x-auto">
{`curl -X GET http://localhost:3000/api/langchain/tools`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
