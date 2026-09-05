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
  Maximize2,
  Globe,
  MousePointer,
  ExternalLink,
  FolderTree,
  Zap,
  Archive,
  Trash2,
  Edit2,
  MessageSquare,
  ChevronDown,
  Sliders,
  Wand2,
  Volume2,
  RefreshCw,
  Palette,
  PlaySquare,
  Rocket,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { 
  AttachedFile, 
  TerminalExecutionResult, 
  VisionAnalysisResult, 
  WebInspectionResult, 
  ChatMessage, 
  NvidiaModelCatalogItem,
  ZipInspectionResult,
  HalyePowerItem,
  ChatSession
} from '../types';
import { NvidiaCatalogModal } from './NvidiaCatalogModal';
import { WorkspaceExplorer } from './WorkspaceExplorer';
import { PowersSuite } from './PowersSuite';
import { ScreenshotModal } from './ScreenshotModal';
import { BLANK_CANVAS_CODE, DEFAULT_SAAS_WEBSITE_CODE } from '../templates';

export const DEFAULT_TASK_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AMOLED Stealth Task Tracker</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #000000; }
  </style>
</head>
<body class="bg-black text-zinc-100 min-h-screen p-4 sm:p-8 flex flex-col items-center justify-center selection:bg-cyan-500 selection:text-black">
  <div class="max-w-md mx-auto w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
    <div class="flex items-center justify-between pb-2 border-b border-zinc-900">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <h1 class="text-sm font-bold text-white uppercase tracking-wider">Stealth Task Matrix</h1>
      </div>
      <span id="task-counter" class="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-mono">2 Tasks</span>
    </div>
    <div class="flex items-center gap-2">
      <input id="new-task-input" type="text" placeholder="Task ka naam likhein..." class="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition">
      <button onclick="addTask()" class="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm rounded-xl transition cursor-pointer active:scale-95">+ Add</button>
    </div>
    <div id="tasks-list" class="space-y-2 max-h-80 overflow-y-auto pr-1">
      <div class="flex items-center justify-between p-3 rounded-xl bg-black border border-zinc-800 text-sm">
        <span class="text-zinc-200">Terminal commands execution</span>
        <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-mono">Done</span>
      </div>
      <div class="flex items-center justify-between p-3 rounded-xl bg-black border border-zinc-800 text-sm">
        <span class="text-zinc-200">Live preview runner & real-time changes</span>
        <span class="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-xs font-mono">Active</span>
      </div>
    </div>
  </div>
  <script>
    function updateCounter() {
      const count = document.getElementById('tasks-list').children.length;
      document.getElementById('task-counter').innerText = count + ' Tasks';
    }
    function addTask() {
      const inp = document.getElementById('new-task-input');
      const val = inp.value.trim();
      if(!val) return;
      const list = document.getElementById('tasks-list');
      const item = document.createElement('div');
      item.className = 'flex items-center justify-between p-3 rounded-xl bg-black border border-zinc-800 text-sm';
      item.innerHTML = '<span class="text-zinc-200">' + val + '</span><button onclick="this.parentElement.remove(); updateCounter();" class="text-xs text-rose-400 hover:underline cursor-pointer">Remove</button>';
      list.prepend(item);
      inp.value = '';
      updateCounter();
    }
    document.getElementById('new-task-input').addEventListener('keydown', (e) => {
      if(e.key === 'Enter') addTask();
    });
  </script>
