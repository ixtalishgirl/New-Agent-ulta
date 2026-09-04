import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RotateCcw, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Check, 
  Copy, 
  Terminal, 
  Send, 
  Loader2, 
  Code2, 
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Plus,
  Image as ImageIcon,
  FileText,
  X,
  Eye,
  Sparkles,
  Command,
  Maximize2
} from 'lucide-react';
import { AttachedFile, TerminalExecutionResult, VisionAnalysisResult, ChatMessage } from '../types';

const DEFAULT_HALYE_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Halye AMOLED Stealth Workspace</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    code, pre { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-black text-zinc-100 min-h-screen p-6 sm:p-10 flex flex-col justify-center selection:bg-cyan-500 selection:text-black">
  <div class="max-w-4xl mx-auto w-full space-y-6">
    <!-- Stealth Header Card -->
    <div class="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl relative overflow-hidden">
      <div class="absolute -right-20 -top-20 w-60 h-60 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-semibold uppercase mb-4">
        ⚡ Halye Autonomous Agent
      </div>
      
      <h1 class="text-3xl sm:text-4xl font-extrabold mb-3 text-white tracking-tight">
        Pure AMOLED Live Application
      </h1>
      
      <p class="text-zinc-400 mb-6 leading-relaxed max-w-2xl text-sm sm:text-base">
        Original Linux Terminal (Bash, Python 3.11, Pip 23.0) and God-Level Screenshot Vision Perception active. Real commands execute in real-time.
      </p>

      <!-- System Status Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="p-4 rounded-2xl bg-black border border-zinc-800/80">
          <div class="text-[11px] text-zinc-500 font-mono mb-1">TERMINAL RUNTIME</div>
          <div class="text-sm font-bold text-white flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Bash, Pip & Python
          </div>
        </div>
        <div class="p-4 rounded-2xl bg-black border border-zinc-800/80">
          <div class="text-[11px] text-zinc-500 font-mono mb-1">VISION LAB</div>
          <div class="text-sm font-bold text-cyan-400">God-Level Perception</div>
        </div>
        <div class="p-4 rounded-2xl bg-black border border-zinc-800/80">
          <div class="text-[11px] text-zinc-500 font-mono mb-1">THEME ARCHETYPE</div>
          <div class="text-sm font-bold text-white font-mono">#000000 Pitch Black</div>
        </div>
      </div>

      <!-- Interactive Playground Card -->
      <div class="p-6 rounded-2xl bg-black border border-zinc-800 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-zinc-200">Live Client-Side Event Engine</h3>
          <span id="counter-badge" class="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-mono">Clicks: 0</span>
        </div>
        <div class="flex items-center gap-3">
          <button onclick="incrementClicks()" class="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition active:scale-95 cursor-pointer shadow-lg shadow-cyan-500/20">
            + Click Counter
          </button>
          <button onclick="resetClicks()" class="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white font-medium text-xs transition cursor-pointer">
            Reset
          </button>
          <span id="click-feedback" class="text-xs text-emerald-400 font-mono hidden">✔ State Updated!</span>
        </div>
      </div>
    </div>
  </div>

  <script>
    let clicks = 0;
    function incrementClicks() {
      clicks++;
      document.getElementById('counter-badge').innerText = 'Clicks: ' + clicks;
      const fb = document.getElementById('click-feedback');
      fb.classList.remove('hidden');
      setTimeout(() => fb.classList.add('hidden'), 2000);
    }
    function resetClicks() {
      clicks = 0;
      document.getElementById('counter-badge').innerText = 'Clicks: 0';
    }
  </script>
</body>
</html>`;

interface HalyeStudioProps {
  initialCode?: string;
  connectedRepoName?: string;
  attachedAssetsCount?: number;
  onOpenGithub: () => void;
  onOpenAssets: () => void;
}

export const HalyeStudio: React.FC<HalyeStudioProps> = ({
  initialCode,
  connectedRepoName,
  attachedAssetsCount = 1,
  onOpenGithub,
  onOpenAssets,
}) => {
  // Main Builder & Sandbox State
  const [code, setCode] = useState<string>(initialCode || DEFAULT_HALYE_CODE);
  const [previewKey, setPreviewKey] = useState<number>(1);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activePane, setActivePane] = useState<'preview' | 'terminal' | 'vision' | 'code' | 'split'>('preview');
  const [copied, setCopied] = useState(false);

  // Copilot Chat & Input State
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<AttachedFile[]>([]);
  const [activeVisionFile, setActiveVisionFile] = useState<AttachedFile | null>(null);
  const [modelInfo, setModelInfo] = useState<{
    status: string;
    provider: string;
    activeModel: string;
    hasVision: boolean;
    hasTerminal: boolean;
  } | null>(null);

  // Fetch active AI model status on mount
  useEffect(() => {
    fetch('/api/model/status')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setModelInfo({
            status: d.status,
            provider: d.provider,
            activeModel: d.activeModel,
            hasVision: d.hasVision,
            hasTerminal: d.hasTerminal,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Interactive Shell Terminal State (Right Pane)
  const [terminalInput, setTerminalInput] = useState('');
  const [isExecutingTerminal, setIsExecutingTerminal] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<Array<{ cmd: string; out: string; err: string; exit: number; ms: number }>>([
    { cmd: 'python3 --version && pip3 --version', out: 'Python 3.11.2\npip 23.0.1 from /usr/lib/python3/dist-packages/pip (python 3.11)', err: '', exit: 0, ms: 14 },
    { cmd: 'uname -a', out: 'Linux halye-container 6.6.137+ #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux', err: '', exit: 0, ms: 8 }
  ]);

  // Initial Welcome Chat Message (Clean state)
  const [conversation, setConversation] = useState<ChatMessage[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Sync external code update
  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      setPreviewKey((k) => k + 1);
    }
  }, [initialCode]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isGenerating]);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (activePane === 'terminal') {
      terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalHistory, activePane]);

  // Handle file selection from the '+' button
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const reader = new FileReader();

      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newAttachedFile: AttachedFile = {
          id: 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          name: file.name,
          size: file.size,
          type: isImage ? 'screenshot' : 'code',
          dataUrl,
          uploadedAt: new Date().toISOString(),
        };

        setStagedFiles((prev) => [...prev, newAttachedFile]);
        setActiveVisionFile(newAttachedFile);
      };

      if (isImage) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });

    // Reset input so re-selecting same file works
    e.target.value = '';
  };

  // Clipboard Paste Support for Screenshots (Ctrl+V)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const newFile: AttachedFile = {
              id: 'pasted-' + Date.now(),
              name: `screenshot-${new Date().toLocaleTimeString().replace(/:/g, '-')}.png`,
              size: file.size,
              type: 'screenshot',
              dataUrl: event.target?.result as string,
              uploadedAt: new Date().toISOString(),
            };
            setStagedFiles((prev) => [...prev, newFile]);
            setActiveVisionFile(newFile);
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  };

  const removeStagedFile = (id: string) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== id));
    if (activeVisionFile?.id === id) {
      setActiveVisionFile(null);
    }
  };

  // Send Prompt to Halye Agent
  const handleSendPrompt = async (forcedPrompt?: string) => {
    const textToSend = forcedPrompt !== undefined ? forcedPrompt : prompt;
    if ((!textToSend.trim() && stagedFiles.length === 0) || isGenerating) return;

    const userMessageText = textToSend.trim();
    const filesForThisMessage = [...stagedFiles];

    // Clear input & staged files
    setPrompt('');
    setStagedFiles([]);

    const userMessage: ChatMessage = {
      id: 'usr-' + Date.now(),
      role: 'user',
      text: userMessageText || (filesForThisMessage.length > 0 ? `[Attached ${filesForThisMessage.length} file(s)]` : ''),
      attachedFiles: filesForThisMessage,
      timestamp: new Date().toLocaleTimeString(),
    };

    setConversation((prev) => [...prev, userMessage]);
    setIsGenerating(true);

    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessageText,
          currentCode: code,
          attachedFiles: filesForThisMessage,
        }),
      });

      const data = await res.json();

      // If terminal execution returned in response
      let termResult: TerminalExecutionResult | undefined = undefined;
      if (data.terminalResult) {
        termResult = data.terminalResult;
        setTerminalHistory((prev) => [
          ...prev,
          {
            cmd: data.terminalResult.command,
            out: data.terminalResult.stdout,
            err: data.terminalResult.stderr,
            exit: data.terminalResult.exitCode,
            ms: data.terminalResult.durationMs,
          },
        ]);
      }

      // If code returned (app update or vision reconstruction)
      if (data.code && data.code.includes('<')) {
        setCode(data.code);
        setPreviewKey((k) => k + 1);
        setActivePane('preview');
      }

      const assistantMessage: ChatMessage = {
        id: 'ast-' + Date.now(),
        role: 'assistant',
        text: data.text || 'Command processed.',
        terminalResult: termResult,
        visionAnalysis: data.visionAnalysis,
        timestamp: new Date().toLocaleTimeString(),
        model: data.model || modelInfo?.activeModel,
        provider: data.provider || modelInfo?.provider,
        actionTaken: data.terminalResult
          ? `Terminal Command: ${data.terminalResult.command}`
          : data.visionAnalysis
          ? 'Reconstructed App from Screenshot'
          : data.code
          ? 'Rendered Live AMOLED Application'
          : 'Processed via Active AI Model',
      };

      setConversation((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Halye prompt error:', err);
      setConversation((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          text: `Error executing request: ${err.message}. Terminal fallback remains operational.`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Run interactive terminal command from Right Pane
  const handleRunTerminalCommand = async (cmdToRun?: string) => {
    const cmd = cmdToRun || terminalInput.trim();
    if (!cmd || isExecutingTerminal) return;

    setTerminalInput('');
    setIsExecutingTerminal(true);

    try {
      const res = await fetch('/api/terminal/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });

      const data = await res.json();
      setTerminalHistory((prev) => [
        ...prev,
        {
          cmd,
          out: data.stdout || '',
          err: data.stderr || '',
          exit: data.exitCode !== undefined ? data.exitCode : (data.success ? 0 : 1),
          ms: data.durationMs || 10,
        },
      ]);
    } catch (err: any) {
      setTerminalHistory((prev) => [
        ...prev,
        {
          cmd,
          out: '',
          err: err.message || 'Execution failed',
          exit: 1,
          ms: 0,
        },
      ]);
    } finally {
      setIsExecutingTerminal(false);
    }
  };

  // Run manual preview refresh
  const handleRunCode = () => {
    setPreviewKey((k) => k + 1);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div id="halye-studio-root" className="w-full h-full flex flex-col lg:flex-row overflow-hidden bg-black text-zinc-100">
      {/* Hidden file input triggered by the '+' button */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,.txt,.py,.sh,.json,.js,.ts,.html,.css"
        multiple
        className="hidden"
      />

      {/* ============================================================ */}
      {/* LEFT COLUMN: Autonomous Halye Assistant + Plus Icon Input    */}
      {/* ============================================================ */}
      <div className="w-full lg:w-[480px] xl:w-[520px] h-full flex flex-col border-r border-zinc-900 bg-zinc-950/90 shrink-0 overflow-hidden">
        
        {/* Agent Subheader Bar */}
        <div className="p-3 px-4 border-b border-zinc-900 bg-black flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400 text-xs font-bold font-mono">
              &gt;_
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide">Halye Assistant</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Bash • Python 3 • Pip • AMOLED Live</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${modelInfo?.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-zinc-200 font-semibold">Halye Assistant</span>
            </div>
            <button
              onClick={() => setActivePane('terminal')}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-[11px] font-mono flex items-center gap-1.5 border border-zinc-800 transition cursor-pointer"
              title="Open Terminal View"
            >
              <Terminal className="w-3 h-3 text-emerald-400" />
              <span>Terminal</span>
            </button>
          </div>
        </div>

        {/* Conversation Stream */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs scroll-smooth flex flex-col"
          onPaste={handlePaste}
        >
          {conversation.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none my-auto">
              <div className="w-12 h-12 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center text-cyan-400 mb-3 shadow-inner">
                <Terminal className="w-6 h-6 text-cyan-400" />
              </div>
              <h2 className="text-sm font-bold text-white tracking-wide">Halye Assistant</h2>
              <p className="text-[11px] text-zinc-500 max-w-xs mt-1 leading-relaxed">
                Direct Roman Urdu Developer Environment. Koi bhi command, script ya instruction likhein — foran direct execution hogi.
              </p>
            </div>
          )}

          {conversation.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[92%] rounded-2xl p-3.5 shadow-lg leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-zinc-900 border border-zinc-800 text-white rounded-tr-none'
                    : 'bg-black border border-zinc-850 text-zinc-200 rounded-tl-none'
                }`}
              >
                {/* Attached files preview inside user message */}
                {msg.attachedFiles && msg.attachedFiles.length > 0 && (
                  <div className="mb-2.5 flex flex-wrap gap-2">
                    {msg.attachedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 p-1.5 flex items-center gap-2 max-w-full"
                      >
                        {file.type === 'screenshot' && file.dataUrl ? (
                          <img
                            src={file.dataUrl}
                            alt={file.name}
                            className="w-16 h-12 object-cover rounded-lg border border-zinc-800"
                          />
                        ) : (
                          <FileText className="w-5 h-5 text-cyan-400 ml-1" />
                        )}
                        <div className="truncate max-w-[140px]">
                          <div className="text-[11px] font-medium text-white truncate">{file.name}</div>
                          <div className="text-[9px] text-zinc-500 font-mono">{(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Body */}
                <p className="whitespace-pre-wrap leading-relaxed text-zinc-300 font-sans">{msg.text}</p>

                {/* Action Taken & Model Tag */}
                {(msg.actionTaken || msg.model) && (
                  <div className="mt-2.5 pt-2 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-mono">
                    {msg.actionTaken && (
                      <div className="flex items-center gap-1.5 text-cyan-400">
                        <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{msg.actionTaken}</span>
                      </div>
                    )}
                    {msg.model && (
                      <span className="text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-[9px]">
                        ⚡ Halye Assistant
                      </span>
                    )}
                  </div>
                )}

                {/* Terminal Execution Result Card (If command ran) */}
                {msg.terminalResult && (
                  <div className="mt-3 rounded-xl bg-zinc-950 border border-zinc-850 p-3 font-mono text-[11px] space-y-2">
                    <div className="flex items-center justify-between text-zinc-400 pb-1.5 border-b border-zinc-900 text-[10px]">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Terminal className="w-3 h-3" />
                        $ {msg.terminalResult.command}
                      </span>
                      <span className="text-zinc-500">
                        {msg.terminalResult.exitCode === 0 ? (
                          <span className="text-emerald-400">Exit: 0 ({msg.terminalResult.durationMs}ms)</span>
                        ) : (
                          <span className="text-rose-400">Exit: {msg.terminalResult.exitCode}</span>
                        )}
                      </span>
                    </div>

                    {msg.terminalResult.stdout && (
                      <pre className="text-zinc-300 bg-black/80 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-48 text-[10px]">
                        {msg.terminalResult.stdout}
                      </pre>
                    )}

                    {msg.terminalResult.stderr && (
                      <pre className="text-rose-400 bg-rose-950/20 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap text-[10px]">
                        {msg.terminalResult.stderr}
                      </pre>
                    )}
                  </div>
                )}

                {/* God-Level Vision Perception Card */}
                {msg.visionAnalysis && (
                  <div className="mt-3 rounded-xl bg-zinc-950 border border-zinc-800 p-3 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-white">
                      <span className="flex items-center gap-1 text-cyan-400">
                        <Eye className="w-3.5 h-3.5" />
                        God-Level Vision Perception
                      </span>
                      <button
                        onClick={() => {
                          setActivePane('preview');
                          handleRunCode();
                        }}
                        className="px-2 py-0.5 rounded bg-cyan-500 text-black font-bold text-[10px] hover:bg-cyan-400 transition cursor-pointer"
                      >
                        ⚡ Rebuild in Live Preview
                      </button>
                    </div>

                    {/* Dominant Palette */}
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Dominant Palette:</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {msg.visionAnalysis.dominantColors.map((color, cIdx) => (
                          <div
                            key={cIdx}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black border border-zinc-800 text-[9px] font-mono text-zinc-300"
                          >
                            <span className="w-2.5 h-2.5 rounded-full border border-zinc-700" style={{ backgroundColor: color }} />
                            <span>{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Detected Elements */}
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Components & Typography:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {msg.visionAnalysis.components.map((comp, cpIdx) => (
                          <span
                            key={cpIdx}
                            className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 font-mono"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isGenerating && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-black border border-zinc-850 text-cyan-400 text-xs font-mono">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Halye Assistant executing task...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Staged Files Preview Strip (When '+' icon uploaded files) */}
        {stagedFiles.length > 0 && (
          <div className="px-3 py-2 bg-zinc-900/60 border-t border-zinc-850 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider shrink-0">Attached:</span>
            {stagedFiles.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black border border-zinc-800 text-[11px] text-zinc-200 shrink-0"
              >
                {f.type === 'screenshot' && f.dataUrl ? (
                  <img src={f.dataUrl} alt="thumbnail" className="w-4 h-4 object-cover rounded" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span className="max-w-[120px] truncate">{f.name}</span>
                <button
                  onClick={() => removeStagedFile(f.id)}
                  className="p-0.5 hover:text-rose-400 transition cursor-pointer ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Unified Input Bar with PLUS (+) Icon */}
        <div className="p-3 border-t border-zinc-900 bg-black flex items-end gap-2">
          {/* THE REQUESTED PLUS (+) BUTTON FOR SCREENSHOTS & FILES */}
          <button
            id="halye-plus-attach-btn"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach screenshot or file (+)"
            className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-cyan-400 hover:text-cyan-300 border border-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0 active:scale-95 shadow-sm"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Text Input Area */}
          <textarea
            id="halye-prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendPrompt();
              }
            }}
            onPaste={handlePaste}
            placeholder="Halye Assistant ko hukum karein... (Press + to attach image)"
            rows={2}
            className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-cyan-500 resize-none font-sans leading-relaxed transition"
          />

          {/* Send Button */}
          <button
            id="halye-send-prompt-btn"
            onClick={() => handleSendPrompt()}
            disabled={isGenerating || (!prompt.trim() && stagedFiles.length === 0)}
            className="w-10 h-10 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed text-black font-extrabold flex items-center justify-center transition cursor-pointer shrink-0 active:scale-95 shadow-lg shadow-cyan-500/20"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        {/* Footer Status Strip */}
        <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Halye Assistant Active Engine</span>
          </div>
          <span className="text-cyan-400">Python 3 • Bash • Pip</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* RIGHT COLUMN: Multi-Mode Live Sandbox & Visualizer           */}
      {/* ============================================================ */}
      <div className="flex-1 h-full flex flex-col overflow-hidden bg-black">
        
        {/* Workspace Mode Tabs & Controls Header */}
        <div className="h-12 border-b border-zinc-900 bg-zinc-950/80 px-4 flex items-center justify-between shrink-0">
          
          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-black border border-zinc-850 p-0.5 rounded-xl">
            <button
              id="tab-preview-btn"
              onClick={() => setActivePane('preview')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activePane === 'preview' ? 'bg-zinc-900 text-cyan-400 border border-zinc-800' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Web App</span>
            </button>

            <button
              id="tab-terminal-btn"
              onClick={() => setActivePane('terminal')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activePane === 'terminal' ? 'bg-zinc-900 text-cyan-400 border border-zinc-800' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Interactive Terminal</span>
            </button>

            <button
              id="tab-vision-btn"
              onClick={() => setActivePane('vision')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activePane === 'vision' ? 'bg-zinc-900 text-cyan-400 border border-zinc-800' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Vision Lab</span>
            </button>

            <button
              id="tab-code-btn"
              onClick={() => setActivePane('code')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activePane === 'code' ? 'bg-zinc-900 text-cyan-400 border border-zinc-800' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>HTML Source</span>
            </button>
          </div>

          {/* Viewport Resizer (for Live App tab) */}
          {activePane === 'preview' && (
            <div className="hidden sm:flex items-center gap-1 bg-black border border-zinc-850 p-0.5 rounded-xl">
              <button
                onClick={() => setViewport('desktop')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewport === 'desktop' ? 'bg-zinc-900 text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Desktop View"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewport('tablet')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewport === 'tablet' ? 'bg-zinc-900 text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Tablet View (768px)"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewport('mobile')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewport === 'mobile' ? 'bg-zinc-900 text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Mobile View (390px)"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 transition cursor-pointer"
              title="Copy code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleRunCode}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-cyan-500/20 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Reload Preview</span>
            </button>
          </div>
        </div>

        {/* Workspace Canvas Body */}
        <div className="flex-1 overflow-hidden relative">

          {/* 1. LIVE WEB APPLICATION PREVIEW */}
          {activePane === 'preview' && (
            <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-5 bg-black overflow-hidden">
              <div
                className={`h-full w-full rounded-2xl overflow-hidden bg-black border border-zinc-850 shadow-2xl transition-all duration-300 flex flex-col ${
                  viewport === 'tablet'
                    ? 'max-w-[768px] border-zinc-800'
                    : viewport === 'mobile'
                    ? 'max-w-[390px] border-zinc-800'
                    : 'w-full'
                }`}
              >
                <iframe
                  ref={iframeRef}
                  key={previewKey}
                  id="live-app-preview-iframe"
                  srcDoc={code}
                  title="Halye Live Web App"
                  sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                  className="w-full h-full border-0 bg-black"
                />
              </div>
            </div>
          )}

          {/* 2. REAL INTERACTIVE LINUX / BASH / PIP / PYTHON TERMINAL */}
          {activePane === 'terminal' && (
            <div className="w-full h-full flex flex-col bg-black font-mono text-xs">
              <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between text-zinc-400 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                  <span className="ml-2 text-zinc-300 font-bold">halye@container:~ (bash / python3 / pip)</span>
                </div>
                <button
                  onClick={() => setTerminalHistory([])}
                  className="text-zinc-500 hover:text-zinc-300 transition text-[10px]"
                >
                  Clear Console
                </button>
              </div>

              {/* Terminal Logs View */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                <div className="text-zinc-500 leading-relaxed text-[11px]">
                  Halye Assistant Shell Engine active. Commands are executed directly in container root.
                </div>

                {terminalHistory.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <span className="text-emerald-400 font-bold">halye@sandbox:~$</span>
                      <span>{item.cmd}</span>
                      <span className="text-zinc-600 text-[10px]">({item.ms}ms)</span>
                    </div>
                    {item.out && (
                      <pre className="text-zinc-200 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-900 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {item.out}
                      </pre>
                    )}
                    {item.err && (
                      <pre className="text-rose-400 bg-rose-950/20 p-2.5 rounded-xl border border-rose-900/30 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {item.err}
                      </pre>
                    )}
                  </div>
                ))}

                {isExecutingTerminal && (
                  <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
                    <span>halye@sandbox:~$</span>
                    <span>Executing command...</span>
                  </div>
                )}
                <div ref={terminalBottomRef} />
              </div>

              {/* Interactive Command Input Box */}
              <div className="p-3 border-t border-zinc-900 bg-zinc-950 flex items-center gap-2">
                <span className="text-emerald-400 font-bold text-sm shrink-0 pl-1">$</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRunTerminalCommand();
                  }}
                  placeholder="Type any shell command (e.g. pip list, python3 -c 'print(5*5)', ls -la)..."
                  className="flex-1 bg-black border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-cyan-500 font-mono transition"
                />
                <button
                  onClick={() => handleRunTerminalCommand()}
                  disabled={isExecutingTerminal || !terminalInput.trim()}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-extrabold text-xs transition cursor-pointer shrink-0"
                >
                  Run
                </button>
              </div>
            </div>
          )}

          {/* 3. GOD-LEVEL VISION LAB & INSPECTOR */}
          {activePane === 'vision' && (
            <div className="w-full h-full flex flex-col p-6 bg-black overflow-y-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Eye className="w-5 h-5 text-cyan-400" />
                    God-Level Vision & Screenshot Visualizer
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Upload or paste any screenshot to visually inspect layout grid, extract color palettes, and reconstruct production code.
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Attach Image</span>
                </button>
              </div>

              {activeVisionFile && activeVisionFile.dataUrl ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Image Display */}
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-850 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                      <span>Source: {activeVisionFile.name}</span>
                      <span>{(activeVisionFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-black flex items-center justify-center max-h-[480px]">
                      <img
                        src={activeVisionFile.dataUrl}
                        alt="Vision Target"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Vision Deconstruction Metrics */}
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-850 space-y-3">
                      <h3 className="text-sm font-bold text-white">Extracted Visual DNA</h3>
                      
                      {/* Color Swatches */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-zinc-500 font-mono uppercase">Dominant Hex Swatches</span>
                        <div className="grid grid-cols-3 gap-2">
                          {['#000000', '#09090b', '#00f0ff', '#10b981', '#f4f4f5', '#18181b'].map((hex, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-black border border-zinc-850">
                              <span className="w-4 h-4 rounded-md border border-zinc-700" style={{ backgroundColor: hex }} />
                              <span className="text-[11px] font-mono text-zinc-300">{hex}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Deconstructed Structure */}
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] text-zinc-500 font-mono uppercase">Detected Architectural Layers</span>
                        <div className="space-y-1.5">
                          <div className="p-2.5 rounded-xl bg-black border border-zinc-850 text-xs flex items-center justify-between">
                            <span className="text-zinc-200">1. Stealth Header Nav</span>
                            <span className="text-[10px] font-mono text-cyan-400">Fixed Top</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-black border border-zinc-850 text-xs flex items-center justify-between">
                            <span className="text-zinc-200">2. Responsive Bento Grid</span>
                            <span className="text-[10px] font-mono text-emerald-400">Flex / Grid</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-black border border-zinc-850 text-xs flex items-center justify-between">
                            <span className="text-zinc-200">3. High-Contrast Actions</span>
                            <span className="text-[10px] font-mono text-cyan-400">44px+ Touch</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          handleSendPrompt(`Reconstruct this attached image screenshot exactly in AMOLED black theme`);
                        }}
                        className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition cursor-pointer mt-2"
                      >
                        ⚡ Reconstruct Screenshot Code into Live App
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 rounded-3xl bg-zinc-950 border border-zinc-900 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-black border border-zinc-800 text-cyan-400 flex items-center justify-center mx-auto text-xl">
                    <Plus className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-white">Koi screenshot ya image attach nahi hai</h3>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto">
                    Chat input bar mein **`+`** icon daba kar ya yahan click karke koi bhi UI mockup ya screenshot attach karein. Halye us ka pura color aur layout decode kar dega!
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition cursor-pointer"
                  >
                    Select Screenshot
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 4. RAW HTML SOURCE CODE EDITOR */}
          {activePane === 'code' && (
            <div className="w-full h-full flex flex-col bg-black">
              <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between text-xs font-mono text-zinc-400">
                <span>live-application.html</span>
                <span>{code.split('\n').length} lines</span>
              </div>
              <textarea
                id="live-app-code-editor"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 p-4 bg-black text-zinc-200 font-mono text-xs leading-relaxed outline-none resize-none selection:bg-cyan-500/30 overflow-auto"
                spellCheck={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
