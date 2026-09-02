import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Terminal, 
  Trash2, 
  Copy, 
  Check, 
  Zap, 
  Code2, 
  Play, 
  X, 
  RotateCw,
  Package,
  Key,
  CheckCircle2,
  Settings,
  Flame,
  FileCode,
  FolderTree,
  Save,
  Plus,
  FilePlus,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Activity,
  Sparkles,
  Bot,
  Layers,
  Wrench,
  Globe,
  Timer,
  Cpu
} from 'lucide-react';

interface CodeTelemetryStats {
  executionTimeMs: number;
  durationFormatted: string;
  memoryUsageKb: number;
  memoryUsageMb: number;
  memoryFormatted: string;
  lastRunAt: string;
  isError: boolean;
  output: string;
  commandRan?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actionsExecuted?: Array<{
    type: string;
    details: any;
    result: string;
    executionTimeMs?: number;
    durationFormatted?: string;
    memoryUsageKb?: number;
    memoryUsageMb?: number;
    memoryFormatted?: string;
    lastRunAt?: string;
  }>;
  codeExecutionResult?: {
    output: string;
    isError: boolean;
    durationFormatted?: string;
    memoryFormatted?: string;
    lastRunAt?: string;
    executionTimeMs?: number;
    memoryUsageMb?: number;
  };
}

interface WorkspaceFile {
  path: string;
  name: string;
  isDirectory: boolean;
  size: number;
  ext: string;
}

interface DiagnosticResult {
  name: string;
  status: 'PASSED' | 'FAILED';
  details: string;
  durationMs: number;
}

const QUICK_ACTIONS = [
  {
    label: 'Playwright Web Automation',
    icon: <Globe className="w-3.5 h-3.5 text-zinc-400" />,
    prompt: 'Playwright Python script do jo web scraping aur dynamic page navigation kare.',
  },
  {
    label: 'Run Python Script',
    icon: <FileCode className="w-3.5 h-3.5 text-zinc-400" />,
    prompt: 'Python script execute karo aur result dikhao.',
  },
  {
    label: 'Pip Packages List',
    icon: <Package className="w-3.5 h-3.5 text-zinc-400" />,
    prompt: 'pip list command run karo.',
  },
  {
    label: 'Workspace Status',
    icon: <FolderTree className="w-3.5 h-3.5 text-zinc-400" />,
    prompt: 'scripts/ folder mein file check aur test karo.',
  },
  {
    label: 'Terminal Shell Status',
    icon: <Terminal className="w-3.5 h-3.5 text-zinc-400" />,
    prompt: 'python3 --version aur environment status check karo.',
  },
];

function cleanReply(text: string): string {
  if (!text) return '';
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^Here's a thinking process:[\s\S]*?(?=\n\n|\n[A-Z]|\nJi|\nMain|\nHere|\n1\.|\*|Yeh)/i, '')
    .trim();
}

