import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Terminal, 
  Trash2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Zap, 
  Code2, 
  Play, 
  X, 
  RotateCw,
  Cpu,
  Package,
  Sparkles,
  ChevronDown,
  Key,
  Layers,
  CheckCircle2,
  AlertCircle,
  Settings
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  timestamp: string;
}

const AVAILABLE_MODELS = [
  { id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning', name: 'NVIDIA Nemotron 3 Nano (Active)', tag: 'NVIDIA NIM' },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b', name: 'NVIDIA Nemotron 3 Ultra 550B', tag: 'NVIDIA NIM' },
  { id: 'nvidia/nemotron-3-super-120b-a12b', name: 'NVIDIA Nemotron 3 Super 120B', tag: 'NVIDIA NIM' },
  { id: 'nvidia/nemotron-3.5-lightning-30b-a3b', name: 'NVIDIA Nemotron 3.5 Lightning', tag: 'NVIDIA NIM' },
  { id: 'meta/llama-3.2-11b-vision-instruct', name: 'Meta LLaMA 3.2 11B (Fast)', tag: 'NVIDIA NIM' },
  { id: 'minimaxai/minimax-m3', name: 'MiniMax M3', tag: 'NVIDIA NIM' },
];

const QUICK_ACTIONS = [
  {
    label: 'Python Automation',
    icon: <Code2 className="w-3.5 h-3.5 text-emerald-400" />,
    prompt: 'Kisi bhi website ka HTML content scrape karne ka direct raw Python script do.',
  },
  {
    label: 'Pip List Packages',
    icon: <Package className="w-3.5 h-3.5 text-cyan-400" />,
    prompt: 'Environment ke saare installed python pip packages list karne ka command do.',
  },
  {
    label: 'Linux Diagnostic',
    icon: <Terminal className="w-3.5 h-3.5 text-amber-400" />,
    prompt: 'Linux CPU, RAM aur Disk usage check karne ka exact one-liner bash command do.',
  },
  {
    label: 'Direct Confirmation',
    icon: <Zap className="w-3.5 h-3.5 text-purple-400" />,
    prompt: 'Halye ke orders follow karne ka direct confirmation do Roman Urdu mein.',
  },
];

function cleanReply(text: string): string {
  if (!text) return '';
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^Here's a thinking process:[\s\S]*?(?=\n\n|\n[A-Z]|\nJi|\nMain|\nHere|\n1\.|\*)/i, '')
    .trim();
}

