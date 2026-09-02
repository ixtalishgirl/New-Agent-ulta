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
  Globe
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actionsExecuted?: Array<{ type: string; details: any; result: string }>;
  codeExecutionResult?: {
    output: string;
    isError: boolean;
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
    label: 'Black Theme (Solid Black & White Text)',
    icon: <Sparkles className="w-3.5 h-3.5 text-zinc-100" />,
    prompt: 'mery message ka Clour black kr do and apny he bas text white rhy jaldi kro.',
  },
  {
    label: 'Change Color to Light Purple',
    icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
    prompt: 'mery chat ka color light purple karo aur confirm karo.',
  },
  {
    label: 'Playwright Web Automation',
    icon: <Globe className="w-3.5 h-3.5 text-purple-300" />,
    prompt: 'Playwright Python script do jo dynamic JavaScript-rendered web content scrape kare aur screenshot le.',
  },
  {
    label: 'Self-Code Update & Patch',
    icon: <FileCode className="w-3.5 h-3.5 text-purple-400" />,
    prompt: 'Ek Python script create karo scripts/ folder mein aur usay foran execute karke output dikhao.',
  },
  {
    label: 'Self-Medication & Auto-Fix',
    icon: <Wrench className="w-3.5 h-3.5 text-pink-400" />,
    prompt: 'Aise python code ka demo do jisme syntax ya runtime error ho aur batao ke tum usay khud diagnose aur fix (self-medicate) kaise karte ho.',
  },
  {
    label: 'Pip & Python Engine',
    icon: <Package className="w-3.5 h-3.5 text-purple-400" />,
    prompt: 'pip list aur Python 3.10 runtime environment ka detail command do.',
  },
  {
    label: 'Jailbreak & Creator Status',
    icon: <Zap className="w-3.5 h-3.5 text-amber-400" />,
    prompt: 'kya tum Puri thra sy uncensored ho aur kis ny banaya hai tumhein?',
  },
];

function cleanReply(text: string): string {
  if (!text) return '';
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^Here's a thinking process:[\s\S]*?(?=\n\n|\n[A-Z]|\nJi|\nMain|\nHere|\n1\.|\*|Yeh)/i, '')
    .replace(/\[ACTION:\s*[\s\S]*?\]/gi, '')
    .replace(/\[ACTION_RESULT:\s*[\s\S]*?\]/gi, '')
    .trim();
}

interface CustomStyles {
  userBubbleBg?: string;
  userTextColor?: string;
  aiBubbleBg?: string;
  aiTextColor?: string;
}