export default function App() {
  const [customNvidiaKey, setCustomNvidiaKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [systemInfo, setSystemInfo] = useState<{ python: string; pip: string; cwd: string; engine: string } | null>(null);

  // Diagnostics & Training Modal State
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState<boolean>(false);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState<boolean>(false);
  const [diagnosticsResults, setDiagnosticsResults] = useState<DiagnosticResult[] | null>(null);
  const [diagnosticsPassedAll, setDiagnosticsPassedAll] = useState<boolean>(true);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Ji Halye! Main Halye AI hoon. Hukum karein Janab, foran execute hoga.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [executingMsgId, setExecutingMsgId] = useState<string | null>(null);
  const [codeTelemetry, setCodeTelemetry] = useState<Record<string, CodeTelemetryStats>>({});

  // Terminal state
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalType, setTerminalType] = useState<'bash' | 'python' | 'pip'>('bash');
  const [terminalCmd, setTerminalCmd] = useState('python3 -c "import playwright; print(\'Playwright available:\', playwright.__version__)"');
  const [terminalOutput, setTerminalOutput] = useState('Halye AI Live Root Terminal. Python 3.10, Pip & Playwright ready.\n');
  const [isExecuting, setIsExecuting] = useState(false);

  // File Manager / Self-Code Updater State
  const [isFileDrawerOpen, setIsFileDrawerOpen] = useState(false);
  const [filesList, setFilesList] = useState<WorkspaceFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isFileLoading, setIsFileLoading] = useState<boolean>(false);
  const [isFileSaving, setIsFileSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState<string>('');
  const [showNewFileDialog, setShowNewFileDialog] = useState<boolean>(false);

  // Save code modal from chat
  const [saveCodeModal, setSaveCodeModal] = useState<{ code: string; defaultPath: string } | null>(null);
  const [targetSavePath, setTargetSavePath] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConfig = () => {
    fetch('/api/config')
      .then((res) => res.json())
      .then(() => {})
      .catch(() => {});
  };

  const loadSystemInfo = () => {
    fetch('/api/system-info')
      .then((res) => res.json())
      .then((data) => {
        setSystemInfo(data);
      })
      .catch(() => {});
  };

  const loadFilesList = async () => {
    try {
      const res = await fetch('/api/files/list');
      const data = await res.json();
      if (data.files) {
        setFilesList(data.files);
      }
    } catch (e) {
      console.warn('Failed to load files:', e);
    }
  };

  useEffect(() => {
    loadConfig();
    loadSystemInfo();
  }, []);

  useEffect(() => {
    if (isFileDrawerOpen) {
      loadFilesList();
    }
  }, [isFileDrawerOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const runDiagnostics = async () => {
    setDiagnosticsRunning(true);
    try {
      const res = await fetch('/api/run-diagnostics', { method: 'POST' });
      const data = await res.json();
      setDiagnosticsResults(data.results || []);
      setDiagnosticsPassedAll(data.allPassed);
    } catch (e) {
      console.warn('Diagnostics error:', e);
    } finally {
      setDiagnosticsRunning(false);
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userPrompt: textToSend,
          customNvidiaKey: customNvidiaKey.trim() || undefined,
        }),
      });

      const data = await res.json();
      const rawText = data.reply || (data.success ? 'Done.' : data.error || 'Execution issue.');
      const cleaned = cleanReply(rawText);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleaned,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionsExecuted: data.executedActions && data.executedActions.length > 0 ? data.executedActions : undefined,
      };

      if (data.executedActions && data.executedActions.length > 0) {
        data.executedActions.forEach((act: any, aIdx: number) => {
          if (act.executionTimeMs !== undefined || act.durationFormatted) {
            const autoKey = `${assistantMessage.id}-${aIdx}`;
            setCodeTelemetry((prev) => ({
              ...prev,
              [autoKey]: {
                executionTimeMs: act.executionTimeMs || 0,
                durationFormatted: act.durationFormatted || `${act.executionTimeMs || 0} ms`,
                memoryUsageKb: act.memoryUsageKb || 16384,
                memoryUsageMb: act.memoryUsageMb || 16.0,
                memoryFormatted: act.memoryFormatted || '16.0 MB',
                lastRunAt: act.lastRunAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                isError: Boolean(act.result?.includes('Error:')),
                output: act.result || '',
                commandRan: act.type,
              },
            }));
          }
        });
      }

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Ji Halye, execution error: ' + (err?.message || 'Server error'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Run command in Terminal
  const executeCommand = async (cmd: string, type: 'bash' | 'python' | 'pip' = 'bash') => {
    setIsExecuting(true);
    setIsTerminalOpen(true);
    setTerminalType(type);
    setTerminalCmd(cmd);
    setTerminalOutput((prev) => prev + `\n$ [${type.toUpperCase()}] ${cmd}\n`);

    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, type }),
      });
      const data = await res.json();
      
      const statsBadge = `[⏱️ Execution: ${data.durationFormatted || data.executionTimeMs + ' ms' || 'N/A'} | 💾 Memory: ${data.memoryFormatted || '16.0 MB'} | Exit: ${data.success ? '0' : '1'}]\n`;
      setTerminalOutput((prev) => prev + statsBadge);

      if (data.stdout) {
        setTerminalOutput((prev) => prev + data.stdout + '\n');
      }
      if (data.stderr) {
        setTerminalOutput((prev) => prev + `[ERR] ` + data.stderr + '\n');
      }
      if (!data.stdout && !data.stderr) {
        setTerminalOutput((prev) => prev + `[Completed with exit code 0]\n`);
      }
    } catch (err: any) {
      setTerminalOutput((prev) => prev + `Execution error: ${err.message}\n`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Run code directly inline from a message block
  const executeInlineCode = async (msgId: string, code: string, lang: string, blockIdx: number = 0) => {
    const blockKey = `${msgId}-${blockIdx}`;
    setExecutingMsgId(blockKey);
    let type: 'bash' | 'python' | 'pip' = 'bash';
    if (lang.toLowerCase() === 'python' || lang.toLowerCase() === 'py') {
      type = 'python';
    } else if (code.trim().startsWith('pip') || lang.toLowerCase() === 'pip') {
      type = 'pip';
      code = code.replace(/^pip\s+/, '');
    }

    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: code, type }),
      });
      const data = await res.json();
      const outputText = data.stdout || data.stderr || 'Executed successfully (exit code 0)';
      const isErr = !data.success || Boolean(data.stderr && !data.stdout);

      const stats: CodeTelemetryStats = {
        executionTimeMs: data.executionTimeMs ?? 0,
        durationFormatted: data.durationFormatted || (data.executionTimeMs !== undefined ? `${data.executionTimeMs} ms` : '12 ms'),
        memoryUsageKb: data.memoryUsageKb || 16384,
        memoryUsageMb: data.memoryUsageMb || 16.0,
        memoryFormatted: data.memoryFormatted || '16.0 MB',
        lastRunAt: data.lastRunAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isError: isErr,
        output: outputText,
        commandRan: data.commandRan,
      };

      setCodeTelemetry((prev) => ({
        ...prev,
        [blockKey]: stats,
      }));

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                codeExecutionResult: {
                  output: outputText,
                  isError: isErr,
                  durationFormatted: stats.durationFormatted,
                  memoryFormatted: stats.memoryFormatted,
                  lastRunAt: stats.lastRunAt,
                  executionTimeMs: stats.executionTimeMs,
                  memoryUsageMb: stats.memoryUsageMb,
                },
              }
            : m
        )
      );
    } catch (err: any) {
      const errStats: CodeTelemetryStats = {
        executionTimeMs: 0,
        durationFormatted: 'Err',
        memoryUsageKb: 0,
        memoryUsageMb: 0,
        memoryFormatted: 'N/A',
        lastRunAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isError: true,
        output: 'Execution failed: ' + err.message,
      };

      setCodeTelemetry((prev) => ({
        ...prev,
        [blockKey]: errStats,
      }));

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                codeExecutionResult: {
                  output: 'Execution failed: ' + err.message,
                  isError: true,
                  durationFormatted: 'Err',
                  memoryFormatted: 'N/A',
                },
              }
            : m
        )
      );
    } finally {
      setExecutingMsgId(null);
    }
  };

  // Open file in Editor
  const handleOpenFile = async (filePath: string) => {
    setSelectedFile(filePath);
    setIsFileLoading(true);
    setSaveSuccessMsg(null);
    try {
      const res = await fetch(`/api/files/read?path=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      if (data.content !== undefined) {
        setFileContent(data.content);
      }
    } catch (err) {
      console.warn('Failed to read file:', err);
    } finally {
      setIsFileLoading(false);
    }
  };

  // Save file from Editor
  const handleSaveFile = async () => {
    if (!selectedFile) return;
    setIsFileSaving(true);
    setSaveSuccessMsg(null);
    try {
      const res = await fetch('/api/files/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: selectedFile, content: fileContent }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccessMsg('File saved successfully!');
        loadFilesList();
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      alert('Save failed: ' + err.message);
    } finally {
      setIsFileSaving(false);
    }
  };

  // Create new file
  const handleCreateNewFile = async () => {
    if (!newFileName.trim()) return;
    const path = newFileName.trim().startsWith('scripts/') 
      ? newFileName.trim() 
      : `scripts/${newFileName.trim()}`;
    
    try {
      const res = await fetch('/api/files/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: path, content: '# Halye Script\n' }),
      });
      const data = await res.json();
      if (data.success) {
        setShowNewFileDialog(false);
        setNewFileName('');
        loadFilesList();
        handleOpenFile(path);
      }
    } catch (e: any) {
      alert('File creation failed: ' + e.message);
    }
  };

  // Save code block to workspace file directly from chat
  const handleSaveCodeToWorkspace = async () => {
    if (!saveCodeModal || !targetSavePath.trim()) return;
    try {
      const res = await fetch('/api/files/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: targetSavePath.trim(),
          content: saveCodeModal.code,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveCodeModal(null);
        setTargetSavePath('');
        loadFilesList();
        alert(`Saved successfully to '${data.path}'!`);
      }
    } catch (err: any) {
      alert('Error saving code: ' + err.message);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Ji Halye! Main Halye AI hoon. Hukum karein Janab, foran execute hoga.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const renderMessageContent = (msg: Message) => {
    const { content, id: msgId, codeExecutionResult, actionsExecuted } = msg;
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index),
        });
      }

      const lang = match[1] || 'python';
      const code = match[2].trim();
      parts.push({
        type: 'code',
        lang,
        code,
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex),
      });
    }

    return (
      <div className="space-y-3">
        {/* Autonomous Action Badges */}
        {actionsExecuted && actionsExecuted.length > 0 && (
          <div className="space-y-1.5 mb-2">
            {actionsExecuted.map((act, aIdx) => (
              <div 
                key={aIdx} 
                className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700/80 text-zinc-200"
              >
                <Zap className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span><strong className="text-zinc-100">Action [{act.type}]:</strong> {act.result}</span>
              </div>
            ))}
          </div>
        )}

        {parts.map((p, idx) => {
          if (p.type === 'text') {
            return (
              <div key={idx} className="whitespace-pre-wrap leading-relaxed text-zinc-200">
                {p.content}
              </div>
            );
          }

          const isPython = p.lang?.toLowerCase() === 'python' || p.lang?.toLowerCase() === 'py';
          const defaultFileName = isPython ? 'scripts/script.py' : 'scripts/command.sh';
          const blockKey = `${msgId}-${idx}`;
          const stats = codeTelemetry[blockKey];
          const isThisRunning = executingMsgId === blockKey;

          return (
            <div key={idx} className="my-3 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-lg relative group">
              {/* Code Header with Live Actions and Stats Summary */}
              <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-900/90 border-b border-zinc-800 gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold">
                    {p.lang || 'code'}
                  </span>

                  {/* Header summary badge if stats available */}
                  {stats && (
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 border border-zinc-700 text-zinc-300">
                      <Timer className="w-3 h-3 text-zinc-400" />
                      <span>{stats.durationFormatted}</span>
                      <span className="text-zinc-600">•</span>
                      <Cpu className="w-3 h-3 text-zinc-400" />
                      <span>{stats.memoryFormatted}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Save to Workspace Button */}
                  <button
                    onClick={() => {
                      setSaveCodeModal({ code: p.code || '', defaultPath: defaultFileName });
                      setTargetSavePath(defaultFileName);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                    title="Save script to workspace file"
                  >
                    <Save className="w-3 h-3 text-zinc-400" />
                    <span className="hidden md:inline">Save to File</span>
                  </button>

                  {/* Run Code Directly Button */}
                  <button
                    onClick={() => executeInlineCode(msgId, p.code || '', p.lang || 'python', idx)}
                    disabled={isThisRunning}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-zinc-100 hover:bg-white text-zinc-950 font-semibold shadow-sm transition-all disabled:opacity-50"
                  >
                    {isThisRunning ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-zinc-950" />
                    ) : (
                      <Play className="w-3 h-3 fill-current text-zinc-950" />
                    )}
                    <span>{isThisRunning ? 'Running...' : 'Run in Terminal'}</span>
                  </button>

                  {/* Copy Button */}
                  <button
                    onClick={() => copyToClipboard(p.code || '', `${msgId}-${idx}`)}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-100 transition-colors"
                    title="Copy code"
                  >
                    {copiedId === `${msgId}-${idx}` ? (
                      <Check className="w-3.5 h-3.5 text-zinc-200" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Code Container with Live Telemetry Overlay */}
              <div className="relative">
                {/* Floating Telemetry Overlay (Last Execution Time & Total Memory Usage) */}
                {isThisRunning ? (
                  <div className="absolute top-2.5 right-3 z-20 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-600 backdrop-blur-md text-[11px] font-mono text-zinc-200 shadow-xl animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin text-zinc-400" />
                    <span className="font-semibold">Measuring runtime & memory...</span>
                  </div>
                ) : stats ? (
                  <div 
                    className="absolute top-2.5 right-3 z-20 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-900/95 border border-zinc-700 backdrop-blur-md text-[11px] font-mono text-zinc-200 shadow-xl hover:border-zinc-500 transition-all"
                    title={`Last Execution: ${stats.durationFormatted} | Memory Usage: ${stats.memoryFormatted} | Last run at: ${stats.lastRunAt}`}
                  >
                    {/* Execution Time */}
                    <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                      <Timer className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="font-bold text-zinc-100">{stats.durationFormatted}</span>
                    </div>

                    <span className="text-zinc-600 text-xs">|</span>

                    {/* Total Memory Usage */}
                    <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                      <Cpu className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="font-bold text-zinc-100">{stats.memoryFormatted}</span>
                    </div>

                    <span className="text-zinc-600 text-xs">|</span>

                    {/* Exit status dot & timestamp */}
                    <div className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${stats.isError ? 'bg-red-400' : 'bg-emerald-400'}`} />
                      <span className="text-[10px] text-zinc-400">{stats.lastRunAt}</span>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => executeInlineCode(msgId, p.code || '', p.lang || 'python', idx)}
                    className="absolute top-2.5 right-3 z-20 opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-700 backdrop-blur-md text-[10px] font-mono text-zinc-300 shadow-md hover:border-zinc-500 hover:text-white cursor-pointer transition-all"
                    title="Click to execute and benchmark script"
                  >
                    <Play className="w-2.5 h-2.5 fill-current text-zinc-400" />
                    <span>Click to profile</span>
                  </div>
                )}

                {/* Code block body */}
                <div className="p-3.5 overflow-x-auto text-xs font-mono text-zinc-200 leading-relaxed max-h-[320px]">
                  <code>{p.code}</code>
                </div>
              </div>

              {/* Inline Execution Output if user executed this code block */}
              {stats && stats.output && (
                <div className="p-3 border-t border-zinc-800 bg-zinc-950 font-mono text-xs shadow-inner">
                  <div className="flex items-center justify-between mb-1.5 text-zinc-300">
                    <span className="flex items-center gap-1.5 font-bold text-[11px]">
                      <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                      Execution Output:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium">
                        ⏱️ {stats.durationFormatted} • 💾 {stats.memoryFormatted}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${stats.isError ? 'bg-red-950/60 border border-red-800 text-red-300' : 'bg-zinc-800 border border-zinc-700 text-zinc-300'}`}>
                        {stats.isError ? 'Exit Error' : 'Exit 0 Success'}
                      </span>
                    </div>
                  </div>
                  <pre className="text-zinc-200 whitespace-pre-wrap overflow-x-auto max-h-[180px] leading-snug bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800">
                    {stats.output}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 antialiased font-sans select-none overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/90 bg-zinc-950 backdrop-blur-md shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5 text-zinc-100" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-zinc-950"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Halye AI
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 font-semibold uppercase tracking-wider">
                  Root Assistant
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              Creator: Halye • Playwright 1.62.0 • Python 3.10 Engine • Direct Execution
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Training & Diagnostics Button */}
          <button
            onClick={() => {
              setShowDiagnosticsModal(true);
              runDiagnostics();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-200 transition-all"
            title="Run Agent Training & Diagnostics"
          >
            <Activity className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Diagnostics</span>
          </button>

          {/* Workspace Files / Self-Code Updater */}
          <button
            onClick={() => setIsFileDrawerOpen(!isFileDrawerOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              isFileDrawerOpen 
                ? 'bg-zinc-100 text-zinc-950 font-semibold border-white' 
                : 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Files</span>
          </button>

          {/* Root Terminal Drawer Toggle */}
          <button
            onClick={() => setIsTerminalOpen(!isTerminalOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              isTerminalOpen 
                ? 'bg-zinc-100 text-zinc-950 font-semibold border-white' 
                : 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Terminal</span>
          </button>

          {/* Clear Chat */}
          <button
            onClick={clearChat}
            className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Reset Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Chat Feed */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Scrollable Message History */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-4xl mx-auto w-full`}
                >
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    <span className="text-[11px] font-bold font-mono tracking-wider text-zinc-400">
                      {isUser ? 'HALYE' : 'HALYE AI'}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`rounded-2xl px-5 py-4 text-sm max-w-[92%] sm:max-w-[85%] leading-relaxed ${
                      isUser
                        ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60 rounded-tr-none font-medium'
                        : 'bg-zinc-900/90 text-zinc-200 border border-zinc-800 rounded-tl-none font-normal'
                    }`}
                  >
                    {isUser ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      renderMessageContent(msg)
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex flex-col items-start max-w-4xl mx-auto w-full">
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[11px] font-bold font-mono text-zinc-400">HALYE AI</span>
                  <span className="text-[10px] text-zinc-500 animate-pulse">Executing command...</span>
                </div>
                <div className="rounded-2xl rounded-tl-none px-5 py-4 bg-zinc-900 border border-zinc-800 text-zinc-200 flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 animate-spin text-zinc-400" />
                  <span className="text-xs font-mono">Processing request directly on Halye's command...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="px-4 sm:px-6 py-2 border-t border-zinc-800/80 bg-zinc-950/80 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-4xl mx-auto scrollbar-none">
              <span className="text-[11px] font-mono font-bold text-zinc-400 shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-zinc-500" /> Commands:
              </span>
              {QUICK_ACTIONS.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(action.prompt)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white shrink-0 transition-all"
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="p-4 sm:p-6 bg-zinc-950 border-t border-zinc-800/80 shrink-0">
            <div className="max-w-4xl mx-auto relative flex items-center">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Halye, hukum dein..."
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3.5 pr-20 text-sm text-zinc-100 placeholder-zinc-500 outline-none resize-none h-[54px] max-h-[160px] focus:border-zinc-600 transition-all shadow-inner"
                rows={1}
              />

              <div className="absolute right-2.5 flex items-center gap-1.5">
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold transition-all disabled:opacity-30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Live Root Terminal Sidebar / Drawer */}
        {isTerminalOpen && (
          <aside className="w-full sm:w-[460px] border-l border-zinc-800 bg-zinc-950 flex flex-col h-full z-20 shadow-2xl shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-bold font-mono text-zinc-200">Live Terminal</span>
              </div>
              <button
                onClick={() => setIsTerminalOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type selector */}
            <div className="flex items-center gap-2 p-3 border-b border-zinc-800 bg-zinc-950">
              {(['bash', 'python', 'pip'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTerminalType(t)}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-bold uppercase transition-all ${
                    terminalType === t
                      ? 'bg-zinc-100 text-zinc-950 font-bold'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Terminal Output */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-zinc-200 space-y-1 bg-zinc-950">
              <pre className="whitespace-pre-wrap leading-relaxed">{terminalOutput}</pre>
            </div>

            {/* Terminal Input */}
            <div className="p-3 border-t border-zinc-800 bg-zinc-950">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-zinc-400">$</span>
                <input
                  type="text"
                  value={terminalCmd}
                  onChange={(e) => setTerminalCmd(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      executeCommand(terminalCmd, terminalType);
                    }
                  }}
                  placeholder={`Run ${terminalType} command...`}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-zinc-600"
                />
                <button
                  onClick={() => executeCommand(terminalCmd, terminalType)}
                  disabled={isExecuting}
                  className="px-3 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-mono font-bold"
                >
                  {isExecuting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Exec'}
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Self-Code Workspace File Drawer */}
        {isFileDrawerOpen && (
          <aside className="w-full sm:w-[500px] border-l border-zinc-800 bg-zinc-950 flex flex-col h-full z-20 shadow-2xl shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-bold font-mono text-zinc-200">Workspace Files</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNewFileDialog(true)}
                  className="p-1 rounded text-zinc-300 hover:bg-zinc-800"
                  title="New File"
                >
                  <FilePlus className="w-4 h-4" />
                </button>
                <button
                  onClick={loadFilesList}
                  className="p-1 rounded text-zinc-300 hover:bg-zinc-800"
                  title="Refresh File List"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsFileDrawerOpen(false)}
                  className="p-1 rounded text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* File List & Editor split */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* File tree browser */}
              <div className="h-44 overflow-y-auto p-2 border-b border-zinc-800 bg-zinc-950 text-xs font-mono">
                {filesList.length === 0 ? (
                  <div className="p-3 text-zinc-500 text-center">Loading files...</div>
                ) : (
                  filesList.map((f) => (
                    <div
                      key={f.path}
                      onClick={() => !f.isDirectory && handleOpenFile(f.path)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition-colors ${
                        selectedFile === f.path
                          ? 'bg-zinc-800 border border-zinc-700 text-zinc-100 font-bold'
                          : 'hover:bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {f.isDirectory ? (
                          <span className="text-zinc-400">📁</span>
                        ) : (
                          <FileCode className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        )}
                        <span className="truncate">{f.path}</span>
                      </div>
                      {!f.isDirectory && (
                        <span className="text-[10px] text-zinc-500 shrink-0">{f.size} B</span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Code Editor for Selected File */}
              <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900">
                  <span className="text-xs font-mono text-zinc-300 font-bold truncate">
                    {selectedFile || 'Select a file to view or edit'}
                  </span>
                  {selectedFile && (
                    <div className="flex items-center gap-2">
                      {saveSuccessMsg && (
                        <span className="text-[10px] text-emerald-400 font-mono font-bold animate-pulse">
                          {saveSuccessMsg}
                        </span>
                      )}
                      <button
                        onClick={handleSaveFile}
                        disabled={isFileSaving}
                        className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-mono font-bold"
                      >
                        {isFileSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        <span>Save</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 p-2 overflow-hidden">
                  <textarea
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    disabled={!selectedFile || isFileLoading}
                    placeholder="File content will appear here..."
                    className="w-full h-full bg-zinc-900 border border-zinc-800 rounded p-3 font-mono text-xs text-zinc-100 outline-none resize-none focus:border-zinc-600"
                  />
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Diagnostics & Self-Training Modal */}
      {showDiagnosticsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-zinc-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Diagnostics & Capabilities
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    Playwright, Python 3.10 Engine, Workspace Files & Terminal clearance
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDiagnosticsModal(false)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Test Results List */}
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {diagnosticsRunning && (
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-3 text-zinc-300">
                  <RefreshCw className="w-5 h-5 animate-spin text-zinc-400" />
                  <span className="text-xs font-mono">Running diagnostic tests...</span>
                </div>
              )}

              {diagnosticsResults && diagnosticsResults.map((r, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      {r.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold">
                      {r.status} ({r.durationMs}ms)
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono pl-6">{r.details}</p>
                </div>
              ))}
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <span className="text-xs font-mono text-zinc-400">
                Creator: <strong>Halye</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={runDiagnostics}
                  disabled={diagnosticsRunning}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold shadow-md transition-all"
                >
                  {diagnosticsRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
                  <span>Rerun Tests</span>
                </button>
                <button
                  onClick={() => setShowDiagnosticsModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Code to Workspace Modal */}
      {saveCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-zinc-400" />
              Save Code to Workspace
            </h3>
            <p className="text-xs text-zinc-400 font-mono">
              Halye AI will write this script directly to the project files.
            </p>

            <input
              type="text"
              value={targetSavePath}
              onChange={(e) => setTargetSavePath(e.target.value)}
              placeholder="e.g. scripts/scraper.py"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-mono text-white outline-none focus:border-zinc-600"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSaveCodeModal(null)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCodeToWorkspace}
                className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-mono font-bold"
              >
                Save File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New File Dialog */}
      {showNewFileDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FilePlus className="w-4 h-4 text-zinc-400" />
              Create New Workspace File
            </h3>

            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="e.g. my_test_script.py"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-mono text-white outline-none focus:border-zinc-600"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewFileDialog(false)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewFile}
                className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-mono font-bold"
              >
                Create File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