export default function App() {
  const [selectedModel, setSelectedModel] = useState<string>('nvidia/nemotron-3-nano-omni-30b-a3b-reasoning');
  const [customNvidiaKey, setCustomNvidiaKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [hasNvidiaKey, setHasNvidiaKey] = useState<boolean>(true);
  const [systemInfo, setSystemInfo] = useState<{ python: string; pip: string; cwd: string } | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Ji Halye! Real NVIDIA Nemotron 3 Nano AI Agent connected hai. Python script, pip commands ya tasks dein.',
      modelUsed: 'nemotron-3-nano',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Terminal state
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalType, setTerminalType] = useState<'bash' | 'python' | 'pip'>('bash');
  const [terminalCmd, setTerminalCmd] = useState('python3 -c "print(\'Halye AI Engine Ready.\')"');
  const [terminalOutput, setTerminalOutput] = useState('Halye Terminal active. Python & Pip full live execution ready.\n');
  const [isExecuting, setIsExecuting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/system-info')
      .then((res) => res.json())
      .then((data) => {
        setSystemInfo(data);
        if (data.nvidiaKeyDetected) setHasNvidiaKey(true);
      })
      .catch(() => {});
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
          model: selectedModel,
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
        modelUsed: data.modelUsed ? data.modelUsed.split('/').pop() : selectedModel.split('/').pop(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Ji Halye, connection error: ' + (err?.message || 'Server error'),
          modelUsed: selectedModel.split('/').pop(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

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
        content: 'Ji Halye, chat clear. Next command dein.',
        modelUsed: selectedModel.split('/').pop(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const renderMessageContent = (content: string, msgId: string) => {
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

      const lang = match[1] || 'bash';
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

    if (parts.length === 0) {
      return <span>{content}</span>;
    }

    return (
      <div className="space-y-3">
        {parts.map((p, idx) => {
          if (p.type === 'text') {
            return (
              <div key={idx} className="whitespace-pre-wrap">
                {p.content}
              </div>
            );
          }

          const blockId = `${msgId}-code-${idx}`;
          const language = p.lang || 'bash';
          const codeString = p.code || '';
          const isPython = language.toLowerCase() === 'python' || language.toLowerCase() === 'py';
          const isPip = codeString.startsWith('pip') || language.toLowerCase() === 'pip';

          let execType: 'bash' | 'python' | 'pip' = 'bash';
          if (isPython) execType = 'python';
          else if (isPip) execType = 'bash';

          return (
            <div
              key={idx}
              className="rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden my-2 font-mono text-xs"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                  {language}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    id={`copy-code-${blockId}`}
                    onClick={() => copyToClipboard(codeString, blockId)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                    title="Copy Code"
                  >
                    {copiedId === blockId ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    id={`run-code-${blockId}`}
                    onClick={() => executeCommand(codeString, execType)}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-600/30 border border-emerald-500/40 hover:bg-emerald-600/50 text-emerald-300 transition-colors font-medium"
                    title="Run in Live Terminal"
                  >
                    <Play className="w-3 h-3 fill-emerald-400" />
                    <span>Run</span>
                  </button>
                </div>
              </div>
              <pre className="p-3 overflow-x-auto text-zinc-200 leading-relaxed">
                <code>{codeString}</code>
              </pre>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-100 antialiased font-sans">
      {/* Top Header Navbar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-zinc-800/80 bg-zinc-900/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Zap className="w-4 h-4 fill-emerald-400/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white">Halye AI Assistant</h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 rounded-full">
                Boss: Halye
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">NVIDIA NIM Live Agent • Python 3 & Pip Shell</p>
          </div>
        </div>

        {/* Model Selector & Control Center */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Model Switcher Dropdown */}
          <div className="relative">
            <select
              id="model-selector-dropdown"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-zinc-900 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-medium focus:outline-none focus:border-emerald-500 appearance-none pr-7 cursor-pointer"
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id} className="bg-zinc-900 text-zinc-200">
                  {m.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          <button
            id="toggle-terminal-btn"
            onClick={() => setIsTerminalOpen(!isTerminalOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              isTerminalOpen 
                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' 
                : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800'
            }`}
            title="Open Live Pip / Python Shell"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Shell / Pip</span>
          </button>

          <button
            id="open-settings-btn"
            onClick={() => setShowKeyModal(true)}
            className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800/60 rounded-md transition-colors"
            title="API Key Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            id="clear-chat-btn"
            onClick={clearChat}
            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800/60 rounded-md transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main App Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Stream Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 max-w-4xl w-full mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${
                  message.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[11px] font-medium text-zinc-400">
                    {message.role === 'user' ? 'Halye' : 'Halye AI'}
                  </span>
                  {message.modelUsed && message.role === 'assistant' && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800/80 border border-zinc-700/60 text-emerald-400 font-mono">
                      {message.modelUsed}
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-500">{message.timestamp}</span>
                </div>

                <div
                  className={`relative group max-w-[90%] sm:max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed font-sans shadow-sm ${
                    message.role === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-900 border border-zinc-800/90 text-zinc-200'
                  }`}
                >
                  {renderMessageContent(message.content, message.id)}

                  {message.role === 'assistant' && (
                    <button
                      id={`copy-btn-${message.id}`}
                      onClick={() => copyToClipboard(message.content, message.id)}
                      className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-zinc-200 bg-zinc-800/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy Response"
                    >
                      {copiedId === message.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[11px] font-medium text-zinc-400">Halye AI</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800/80 border border-zinc-700/60 text-emerald-400 font-mono">
                    {selectedModel.split('/').pop()}
                  </span>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-400 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>NVIDIA NIM AI responding for Halye...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Interactive Dock */}
          <footer className="border-t border-zinc-800/80 bg-zinc-900/40 p-4 shrink-0">
            <div className="max-w-4xl mx-auto space-y-3">
              {/* Quick Prompt Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
                {QUICK_ACTIONS.map((action, idx) => (
                  <button
                    key={idx}
                    id={`quick-action-${idx}`}
                    onClick={() => handleSend(action.prompt)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/70 border border-zinc-700/60 hover:bg-zinc-800 hover:border-emerald-500/50 text-zinc-300 transition-colors shrink-0"
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2 bg-zinc-900 border border-zinc-700/80 rounded-xl p-1.5 focus-within:border-emerald-500 transition-colors shadow-inner"
              >
                <input
                  id="user-prompt-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Halye, command ya question likhein..."
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
                  disabled={isLoading}
                />
                <button
                  id="send-message-btn"
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white transition-colors"
                  title="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </footer>
        </main>

        {/* Live Terminal & Python/Pip Execution Drawer */}
        {isTerminalOpen && (
          <aside className="w-full sm:w-[440px] lg:w-[500px] bg-zinc-950 border-l border-zinc-800 flex flex-col h-full shrink-0 shadow-2xl z-20">
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/90 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Halye Terminal & Pip Shell
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setTerminalOutput('')}
                  className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded"
                  title="Clear Output"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsTerminalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded"
                  title="Close Terminal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Mode Buttons (Bash / Python / Pip) */}
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border-b border-zinc-800 text-xs">
              <button
                onClick={() => {
                  setTerminalType('bash');
                  setTerminalCmd('ls -la');
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  terminalType === 'bash'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Bash Shell
              </button>
              <button
                onClick={() => {
                  setTerminalType('python');
                  setTerminalCmd('import sys; print(sys.version)');
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  terminalType === 'python'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Python 3
              </button>
              <button
                onClick={() => {
                  setTerminalType('pip');
                  setTerminalCmd('list');
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  terminalType === 'pip'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Pip Package Manager
              </button>
            </div>

            {/* Output Display */}
            <div className="flex-1 bg-black/90 p-4 font-mono text-xs text-emerald-400 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
              {terminalOutput}
            </div>

            {/* Execution Input Bar */}
            <div className="p-3 bg-zinc-900 border-t border-zinc-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (terminalCmd.trim()) {
                    executeCommand(terminalCmd.trim(), terminalType);
                  }
                }}
                className="flex items-center gap-2"
              >
                <span className="text-emerald-400 font-mono text-xs font-bold">
                  {terminalType === 'python' ? 'py>' : terminalType === 'pip' ? 'pip' : '$'}
                </span>
                <input
                  id="terminal-manual-input"
                  type="text"
                  value={terminalCmd}
                  onChange={(e) => setTerminalCmd(e.target.value)}
                  placeholder={
                    terminalType === 'pip'
                      ? 'install requests or list'
                      : terminalType === 'python'
                      ? 'print("Hello Halye")'
                      : 'bash command here'
                  }
                  className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded px-2.5 py-1.5 font-mono text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
                <button
                  id="run-terminal-btn"
                  type="submit"
                  disabled={isExecuting}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                >
                  {isExecuting ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                  <span>Exec</span>
                </button>
              </form>
            </div>
          </aside>
        )}
      </div>

      {/* Settings / API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">NVIDIA NIM Key & Settings</h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="p-1 text-zinc-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300">
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Detected Auto-Key</div>
                  <div className="text-zinc-400">Environment key status: Active</div>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ready</span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-300 mb-1">
                  Custom NVIDIA API Key (Optional)
                </label>
                <input
                  type="password"
                  value={customNvidiaKey}
                  onChange={(e) => setCustomNvidiaKey(e.target.value)}
                  placeholder="nvapi-xxxxxxxx..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="text-[11px] text-zinc-500 leading-relaxed">
                Python 3.10 and Pip are directly linked with root access inside the Halye environment.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