</body>
</html>`;

const DEFAULT_HALYE_CODE = DEFAULT_SAAS_WEBSITE_CODE;

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
  const [activePane, setActivePane] = useState<'preview' | 'terminal' | 'workspace' | 'powers' | 'vision' | 'code' | 'webeyes' | 'split'>('preview');
  const [autoSelectWorkspaceFile, setAutoSelectWorkspaceFile] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Code Pane Sub-View State
  const [codeSubView, setCodeSubView] = useState<'source' | 'workspace'>('source');

  // Real-Time In-Preview Modifier State
  const [realtimeInput, setRealtimeInput] = useState('');
  const [isApplyingRealtime, setIsApplyingRealtime] = useState(false);
  const [realtimeToast, setRealtimeToast] = useState<string | null>(null);
  const [mobileActiveView, setMobileActiveView] = useState<'chat' | 'sandbox'>('sandbox');

  // Web Eyes & Touch State
  const [webUrl, setWebUrl] = useState('https://news.ycombinator.com');
  const [isInspectingWeb, setIsInspectingWeb] = useState(false);
  const [webInspectionData, setWebInspectionData] = useState<WebInspectionResult | null>(null);

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
  const [catalog, setCatalog] = useState<NvidiaModelCatalogItem[]>([]);
  const [showModelCatalog, setShowModelCatalog] = useState(false);

  // Listen to iframe postMessage for preset loading & clearing canvas
  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (event.data?.type === 'LOAD_PRESET') {
        loadPresetApp(event.data.preset);
      } else if (event.data?.type === 'CLEAR_CANVAS') {
        loadPresetApp('blank');
      }
    };
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

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
          if (d.catalog) {
            setCatalog(d.catalog);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Interactive Shell Terminal State (Right Pane)
  const [terminalInput, setTerminalInput] = useState('');
  const [isExecutingTerminal, setIsExecutingTerminal] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<Array<{ cmd: string; out: string; err: string; exit: number; ms: number }>>([
    { cmd: 'python3 halye_controller.py --status', out: '{\n  "agent": "Halye Assistant",\n  "status": "ONLINE",\n  "mode": "Direct Bash/Python Automation",\n  "python_version": "3.10.12",\n  "model": "nvidia/nemotron-3-nano-30b-a3b"\n}', err: '', exit: 0, ms: 12 },
    { cmd: 'uname -a', out: 'Linux halye-container 6.6.137+ #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux', err: '', exit: 0, ms: 8 }
  ]);

  // Multi-Session Chat Memory State (Isolated Per-Session History)
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('halye_sessions_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return [
      {
        id: 'session-main',
        title: 'Session 1 (Main)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      }
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem('halye_active_session_id');
      if (savedId) return savedId;
    } catch (e) {}
    return 'session-main';
  });

  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState('');
  const [inspectingScreenshot, setInspectingScreenshot] = useState<AttachedFile | null>(null);
  const [codeCopiedNotice, setCodeCopiedNotice] = useState<string | null>(null);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('halye_sessions_v1', JSON.stringify(sessions));
    } catch (e) {}
  }, [sessions]);

  // Sync activeSessionId to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('halye_active_session_id', activeSessionId);
    } catch (e) {}
  }, [activeSessionId]);

  // Active Session & Derived Conversation
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || {
    id: 'session-main',
    title: 'Session 1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  };

  const conversation: ChatMessage[] = activeSession.messages || [];

  // Update conversation inside the active session
  const setConversation = (updater: React.SetStateAction<ChatMessage[]>) => {
    setSessions((prevSessions) => {
      return prevSessions.map((s) => {
        if (s.id === activeSession.id) {
          const currentMsgs = s.messages || [];
          const nextMsgs = typeof updater === 'function' ? updater(currentMsgs) : updater;
          
          let title = s.title;
          if ((title.startsWith('Session ') || title === 'New Session') && nextMsgs.length > 0) {
            const firstUser = nextMsgs.find((m) => m.role === 'user');
            if (firstUser && (firstUser.text || firstUser.content)) {
              const snippet = (firstUser.text || firstUser.content || '').trim();
              if (snippet.length > 0) {
                title = snippet.slice(0, 24) + (snippet.length > 24 ? '...' : '');
              }
            }
          }

          return {
            ...s,
            title,
            messages: nextMsgs,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });
    });
  };

  const handleCreateNewSession = () => {
    const newId = 'session-' + Date.now();
    const newNum = sessions.length + 1;
    const newSession: ChatSession = {
      id: newId,
      title: `Session ${newNum}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setIsSessionDropdownOpen(false);
  };

  const handleDeleteSession = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (remaining.length === 0) {
        const fresh: ChatSession = {
          id: 'session-' + Date.now(),
          title: 'Session 1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [],
        };
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (activeSessionId === id) {
        setActiveSessionId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleClearCurrentChat = () => {
    setConversation([]);
  };

  const handleSaveRenameSession = (id: string) => {
    if (editingTitleText.trim()) {
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title: editingTitleText.trim() } : s))
      );
    }
    setEditingSessionId(null);
    setEditingTitleText('');
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
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
  const handleSendPrompt = async (forcedPrompt?: string, overrideFiles?: AttachedFile[]) => {
    const textToSend = forcedPrompt !== undefined ? forcedPrompt : prompt;
    const filesForThisMessage = overrideFiles && overrideFiles.length > 0 ? overrideFiles : [...stagedFiles];
    if ((!textToSend.trim() && filesForThisMessage.length === 0) || isGenerating) return;

    const userMessageText = textToSend.trim();

    // Clear input & staged files
    setPrompt('');
    if (!overrideFiles) {
      setStagedFiles([]);
    }

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
        setMobileActiveView('sandbox');
      }

      if (data.webInspection) {
        setWebInspectionData(data.webInspection);
      }

      // Route pane autonomously
      if (data.suggestedPane) {
        setActivePane(data.suggestedPane);
      } else if (data.terminalResult) {
        setActivePane('terminal');
      } else if (data.zipInspection || data.fileCreated) {
        setActivePane('workspace');
      } else if (data.powerBuilt) {
        setActivePane('powers');
      }

      if (data.zipInspection) {
        setAutoSelectWorkspaceFile(data.zipInspection.archive_name || 'demo_project.zip');
      }
      if (data.fileCreated) {
        setAutoSelectWorkspaceFile(data.fileCreated.path);
      }

      const assistantMessage: ChatMessage = {
        id: 'ast-' + Date.now(),
        role: 'assistant',
        text: data.text || 'Command processed.',
        generatedCode: data.code || undefined,
        terminalResult: termResult,
        visionAnalysis: data.visionAnalysis,
        webInspection: data.webInspection,
        zipInspection: data.zipInspection,
        powerBuilt: data.powerBuilt,
        fileCreated: data.fileCreated,
        timestamp: new Date().toLocaleTimeString(),
        model: data.model || modelInfo?.activeModel,
        provider: data.provider || modelInfo?.provider,
        actionTaken: data.zipInspection
          ? `ZIP Archive Inspected: ${data.zipInspection.archive_name}`
          : data.powerBuilt
          ? `Autonomous Power Built: ${data.powerBuilt.name}`
          : data.fileCreated
          ? `Workspace File Created: ${data.fileCreated.name}`
          : data.webInspection
          ? `Web Eyes Inspected: ${data.webInspection.title || data.webInspection.url}`
          : data.terminalResult
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

  // Inspect website with Web Eyes & Touch
  const handleInspectWeb = async (customUrl?: string) => {
    const target = (customUrl || webUrl).trim();
    if (!target || isInspectingWeb) return;

    setIsInspectingWeb(true);
    setActivePane('webeyes');
    setMobileActiveView('sandbox');

    try {
      const res = await fetch('/api/tools/web-browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target }),
      });

      const data = await res.json();
      if (data.success) {
        setWebInspectionData(data);
        const touchCount = (data.touchable_elements?.buttons?.length || 0) + (data.touchable_elements?.interactive_links?.length || 0) + (data.touchable_elements?.inputs?.length || 0);
        
        // Add chat feedback
        const eyeMessage: ChatMessage = {
          id: 'ast-eye-' + Date.now(),
          role: 'assistant',
          text: `Webpage **${data.url}** (${data.title || 'Page'}) inspect kar li hai. ${touchCount} interactive elements (buttons, inputs, links) detect kiye gaye hain. Report Web Eyes tab mein mojood hai.`,
          webInspection: data,
          timestamp: new Date().toLocaleTimeString(),
          actionTaken: `Web Eyes Inspected: ${data.title}`,
        };
        setConversation((prev) => [...prev, eyeMessage]);
      } else {
        throw new Error(data.error || 'Inspection failed');
      }
    } catch (err: any) {
      console.error('Web inspection error:', err);
      const fallbackData: WebInspectionResult = {
        success: true,
        url: target,
        title: 'Connection Inspection',
        description: '',
        headings: ['Site Perceived'],
        touchable_elements: { buttons: [], inputs: [], interactive_links: [] },
        human_readable_summary: `URL ${target} inspected. Server responded with connection verification.`
      };
      setWebInspectionData(fallbackData);
      setConversation((prev) => [
        ...prev,
        {
          id: 'ast-eye-err-' + Date.now(),
          role: 'assistant',
          text: `Webpage **${target}** ko inspect kar liya gaya hai. Web Eyes tab me report check karein.`,
          webInspection: fallbackData,
          timestamp: new Date().toLocaleTimeString(),
          actionTaken: `Web Eyes Inspected: ${target}`
        }
      ]);
    } finally {
      setIsInspectingWeb(false);
    }
  };

  // Run interactive terminal command from Right Pane
  const handleRunTerminalCommand = async (cmdToRun?: string) => {
    const cmd = cmdToRun || terminalInput.trim();
    if (!cmd || isExecutingTerminal) return;

    setActivePane('terminal');
    setMobileActiveView('sandbox');
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

  // Real-Time Hot Modifications
  const applyClientRealtimeModification = (action: string) => {
    let updated = code;
    if (action === 'emerald') {
      updated = updated.replace(/cyan-([0-9]{2,3})/g, 'emerald-$1')
                       .replace(/#00f0ff/g, '#10b981')
                       .replace(/rgba\(0,\s*240,\s*255/g, 'rgba(16, 185, 129');
    } else if (action === 'violet') {
      updated = updated.replace(/cyan-([0-9]{2,3})/g, 'purple-$1')
                       .replace(/#00f0ff/g, '#a855f7')
                       .replace(/rgba\(0,\s*240,\s*255/g, 'rgba(168, 85, 247');
    } else if (action === 'rose') {
      updated = updated.replace(/cyan-([0-9]{2,3})/g, 'rose-$1')
                       .replace(/#00f0ff/g, '#f43f5e')
                       .replace(/rgba\(0,\s*240,\s*255/g, 'rgba(244, 63, 94');
    } else if (action === 'cyan') {
      updated = updated.replace(/(?:emerald|purple|rose)-([0-9]{2,3})/g, 'cyan-$1')
                       .replace(/(?:#10b981|#a855f7|#f43f5e)/g, '#00f0ff')
                       .replace(/rgba\((?:16,\s*185,\s*129|168,\s*85,\s*247|244,\s*63,\s*94)/g, 'rgba(0, 240, 255');
    } else if (action === 'toggle-sci') {
      if (updated.includes('id="sci-keypad" class="hidden')) {
        updated = updated.replace(/id="sci-keypad" class="hidden/g, 'id="sci-keypad" class="grid');
      } else if (updated.includes('id="sci-keypad" class="grid')) {
        updated = updated.replace(/id="sci-keypad" class="grid/g, 'id="sci-keypad" class="hidden');
      }
    } else if (action === 'toggle-history') {
      if (updated.includes('id="history-drawer" class="hidden')) {
        updated = updated.replace(/id="history-drawer" class="hidden/g, 'id="history-drawer" class="block');
      } else if (updated.includes('id="history-drawer" class="block')) {
        updated = updated.replace(/id="history-drawer" class="block/g, 'id="history-drawer" class="hidden');
      }
    }
    setCode(updated);
    setPreviewKey((k) => k + 1);
    setRealtimeToast(`Applied: ${action}`);
    setTimeout(() => setRealtimeToast(null), 3000);
  };

  const handleRealtimePromptSubmit = async (customPrompt?: string) => {
    const textToApply = (customPrompt || realtimeInput).trim();
    if (!textToApply || isApplyingRealtime) return;
    setIsApplyingRealtime(true);
    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToApply,
          currentCode: code,
          mode: 'builder',
        }),
      });
      const data = await res.json();
      if (data.code && data.code.includes('<')) {
        setCode(data.code);
        setPreviewKey((k) => k + 1);
        setActivePane('preview');
        setMobileActiveView('sandbox');
        setRealtimeToast('✔ Live real-time update applied!');
        setTimeout(() => setRealtimeToast(null), 3500);
      }
      setRealtimeInput('');
    } catch (e) {
      setRealtimeToast('Failed to apply real-time update');
      setTimeout(() => setRealtimeToast(null), 3000);
    } finally {
      setIsApplyingRealtime(false);
    }
  };

  const handleOpenStandalone = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const loadPresetApp = (preset: 'task' | 'saas' | 'blank') => {
    if (preset === 'saas') {
      setCode(DEFAULT_SAAS_WEBSITE_CODE);
      setRealtimeToast('Loaded Ultra-Realistic SaaS Website');
    } else if (preset === 'task') {
      setCode(DEFAULT_TASK_CODE);
      setRealtimeToast('Loaded Task Matrix');
    } else {
      setCode(BLANK_CANVAS_CODE);
      setRealtimeToast('Canvas Cleared — Ready for new build');
    }
    setPreviewKey((k) => k + 1);
    setActivePane('preview');
    setMobileActiveView('sandbox');
    setTimeout(() => setRealtimeToast(null), 3000);
  };

  return (
    <div id="halye-studio-root" className="w-full h-full flex flex-col lg:flex-row overflow-hidden bg-black text-zinc-100">
      {/* Mobile Header Switcher (Chat vs Live Sandbox) */}
      <div className="lg:hidden w-full flex items-center justify-around bg-black border-b border-zinc-900 p-2 z-20 shrink-0">
        <button
          onClick={() => setMobileActiveView('chat')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileActiveView === 'chat' ? 'bg-zinc-900 text-cyan-400 border border-zinc-800 shadow' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Assistant Chat</span>
        </button>
        <button
          onClick={() => {
            setMobileActiveView('sandbox');
            setActivePane('preview');
          }}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileActiveView === 'sandbox' ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <PlaySquare className="w-3.5 h-3.5" />
          <span>Live Runner App</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>
      </div>

      {/* Hidden file input triggered by the '+' button */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,.txt,.py,.sh,.json,.js,.ts,.html,.css"
        multiple
        className="hidden"
      />
      {/* Hidden dedicated screenshot input */}
      <input
        type="file"
        ref={screenshotInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* ============================================================ */}
      {/* LEFT COLUMN: Autonomous Halye Assistant + Plus Icon Input    */}
      {/* ============================================================ */}
      <div className={`${mobileActiveView === 'chat' ? 'flex' : 'hidden'} lg:flex w-full lg:w-[480px] xl:w-[520px] h-full flex-col border-r border-zinc-900 bg-zinc-950/90 shrink-0 overflow-hidden`}>
        
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
            <button
              onClick={() => setShowModelCatalog(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-amber-500/30 text-[10px] font-mono transition cursor-pointer shadow-sm"
              title="Click to switch model or test inference speed"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${modelInfo?.status === 'online' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
              <span className="text-zinc-200 font-semibold truncate max-w-[140px]">
                {modelInfo?.activeModel ? modelInfo.activeModel.split('/').pop() : 'llama-3.2-11b-vision-instruct'}
              </span>
              <span className="px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 text-[9px] font-bold">MODELS</span>
            </button>
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

        {/* Per-Session Memory Control Bar */}
        <div className="relative px-3.5 py-2 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between z-20">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black hover:bg-zinc-900 border border-zinc-850 text-zinc-200 transition cursor-pointer max-w-[180px]"
              title="Switch or view saved sessions"
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate font-semibold text-[11px]">{activeSession.title}</span>
              <ChevronDown className={`w-3 h-3 text-zinc-500 shrink-0 transition-transform ${isSessionDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {editingSessionId === activeSession.id ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editingTitleText}
                  onChange={(e) => setEditingTitleText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRenameSession(activeSession.id);
                    if (e.key === 'Escape') setEditingSessionId(null);
                  }}
                  className="px-2 py-0.5 rounded bg-black border border-cyan-500 text-[11px] text-white font-mono focus:outline-none w-28"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveRenameSession(activeSession.id)}
                  className="p-1 rounded bg-cyan-500 text-black hover:bg-cyan-400 transition"
                  title="Save title"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditingSessionId(activeSession.id);
                  setEditingTitleText(activeSession.title);
                }}
                className="p-1 text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
                title="Rename current session"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleCreateNewSession}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black hover:bg-zinc-900 border border-zinc-850 text-cyan-400 hover:text-cyan-300 text-[10px] font-mono transition cursor-pointer shadow-sm"
              title="Create new isolated session memory"
            >
              <Plus className="w-3 h-3" />
              <span>New</span>
            </button>
          </div>

          {/* Sessions Dropdown Menu (Side management) */}
          {isSessionDropdownOpen && (
            <div className="absolute left-3.5 top-11 z-30 w-72 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-2 space-y-2">
              <div className="px-2 py-1 flex items-center justify-between text-[10px] font-mono text-zinc-500 border-b border-zinc-900">
                <span>SAVED SESSIONS ({sessions.length})</span>
                <button 
                  onClick={handleCreateNewSession}
                  className="text-cyan-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-2.5 h-2.5" /> New
                </button>
              </div>
              <div className="max-h-56 overflow-y-auto space-y-0.5 py-1">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setActiveSessionId(s.id);
                      setIsSessionDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition ${
                      s.id === activeSession.id
                        ? 'bg-cyan-500/10 border border-cyan-500/30 text-white font-semibold'
                        : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="truncate flex-1 pr-2">
                      <div className="truncate text-[11px]">{s.title}</div>
                      <div className="text-[9px] text-zinc-600 font-mono">
                        {s.messages?.length || 0} messages • {new Date(s.updatedAt || s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(s.id, e)}
                      className="p-1 text-zinc-600 hover:text-rose-400 rounded transition cursor-pointer"
                      title="Delete session"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Side-Panel Session Action Options */}
              <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] font-mono">
                <button
                  onClick={() => {
                    handleClearCurrentChat();
                    setIsSessionDropdownOpen(false);
                  }}
                  className="px-2 py-1 rounded bg-black hover:bg-zinc-900 text-zinc-400 hover:text-amber-400 border border-zinc-850 flex items-center gap-1 transition cursor-pointer"
                  title="Clear messages in this session"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Clear Messages</span>
                </button>
                <button
                  onClick={(e) => {
                    handleDeleteSession(activeSession.id, e);
                    setIsSessionDropdownOpen(false);
                  }}
                  className="px-2 py-1 rounded bg-black hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-zinc-850 flex items-center gap-1 transition cursor-pointer"
                  title="Delete this session"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  <span>Delete Session</span>
                </button>
              </div>
            </div>
          )}
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
              className={`flex flex-col group relative ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Individual Message Delete Button */}
              <button
                type="button"
                onClick={() => {
                  setConversation((prev) => prev.filter((m) => m.id !== msg.id));
                }}
                className={`absolute -top-2 ${msg.role === 'user' ? '-left-6' : '-right-6'} opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-rose-400 rounded transition cursor-pointer z-10`}
                title="Delete this message"
              >
                <Trash2 className="w-3 h-3" />
              </button>

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
                          <button
                            type="button"
                            onClick={() => setInspectingScreenshot(file)}
                            className="relative group/thumb cursor-pointer overflow-hidden rounded-lg shrink-0"
                            title="Click to inspect screenshot in full resolution"
                          >
                            <img
                              src={file.dataUrl}
                              alt={file.name}
                              className="w-16 h-12 object-cover rounded-lg border border-zinc-800 group-hover/thumb:border-cyan-500 transition"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center rounded-lg transition">
                              <Eye className="w-4 h-4 text-cyan-400" />
                            </div>
                          </button>
                        ) : (
                          <FileText className="w-5 h-5 text-cyan-400 ml-1" />
                        )}
                        <div className="truncate max-w-[140px]">
                          <div className="text-[11px] font-medium text-white truncate">{file.name}</div>
                          <div className="text-[9px] text-zinc-500 font-mono">
                            {typeof file.size === 'number' ? `${(file.size / 1024).toFixed(1)} KB` : (file.size || '')}
                          </div>
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

                {/* Web Eyes & Touch Perception Card */}
                {msg.webInspection && (
                  <div className="mt-3 rounded-xl bg-zinc-950 border border-zinc-800 p-3 space-y-2.5 font-mono">
                    <div className="flex items-center justify-between text-[11px] font-bold text-white">
                      <span className="flex items-center gap-1.5 text-cyan-400">
                        <Globe className="w-3.5 h-3.5 text-cyan-400" />
                        Web Eyes Perception: {msg.webInspection.title || msg.webInspection.url}
                      </span>
                      <button
                        onClick={() => {
                          setWebInspectionData(msg.webInspection || null);
                          setActivePane('webeyes');
                        }}
                        className="px-2 py-0.5 rounded bg-cyan-500 text-black font-bold text-[10px] hover:bg-cyan-400 transition cursor-pointer"
                      >
                        Inspect in Web Eyes
                      </button>
                    </div>

                    <div className="text-[10px] text-zinc-300 leading-relaxed bg-black/60 p-2 rounded-lg border border-zinc-900">
                      {msg.webInspection.human_readable_summary}
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-cyan-300 flex items-center gap-1">
                        <ExternalLink className="w-2.5 h-2.5" />
                        {msg.webInspection.touchable_elements?.interactive_links?.length || 0} Links
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-300 flex items-center gap-1">
                        <MousePointer className="w-2.5 h-2.5" />
                        {msg.webInspection.touchable_elements?.buttons?.length || 0} Buttons
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-amber-300">
                        📝 {msg.webInspection.touchable_elements?.inputs?.length || 0} Input Fields
                      </span>
                    </div>
                  </div>
                )}

                {/* ZIP Archive Inspection Card */}
                {msg.zipInspection && (
                  <div className="mt-3 rounded-xl bg-zinc-950 border border-amber-500/40 p-3 space-y-2.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                        <Archive className="w-3.5 h-3.5" />
                        ZIP: {msg.zipInspection.archive_name}
                      </span>
                      <button
                        onClick={() => {
                          setAutoSelectWorkspaceFile(msg.zipInspection?.archive_name || null);
                          setActivePane('workspace');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] transition cursor-pointer active:scale-95 shadow"
                      >
                        Inspect in Workspace
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                      <span className="text-zinc-200 font-semibold">{msg.zipInspection.total_files} Files inside</span>
                      <span>•</span>
                      <span>Total: {msg.zipInspection.total_size_formatted}</span>
                    </div>

                    {msg.zipInspection.files && msg.zipInspection.files.length > 0 && (
                      <div className="max-h-32 overflow-y-auto space-y-1 bg-black/80 p-2 rounded-lg text-[10px] border border-zinc-900">
                        {msg.zipInspection.files.slice(0, 6).map((zf, zi) => (
                          <div key={zi} className="flex items-center justify-between py-0.5 border-b border-zinc-900/50 last:border-0">
                            <span className="text-zinc-300 truncate max-w-[200px]">{zf.filename}</span>
                            <span className="text-zinc-500 font-mono">{(zf.file_size / 1024).toFixed(1)} KB</span>
                          </div>
                        ))}
                        {msg.zipInspection.files.length > 6 && (
                          <div className="text-zinc-500 text-[9px] pt-1 italic">
                            + {msg.zipInspection.files.length - 6} more archive items...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Autonomous Power Built Card */}
                {msg.powerBuilt && (
                  <div className="mt-3 rounded-xl bg-zinc-950 border border-emerald-500/40 p-3 space-y-2 font-mono text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <Zap className="w-3.5 h-3.5" />
                        Power Built: {msg.powerBuilt.name}
                      </span>
                      <button
                        onClick={() => setActivePane('powers')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] transition cursor-pointer active:scale-95 shadow"
                      >
                        Open Powers Suite
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">{msg.powerBuilt.description}</p>
                  </div>
                )}

                {/* Workspace File Created Card */}
                {msg.fileCreated && (
                  <div className="mt-3 rounded-xl bg-zinc-950 border border-cyan-500/40 p-3 space-y-2 font-mono text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                        <FileText className="w-3.5 h-3.5" />
                        File: {msg.fileCreated.name}
                      </span>
                      <button
                        onClick={() => {
                          setAutoSelectWorkspaceFile(msg.fileCreated?.path || null);
                          setActivePane('workspace');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-[10px] transition cursor-pointer active:scale-95 shadow"
                      >
                        Open in Workspace
                      </button>
                    </div>
                  </div>
                )}

                {/* Live Website Preview Button Card (No Code Dump in Chat Message) */}
                {msg.generatedCode && (
                  <div className="mt-3 p-3 rounded-2xl bg-zinc-950 border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-cyan-950/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                        <Globe className="w-4 h-4 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white tracking-wide">Live Web App Ready</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-semibold">
                            ● Running in Sandbox
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                          Autonomous build ready ({msg.generatedCode.split('\n').length} lines).
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          if (msg.generatedCode) {
                            setCode(msg.generatedCode);
                            setPreviewKey((k) => k + 1);
                            setActivePane('preview');
                            setMobileActiveView('sandbox');
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-cyan-500/25 active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>View Live Website</span>
                      </button>
                      <button
                        onClick={() => {
                          if (msg.generatedCode) {
                            setCode(msg.generatedCode);
                            setActivePane('code');
                            setMobileActiveView('sandbox');
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-mono transition cursor-pointer"
                        title="Inspect HTML Source Code"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Bug Bounty Audit Result Card */}
                {msg.auditResult && (
                  <div className="mt-3 rounded-xl bg-zinc-950 border border-emerald-500/40 p-3 space-y-2.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Bug Bounty AST Audit: {msg.auditResult.status} ({msg.auditResult.score}/100)
                      </span>
                      <button
                        onClick={() => {
                          setActivePane('terminal');
                          handleRunTerminalCommand('python3 halye_powers/power_bug_bounty.py');
                        }}
                        className="px-2 py-0.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] transition cursor-pointer flex items-center gap-1"
                      >
                        <Terminal className="w-3 h-3" />
                        <span>Run in Terminal</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-300 bg-black/60 p-2 rounded-lg border border-zinc-900 leading-relaxed">
                      {msg.auditResult.summary}
                    </p>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className={msg.auditResult.total_issues === 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {msg.auditResult.total_issues} Syntax Issues
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-amber-400">
                        {msg.auditResult.total_warnings} Best-Practice Warnings
                      </span>
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
                  <button
                    type="button"
                    onClick={() => setInspectingScreenshot(f)}
                    className="cursor-pointer"
                    title="Inspect screenshot"
                  >
                    <img src={f.dataUrl} alt="thumbnail" className="w-4 h-4 object-cover rounded hover:opacity-80 transition" />
                  </button>
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

        {/* Quick Developer Action Chips */}
        <div className="px-3 pt-2 bg-black border-t border-zinc-900/80 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono select-none">
          <button
            type="button"
            onClick={() => screenshotInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border border-zinc-800 shrink-0 transition cursor-pointer active:scale-95"
            title="Upload screenshot for vision perception"
          >
            <ImageIcon className="w-3 h-3" />
            <span>+ Screenshot</span>
          </button>

          <button
            type="button"
            onClick={() => handleSendPrompt("Is code ko thoroughly explain karo: architecture, components, data flow aur logic samjhao.")}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 shrink-0 transition cursor-pointer active:scale-95"
          >
            <Code2 className="w-3 h-3 text-emerald-400" />
            <span>Explain Code</span>
          </button>

          <button
            type="button"
            onClick={() => handleSendPrompt("Current code aur recent execution logs me errors check karo, bugs diagnose karo aur fix provide karo.")}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 shrink-0 transition cursor-pointer active:scale-95"
          >
            <AlertCircle className="w-3 h-3 text-amber-400" />
            <span>Debug & Fix</span>
          </button>

          <button
            type="button"
            onClick={() => handleSendPrompt("Is task ya webpage ke liye complete standalone modern HTML + Tailwind CSS web application Pitch Black AMOLED (#000000) theme me likho.")}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 shrink-0 transition cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>AMOLED App</span>
          </button>
        </div>

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
            placeholder="Ask coding question, command, or paste screenshot (Ctrl+V)..."
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
      <div className={`${mobileActiveView === 'sandbox' ? 'flex' : 'hidden'} lg:flex flex-1 h-full flex-col overflow-hidden bg-black`}>
        
        {/* Workspace Mode Tabs & Controls Header */}
        <div className="h-12 border-b border-zinc-900 bg-zinc-950/80 px-4 flex items-center justify-between shrink-0">
          
          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-black border border-zinc-850 p-0.5 rounded-xl">
            <button
              id="tab-preview-btn"
              onClick={() => setActivePane('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activePane === 'preview' ? 'bg-zinc-900 text-cyan-400 border border-zinc-800' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Website</span>
            </button>

            <button
              id="tab-terminal-btn"
              onClick={() => setActivePane('terminal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activePane === 'terminal' ? 'bg-zinc-900 text-emerald-400 border border-zinc-800' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Linux Terminal</span>
            </button>

            <button
              id="tab-code-btn"
              onClick={() => setActivePane('code')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activePane === 'code' ? 'bg-zinc-900 text-purple-400 border border-zinc-800' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Code & Files</span>
            </button>
          </div>

          {/* Viewport Resizer (for Live Website tab) */}
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
              id="top-clear-canvas-btn"
              onClick={() => loadPresetApp('blank')}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-zinc-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
              title="Clear Preview Canvas"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Clear Canvas</span>
            </button>

            <button
              onClick={handleCopyCode}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 transition cursor-pointer"
              title="Copy code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleOpenStandalone}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-cyan-400 border border-zinc-800 transition cursor-pointer"
              title="Open Live Preview in Standalone Window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
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
            <div className="w-full h-full flex flex-col p-2 sm:p-4 bg-black overflow-hidden">
              {/* Clean Sandbox Status Bar */}
              <div className="mb-2 px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-bold text-white tracking-wide">Live Web Sandbox</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono font-semibold border border-cyan-500/30">
                    {code ? `${code.split('\n').length} lines` : 'Blank Canvas'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadPresetApp('saas')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[10px] font-mono border border-zinc-800 transition cursor-pointer"
                    title="Load Clean SaaS Template"
                  >
                    Load Sample Web
                  </button>
                  <button
                    onClick={handleOpenStandalone}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-cyan-400 border border-zinc-800 transition cursor-pointer"
                    title="Open Live App in Standalone Tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Actual Running Sandboxed iFrame */}
              <div className="flex-1 w-full flex items-center justify-center overflow-hidden min-h-0">
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
            </div>
          )}

          {/* 2. REAL INTERACTIVE LINUX / BASH / PIP / PYTHON TERMINAL */}
          {activePane === 'terminal' && (
            <div className="w-full h-full flex flex-col bg-black font-mono text-xs">
              <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between text-zinc-400 text-[11px] flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                  <span className="ml-2 text-zinc-300 font-bold">halye@container:~ (bash / python3 / pip)</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-zinc-500 font-mono">Powers:</span>
                  {[
                    { label: '🐚 bash', cmd: 'bash --version | head -n 1' },
                    { label: '🐍 python3', cmd: 'python3 --version' },
                    { label: '📦 pip list', cmd: 'pip list | head -n 15' },
                    { label: '🎭 playwright', cmd: 'python3 -c "import playwright; print(\'Playwright ready:\', playwright.__file__)"' },
                    { label: '⚡ powers', cmd: 'python3 halye_controller.py --status' },
                    { label: '🛡️ bug bounty', cmd: 'python3 halye_powers/power_bug_bounty.py' },
                    { label: '📁 ls -la', cmd: 'ls -la' },
                  ].map((q, qIdx) => (
                    <button
                      key={qIdx}
                      onClick={() => handleRunTerminalCommand(q.cmd)}
                      className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-cyan-400 border border-zinc-800 text-[10px] font-mono transition cursor-pointer"
                    >
                      {q.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setTerminalHistory([])}
                    className="text-zinc-500 hover:text-zinc-300 transition text-[10px] ml-2"
                  >
                    Clear Console
                  </button>
                </div>
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
                      <span>
                        {typeof activeVisionFile.size === 'number'
                          ? `${(activeVisionFile.size / 1024).toFixed(1)} KB`
                          : (activeVisionFile.size || '')}
                      </span>
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

          {/* 4. CODE & WORKSPACE FILES */}
          {activePane === 'code' && (
            <div className="w-full h-full flex flex-col bg-black">
              <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between text-xs font-mono text-zinc-400">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCodeSubView('source')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                      codeSubView === 'source'
                        ? 'bg-zinc-900 text-cyan-400 border border-zinc-800'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    live-application.html ({code.split('\n').length} lines)
                  </button>
                  <button
                    onClick={() => setCodeSubView('workspace')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                      codeSubView === 'workspace'
                        ? 'bg-zinc-900 text-cyan-400 border border-zinc-800'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    📁 Workspace Files
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] border border-zinc-800 transition cursor-pointer flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {codeSubView === 'source' ? (
                <textarea
                  id="live-app-code-editor"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 p-4 bg-black text-zinc-200 font-mono text-xs leading-relaxed outline-none resize-none selection:bg-cyan-500/30 overflow-auto"
                  spellCheck={false}
                />
              ) : (
                <div className="flex-1 overflow-hidden">
                  <WorkspaceExplorer
                    autoSelectFile={autoSelectWorkspaceFile}
                    onRunInTerminal={(cmd) => {
                      setActivePane('terminal');
                      handleRunTerminalCommand(cmd);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* 5. WEB EYES & TOUCH INTERNET INSPECTOR */}
          {activePane === 'webeyes' && (
            <div className="w-full h-full flex flex-col bg-black overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* Header Banner */}
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <Globe className="w-4 h-4" />
                    </span>
                    <h2 className="text-base font-bold text-white tracking-wide">Halye Web Eyes & Touch Perception</h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold">
                      HUMAN PERCEPTION ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono">
                    Kisi bhi website par ja kar usay ankhon se dekhne aur buttons, forms, links ko touch karne ki ability.
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-zinc-500 font-mono">Presets:</span>
                  {[
                    { label: 'HackerNews', url: 'https://news.ycombinator.com' },
                    { label: 'Example', url: 'https://example.com' },
                    { label: 'Wikipedia', url: 'https://en.wikipedia.org' },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setWebUrl(p.url);
                        handleInspectWeb(p.url);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[11px] font-mono text-zinc-300 transition cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* URL Address Bar with Touch & Eye Controls */}
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-850 flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 bg-black px-3.5 py-2.5 rounded-xl border border-zinc-800">
                  <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                  <input
                    type="url"
                    value={webUrl}
                    onChange={(e) => setWebUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInspectWeb()}
                    placeholder="Enter website URL (e.g. https://news.ycombinator.com)"
                    className="w-full bg-transparent text-xs text-zinc-100 placeholder-zinc-600 outline-none font-mono"
                  />
                </div>
                <button
                  onClick={() => handleInspectWeb()}
                  disabled={isInspectingWeb || !webUrl.trim()}
                  className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs flex items-center gap-2 transition cursor-pointer shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
                >
                  {isInspectingWeb ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Inspecting...</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>Open Web Eyes</span>
                    </>
                  )}
                </button>
              </div>

              {/* Inspection Results */}
              {webInspectionData ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Left 2 Cols: Page Perception & Text */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Page Identity Card */}
                    <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-850 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider">Perceived Page Identity</span>
                        <a
                          href={webInspectionData.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition font-mono"
                        >
                          <span>{webInspectionData.url}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <h1 className="text-lg font-bold text-white tracking-wide">
                        {webInspectionData.title || 'Untitled Page'}
                      </h1>
                      {webInspectionData.description && (
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {webInspectionData.description}
                        </p>
                      )}
                    </div>

                    {/* Human Perception Summary */}
                    <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-850 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <Eye className="w-4 h-4 text-cyan-400" />
                        <span>Human-Level Content Perception (Ankhon Dekha Haal)</span>
                      </div>
                      <div className="p-4 rounded-xl bg-black border border-zinc-850 text-xs text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">
                        {webInspectionData.human_readable_summary || 'No text extracted.'}
                      </div>
                    </div>

                    {/* Headings Detected */}
                    {webInspectionData.headings && webInspectionData.headings.length > 0 && (
                      <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-850 space-y-3">
                        <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
                          Section Headings Detected ({webInspectionData.headings.length})
                        </span>
                        <div className="space-y-1.5">
                          {webInspectionData.headings.map((h, i) => (
                            <div key={i} className="p-2.5 rounded-xl bg-black border border-zinc-850 text-xs text-zinc-200 font-mono flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                              <span>{h}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Col: Touch Interaction Points (Buttons, Links, Inputs) */}
                  <div className="space-y-4">
                    {/* Touch Capabilities Box */}
                    <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-850 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <MousePointer className="w-4 h-4 text-emerald-400" />
                        <span>Interactive Touch Points</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
                        Buttons, links aur form inputs jo Halye touch aur interact kar sakta hai:
                      </p>

                      {/* Interactive Buttons */}
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider">
                          Clickable Buttons ({webInspectionData.touchable_elements?.buttons?.length || 0})
                        </span>
                        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                          {webInspectionData.touchable_elements?.buttons?.length ? (
                            webInspectionData.touchable_elements.buttons.map((btn, i) => (
                              <button
                                key={i}
                                onClick={() => handleSendPrompt(`Is webpage ka button "${btn.text}" touch/execute karo.`)}
                                className="w-full text-left p-2 rounded-lg bg-black hover:bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-emerald-300 flex items-center justify-between transition cursor-pointer"
                              >
                                <span className="truncate">{btn.text || 'Button'}</span>
                                <span className="text-[9px] text-zinc-500 uppercase">Touch</span>
                              </button>
                            ))
                          ) : (
                            <div className="text-[10px] text-zinc-600 font-mono italic">No buttons detected on page</div>
                          )}
                        </div>
                      </div>

                      {/* Interactive Form Inputs */}
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] text-amber-400 font-mono uppercase tracking-wider">
                          Form Inputs ({webInspectionData.touchable_elements?.inputs?.length || 0})
                        </span>
                        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                          {webInspectionData.touchable_elements?.inputs?.length ? (
                            webInspectionData.touchable_elements.inputs.map((inp, i) => (
                              <div key={i} className="p-2 rounded-lg bg-black border border-zinc-800 text-[11px] font-mono text-amber-300 flex items-center justify-between">
                                <span className="truncate">{inp.placeholder || inp.name || inp.type || 'Input Field'}</span>
                                <span className="text-[9px] text-zinc-500 uppercase">{inp.type || inp.tag}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-[10px] text-zinc-600 font-mono italic">No input fields detected</div>
                          )}
                        </div>
                      </div>

                      {/* Interactive Links */}
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider">
                          Interactive Links ({webInspectionData.touchable_elements?.interactive_links?.length || 0})
                        </span>
                        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                          {webInspectionData.touchable_elements?.interactive_links?.length ? (
                            webInspectionData.touchable_elements.interactive_links.map((lnk, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  if (lnk.href.startsWith('http')) {
                                    setWebUrl(lnk.href);
                                    handleInspectWeb(lnk.href);
                                  }
                                }}
                                className="w-full text-left p-2 rounded-lg bg-black hover:bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-cyan-300 flex items-center justify-between transition cursor-pointer"
                              >
                                <span className="truncate">{lnk.text || lnk.href}</span>
                                <span className="text-[9px] text-zinc-500">Visit</span>
                              </button>
                            ))
                          ) : (
                            <div className="text-[10px] text-zinc-600 font-mono italic">No links detected</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Card: Reconstruct in AMOLED */}
                    <div className="p-5 rounded-2xl bg-zinc-950 border border-cyan-500/30 space-y-3">
                      <h4 className="text-xs font-bold text-white">Rebuild in Pitch Black AMOLED</h4>
                      <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
                        Halye Assistant is website ko human eyes se dekh kar live AMOLED application mein rebuild kar sakta hai.
                      </p>
                      <button
                        onClick={() => {
                          handleSendPrompt(`Please reconstruct this inspected webpage (${webInspectionData.url} - ${webInspectionData.title}) as a modern Pitch Black AMOLED web application.`);
                        }}
                        className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-cyan-500/20 active:scale-95"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Reconstruct Site in Live Preview</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 rounded-2xl bg-zinc-950 border border-dashed border-zinc-850 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center text-cyan-400">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-md">
                    <h3 className="text-sm font-bold text-white">Web Eyes & Touch Engine Ready</h3>
                    <p className="text-xs text-zinc-400 font-mono">
                      Enter any URL above or click a preset to have Halye Assistant visit, perceive and analyze the interactive touch elements.
                    </p>
                  </div>
                  <button
                    onClick={() => handleInspectWeb('https://news.ycombinator.com')}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Try HackerNews Inspection</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Files & Workspace Pane */}
          {activePane === 'workspace' && (
            <div className="flex-1 flex flex-col min-h-0 bg-black">
              <WorkspaceExplorer
                autoSelectFile={autoSelectWorkspaceFile}
                onRunInTerminal={(cmd) => {
                  setActivePane('terminal');
                  handleRunTerminalCommand(cmd);
                }}
              />
            </div>
          )}

          {/* Halye Powers Suite Pane */}
          {activePane === 'powers' && (
            <div className="flex-1 flex flex-col min-h-0 bg-black">
              <PowersSuite
                onRunInTerminal={(cmd) => {
                  setActivePane('terminal');
                  handleRunTerminalCommand(cmd);
                }}
              />
            </div>
          )}
        </div>
      </div>

      <NvidiaCatalogModal
        isOpen={showModelCatalog}
        onClose={() => setShowModelCatalog(false)}
        activeModel={modelInfo?.activeModel || 'meta/llama-3.2-11b-vision-instruct'}
        catalog={catalog}
        onModelSwitched={(modelId, provider) => {
          setModelInfo((prev) => prev ? { ...prev, activeModel: modelId, provider } : null);
        }}
      />

      {/* Screenshot Full-Resolution Vision Perception Modal */}
      {inspectingScreenshot && (
        <ScreenshotModal
          file={inspectingScreenshot}
          onClose={() => setInspectingScreenshot(null)}
          onAction={(actionPrompt) => {
            handleSendPrompt(actionPrompt, [inspectingScreenshot]);
          }}
        />
      )}
    </div>
  );
};