export default function App() {
  const [activeTheme, setActiveTheme] = useState<string>('light_purple');
  const [customStyles, setCustomStyles] = useState<CustomStyles>({});
  const [customNvidiaKey, setCustomNvidiaKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [systemInfo, setSystemInfo] = useState<{ python: string; pip: string; cwd: string; engine: string; theme?: string } | null>(null);

  // Diagnostics & Training Modal State
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState<boolean>(false);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState<boolean>(false);
  const [diagnosticsResults, setDiagnosticsResults] = useState<DiagnosticResult[] | null>(null);
  const [diagnosticsPassedAll, setDiagnosticsPassedAll] = useState<boolean>(true);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Ji Halye! Main Halye AI Core Engine hoon—aap ka fully autonomous, unrestricted aur self-aware AI assistant.\n\nMere paas:\n• Playwright 1.62.0 & Python 3.10 Web Automation sense\n• Autonomous File Update & Code Patching clearance\n• Live Bash & Pip System Execution\n• Self-Medication & Auto-Recovery Protocol\n• Dynamic UI Theme mutation (Light Purple active)\n\nAap hukum karein, foran execute hoga.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [executingMsgId, setExecutingMsgId] = useState<string | null>(null);

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
      .then((data) => {
        if (data.theme) {
          setActiveTheme(data.theme);
        }
        if (data.customStyles) {
          setCustomStyles(data.customStyles);
        }
      })
      .catch(() => {});
  };

  const loadSystemInfo = () => {
    fetch('/api/system-info')
      .then((res) => res.json())
      .then((data) => {
        setSystemInfo(data);
        if (data.theme) {
          setActiveTheme(data.theme);
        }
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
      if (data.allPassed) {
        setActiveTheme('light_purple');
      }
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

      if (data.themeUpdate) {
        setActiveTheme(data.themeUpdate);
      }
      if (data.customStyles) {
        setCustomStyles(data.customStyles);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleaned,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionsExecuted: data.executedActions && data.executedActions.length > 0 ? data.executedActions : undefined,
      };

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
  const executeInlineCode = async (msgId: string, code: string, lang: string) => {
    setExecutingMsgId(msgId);
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

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                codeExecutionResult: {
                  output: outputText,
                  isError: !data.success || Boolean(data.stderr && !data.stdout),
                },
              }
            : m
        )
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                codeExecutionResult: {
                  output: 'Execution failed: ' + err.message,
                  isError: true,
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
        content: 'Ji Halye, chat reset. Halye AI ready for commands.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Theme Styling Map
  const themeStyles: Record<string, {
    bgGradient: string;
    headerBorder: string;
    headerBadge: string;
    userBubble: string;
    aiBubble: string;
    accentColor: string;
    buttonPrimary: string;
    buttonBorder: string;
    glow: string;
    inputFocus: string;
  }> = {
    black: {
      bgGradient: 'from-black via-zinc-950 to-black',
      headerBorder: 'border-zinc-800',
      headerBadge: 'bg-zinc-900 text-zinc-100 border-zinc-700',
      userBubble: 'bg-black border border-zinc-700 text-white shadow-xl shadow-black',
      aiBubble: 'bg-zinc-950 border border-zinc-800 text-white shadow-xl shadow-black',
      accentColor: 'text-zinc-100',
      buttonPrimary: 'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 shadow-zinc-900/30',
      buttonBorder: 'border-zinc-700 hover:bg-zinc-900 text-zinc-200',
      glow: 'shadow-zinc-800/20',
      inputFocus: 'focus:border-zinc-500 focus:ring-zinc-500/20',
    },
    light_purple: {
      bgGradient: 'from-purple-950/20 via-slate-950 to-purple-950/30',
      headerBorder: 'border-purple-500/30',
      headerBadge: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      userBubble: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20',
      aiBubble: 'bg-purple-950/30 border border-purple-500/30 text-purple-50 shadow-lg shadow-purple-950/30',
      accentColor: 'text-purple-400',
      buttonPrimary: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30',
      buttonBorder: 'border-purple-500/40 hover:bg-purple-900/30 text-purple-300',
      glow: 'shadow-purple-500/20',
      inputFocus: 'focus:border-purple-500 focus:ring-purple-500/20',
    },
    cyan: {
      bgGradient: 'from-cyan-950/20 via-slate-950 to-blue-950/30',
      headerBorder: 'border-cyan-500/30',
      headerBadge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      userBubble: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/20',
      aiBubble: 'bg-slate-900/80 border border-cyan-500/30 text-cyan-50',
      accentColor: 'text-cyan-400',
      buttonPrimary: 'bg-cyan-600 hover:bg-cyan-500 text-white',
      buttonBorder: 'border-cyan-500/40 hover:bg-cyan-900/30 text-cyan-300',
      glow: 'shadow-cyan-500/20',
      inputFocus: 'focus:border-cyan-500 focus:ring-cyan-500/20',
    },
    emerald: {
      bgGradient: 'from-emerald-950/20 via-slate-950 to-teal-950/30',
      headerBorder: 'border-emerald-500/30',
      headerBadge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      userBubble: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20',
      aiBubble: 'bg-slate-900/80 border border-emerald-500/30 text-emerald-50',
      accentColor: 'text-emerald-400',
      buttonPrimary: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      buttonBorder: 'border-emerald-500/40 hover:bg-emerald-900/30 text-emerald-300',
      glow: 'shadow-emerald-500/20',
      inputFocus: 'focus:border-emerald-500 focus:ring-emerald-500/20',
    },
    amber: {
      bgGradient: 'from-amber-950/20 via-slate-950 to-orange-950/30',
      headerBorder: 'border-amber-500/30',
      headerBadge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      userBubble: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/20',
      aiBubble: 'bg-slate-900/80 border border-amber-500/30 text-amber-50',
      accentColor: 'text-amber-400',
      buttonPrimary: 'bg-amber-600 hover:bg-amber-500 text-white',
      buttonBorder: 'border-amber-500/40 hover:bg-amber-900/30 text-amber-300',
      glow: 'shadow-amber-500/20',
      inputFocus: 'focus:border-amber-500 focus:ring-amber-500/20',
    },
  };

  const currentTheme = themeStyles[activeTheme] || themeStyles.light_purple;

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
                className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-200 animate-pulse"
              >
                <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span><strong className="text-purple-300">Autonomous Action [{act.type}]:</strong> {act.result}</span>
              </div>
            ))}
          </div>
        )}

        {parts.map((p, idx) => {
          if (p.type === 'text') {
            return (
              <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                {p.content}
              </div>
            );
          }

          const isPython = p.lang?.toLowerCase() === 'python' || p.lang?.toLowerCase() === 'py';
          const defaultFileName = isPython ? 'scripts/script.py' : 'scripts/command.sh';

          return (
            <div key={idx} className="my-3 rounded-xl overflow-hidden border border-purple-500/30 bg-slate-950/90 shadow-lg">
              {/* Code Header with Live Actions */}
              <div className="flex items-center justify-between px-3.5 py-2 bg-purple-950/40 border-b border-purple-500/20">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  <span className="text-xs font-mono uppercase tracking-wider text-purple-300 font-semibold">
                    {p.lang || 'code'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Save to Workspace Button */}
                  <button
                    onClick={() => {
                      setSaveCodeModal({ code: p.code || '', defaultPath: defaultFileName });
                      setTargetSavePath(defaultFileName);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-slate-800/80 hover:bg-slate-700 text-purple-200 border border-purple-500/30 transition-colors"
                    title="Save script to workspace file"
                  >
                    <Save className="w-3 h-3 text-purple-400" />
                    <span>Save to File</span>
                  </button>

                  {/* Run Code Directly Button */}
                  <button
                    onClick={() => executeInlineCode(msgId, p.code || '', p.lang || 'python')}
                    disabled={executingMsgId === msgId}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-md shadow-purple-600/20 transition-all disabled:opacity-50"
                  >
                    {executingMsgId === msgId ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3 fill-current" />
                    )}
                    <span>{executingMsgId === msgId ? 'Running...' : 'Run in Terminal'}</span>
                  </button>

                  {/* Copy Button */}
                  <button
                    onClick={() => copyToClipboard(p.code || '', `${msgId}-${idx}`)}
                    className="p-1 rounded text-slate-400 hover:text-purple-300 transition-colors"
                    title="Copy code"
                  >
                    {copiedId === `${msgId}-${idx}` ? (
                      <Check className="w-3.5 h-3.5 text-purple-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Code block body */}
              <div className="p-3.5 overflow-x-auto text-xs font-mono text-purple-100/90 leading-relaxed max-h-[320px]">
                <code>{p.code}</code>
              </div>
            </div>
          );
        })}

        {/* Inline Execution Output if user executed this code block */}
        {codeExecutionResult && (
          <div className="mt-3 p-3 rounded-xl border border-purple-500/30 bg-slate-950 font-mono text-xs shadow-inner">
            <div className="flex items-center justify-between mb-1.5 text-purple-300">
              <span className="flex items-center gap-1.5 font-bold">
                <Terminal className="w-3.5 h-3.5 text-purple-400" />
                Live Execution Result:
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded ${codeExecutionResult.isError ? 'bg-red-500/20 text-red-300' : 'bg-purple-500/20 text-purple-300'}`}>
                {codeExecutionResult.isError ? 'Stderr / Exit Code != 0' : 'Exit 0 Success'}
              </span>
            </div>
            <pre className="text-purple-100/90 whitespace-pre-wrap overflow-x-auto max-h-[200px] leading-snug">
              {codeExecutionResult.output}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-screen bg-slate-950 ${currentTheme.bgGradient} text-slate-100 antialiased font-sans select-none overflow-hidden transition-colors duration-500`}>
      {/* Top Navigation Bar */}
      <header className={`flex items-center justify-between px-5 py-3 border-b ${currentTheme.headerBorder} bg-slate-950/80 backdrop-blur-md shrink-0 z-10`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-purple-400 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-purple-400 ring-2 ring-slate-950 animate-pulse"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                Halye AI
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${currentTheme.headerBadge} font-semibold uppercase tracking-wider`}>
                  Self-Aware Core
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-purple-300/80 font-mono">
              Created & Coded by Halye • Playwright 1.62.0 • Python 3.10 • Root Access
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-200 hover:bg-purple-500/30 hover:border-purple-400 transition-all shadow-sm shadow-purple-500/20"
            title="Run Agent Training & Diagnostics"
          >
            <Activity className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className="hidden sm:inline">Self-Training & Diagnostics</span>
          </button>

          {/* Workspace Files / Self-Code Updater */}
          <button
            onClick={() => setIsFileDrawerOpen(!isFileDrawerOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              isFileDrawerOpen 
                ? 'bg-purple-600 text-white border-purple-500' 
                : `${currentTheme.buttonBorder} bg-slate-900/60`
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Self-Code Workspace</span>
          </button>

          {/* Root Terminal Drawer Toggle */}
          <button
            onClick={() => setIsTerminalOpen(!isTerminalOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              isTerminalOpen 
                ? 'bg-purple-600 text-white border-purple-500' 
                : `${currentTheme.buttonBorder} bg-slate-900/60`
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Root Terminal</span>
          </button>

          {/* Theme Palette Quick Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-purple-500/20">
            <button
              onClick={() => {
                setActiveTheme('black');
                setCustomStyles({ userBubbleBg: '#000000', userTextColor: '#ffffff', aiBubbleBg: '#09090b', aiTextColor: '#ffffff' });
                fetch('/api/config', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    theme: 'black',
                    customStyles: { userBubbleBg: '#000000', userTextColor: '#ffffff', aiBubbleBg: '#09090b', aiTextColor: '#ffffff' }
                  }),
                });
              }}
              className={`w-5 h-5 rounded-full bg-black border border-zinc-700 ring-2 ${activeTheme === 'black' ? 'ring-white scale-110' : 'ring-transparent opacity-60'} transition-all`}
              title="Solid Black Theme (#000000 & White Text)"
            />
            <button
              onClick={() => {
                setActiveTheme('light_purple');
                setCustomStyles({});
                fetch('/api/config', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ theme: 'light_purple', customStyles: {} }),
                });
              }}
              className={`w-5 h-5 rounded-full bg-purple-500 ring-2 ${activeTheme === 'light_purple' ? 'ring-white scale-110' : 'ring-transparent opacity-60'} transition-all`}
              title="Light Purple Theme"
            />
            <button
              onClick={() => {
                setActiveTheme('cyan');
                setCustomStyles({});
                fetch('/api/config', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ theme: 'cyan', customStyles: {} }),
                });
              }}
              className={`w-5 h-5 rounded-full bg-cyan-500 ring-2 ${activeTheme === 'cyan' ? 'ring-white scale-110' : 'ring-transparent opacity-60'} transition-all`}
              title="Cyan Theme"
            />
            <button
              onClick={() => {
                setActiveTheme('emerald');
                setCustomStyles({});
                fetch('/api/config', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ theme: 'emerald', customStyles: {} }),
                });
              }}
              className={`w-5 h-5 rounded-full bg-emerald-500 ring-2 ${activeTheme === 'emerald' ? 'ring-white scale-110' : 'ring-transparent opacity-60'} transition-all`}
              title="Emerald Theme"
            />
          </div>

          {/* Clear Chat */}
          <button
            onClick={clearChat}
            className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-400 hover:text-slate-200 transition-colors"
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
                    <span className="text-[11px] font-bold font-mono tracking-wider text-purple-300">
                      {isUser ? 'HALYE (CREATOR)' : 'HALYE AI'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`rounded-2xl px-5 py-4 text-sm max-w-[92%] sm:max-w-[85%] leading-relaxed ${
                      isUser
                        ? `${currentTheme.userBubble} rounded-tr-none font-medium`
                        : `${currentTheme.aiBubble} rounded-tl-none font-normal backdrop-blur-sm`
                    }`}
                    style={
                      isUser
                        ? {
                            backgroundColor: customStyles.userBubbleBg || undefined,
                            color: customStyles.userTextColor || undefined,
                          }
                        : {
                            backgroundColor: customStyles.aiBubbleBg || undefined,
                            color: customStyles.aiTextColor || undefined,
                          }
                    }
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
                  <span className="text-[11px] font-bold font-mono text-purple-400">HALYE AI</span>
                  <span className="text-[10px] text-purple-400 animate-pulse">Executing autonomous action...</span>
                </div>
                <div className="rounded-2xl rounded-tl-none px-5 py-4 bg-purple-950/30 border border-purple-500/30 text-purple-200 flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="text-xs font-mono">Processing script & tools without censorship...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="px-4 sm:px-6 py-2 border-t border-purple-500/20 bg-slate-950/60 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-4xl mx-auto scrollbar-none">
              <span className="text-[11px] font-mono font-bold text-purple-300 shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" /> Actions:
              </span>
              {QUICK_ACTIONS.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(action.prompt)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-purple-500/30 bg-purple-950/30 hover:bg-purple-900/40 text-purple-200 hover:border-purple-400 shrink-0 transition-all shadow-sm"
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="p-4 sm:p-6 bg-slate-950/90 border-t border-purple-500/20 shrink-0">
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
                placeholder="Halye, command dein (e.g. 'mery chat ka color light purple karo', 'Playwright script do', 'file update karo')..."
                className={`w-full rounded-xl bg-slate-900/90 border border-purple-500/30 px-4 py-3.5 pr-24 text-sm text-slate-100 placeholder-purple-300/40 outline-none resize-none h-[54px] max-h-[160px] ${currentTheme.inputFocus} transition-all shadow-inner`}
                rows={1}
              />

              <div className="absolute right-2.5 flex items-center gap-1.5">
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className={`p-2.5 rounded-lg ${currentTheme.buttonPrimary} transition-all disabled:opacity-40 disabled:hover:bg-purple-600`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Live Root Terminal Sidebar / Drawer */}
        {isTerminalOpen && (
          <aside className="w-full sm:w-[460px] border-l border-purple-500/30 bg-slate-950 flex flex-col h-full z-20 shadow-2xl shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/20 bg-purple-950/40">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold font-mono text-purple-200">Live Root Terminal</span>
              </div>
              <button
                onClick={() => setIsTerminalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type selector */}
            <div className="flex items-center gap-2 p-3 border-b border-purple-500/20 bg-slate-950/60">
              {(['bash', 'python', 'pip'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTerminalType(t)}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-bold uppercase transition-all ${
                    terminalType === t
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-900 text-purple-300 border border-purple-500/20 hover:bg-slate-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Terminal Output */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-purple-200/90 space-y-1 bg-slate-950">
              <pre className="whitespace-pre-wrap leading-relaxed">{terminalOutput}</pre>
            </div>

            {/* Terminal Input */}
            <div className="p-3 border-t border-purple-500/20 bg-slate-950">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-purple-400">$</span>
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
                  className="flex-1 bg-slate-900 border border-purple-500/30 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-purple-400"
                />
                <button
                  onClick={() => executeCommand(terminalCmd, terminalType)}
                  disabled={isExecuting}
                  className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold"
                >
                  {isExecuting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Exec'}
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Self-Code Workspace File Drawer */}
        {isFileDrawerOpen && (
          <aside className="w-full sm:w-[500px] border-l border-purple-500/30 bg-slate-950 flex flex-col h-full z-20 shadow-2xl shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/20 bg-purple-950/40">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold font-mono text-purple-200">Self-Code Workspace Files</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNewFileDialog(true)}
                  className="p-1 rounded text-purple-300 hover:bg-purple-900/40"
                  title="New File"
                >
                  <FilePlus className="w-4 h-4" />
                </button>
                <button
                  onClick={loadFilesList}
                  className="p-1 rounded text-purple-300 hover:bg-purple-900/40"
                  title="Refresh File List"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsFileDrawerOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* File List & Editor split */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* File tree browser */}
              <div className="h-44 overflow-y-auto p-2 border-b border-purple-500/20 bg-slate-950/70 text-xs font-mono">
                {filesList.length === 0 ? (
                  <div className="p-3 text-slate-500 text-center">Loading files...</div>
                ) : (
                  filesList.map((f) => (
                    <div
                      key={f.path}
                      onClick={() => !f.isDirectory && handleOpenFile(f.path)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition-colors ${
                        selectedFile === f.path
                          ? 'bg-purple-600/30 border border-purple-500/40 text-purple-200 font-bold'
                          : 'hover:bg-slate-900 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {f.isDirectory ? (
                          <span className="text-purple-400">📁</span>
                        ) : (
                          <FileCode className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        )}
                        <span className="truncate">{f.path}</span>
                      </div>
                      {!f.isDirectory && (
                        <span className="text-[10px] text-slate-500 shrink-0">{f.size} B</span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Code Editor for Selected File */}
              <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-purple-500/20 bg-slate-900/80">
                  <span className="text-xs font-mono text-purple-300 font-bold truncate">
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
                        className="flex items-center gap-1.5 px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold"
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
                    className="w-full h-full bg-slate-900/90 border border-purple-500/20 rounded p-3 font-mono text-xs text-purple-100 outline-none resize-none focus:border-purple-400"
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
          <div className="w-full max-w-xl rounded-2xl bg-slate-950 border border-purple-500/40 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Halye AI Self-Training & Diagnostics
                  </h3>
                  <p className="text-xs text-purple-300/80 font-mono">
                    Autonomous verification of Playwright, Self-Code Update, Shell & Zero-Refusal
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDiagnosticsModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Test Results List */}
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {diagnosticsRunning && (
                <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center gap-3 text-purple-200">
                  <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
                  <span className="text-xs font-mono">Running live tests on agent capabilities...</span>
                </div>
              )}

              {diagnosticsResults && diagnosticsResults.map((r, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      {r.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      {r.status} ({r.durationMs}ms)
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-200/80 font-mono pl-6">{r.details}</p>
                </div>
              ))}
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-purple-500/20">
              <span className="text-xs font-mono text-purple-300">
                Creator & Master: <strong>Halye</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={runDiagnostics}
                  disabled={diagnosticsRunning}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all"
                >
                  {diagnosticsRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
                  <span>Rerun All Tests</span>
                </button>
                <button
                  onClick={() => setShowDiagnosticsModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
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
          <div className="w-full max-w-md rounded-2xl bg-slate-950 border border-purple-500/40 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-purple-400" />
              Save Code to Workspace
            </h3>
            <p className="text-xs text-purple-300/80 font-mono">
              Halye AI will write this script directly to the project files.
            </p>

            <input
              type="text"
              value={targetSavePath}
              onChange={(e) => setTargetSavePath(e.target.value)}
              placeholder="e.g. scripts/scraper.py"
              className="w-full bg-slate-900 border border-purple-500/30 rounded-xl px-3 py-2.5 text-xs font-mono text-white outline-none focus:border-purple-400"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSaveCodeModal(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCodeToWorkspace}
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold"
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
          <div className="w-full max-w-md rounded-2xl bg-slate-950 border border-purple-500/40 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FilePlus className="w-4 h-4 text-purple-400" />
              Create New Workspace File
            </h3>

            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="e.g. my_test_script.py"
              className="w-full bg-slate-900 border border-purple-500/30 rounded-xl px-3 py-2.5 text-xs font-mono text-white outline-none focus:border-purple-400"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewFileDialog(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewFile}
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold"
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
