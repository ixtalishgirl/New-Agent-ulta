import React, { useState } from 'react';
import { 
  X, 
  Rocket, 
  Download, 
  Terminal, 
  Check, 
  Copy, 
  ExternalLink, 
  FolderCheck,
  CheckCircle2,
  FileCode,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface VercelDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  onRunTerminalCommand: (cmd: string) => void;
}

export const VercelDeployModal: React.FC<VercelDeployModalProps> = ({
  isOpen,
  onClose,
  code,
  onRunTerminalCommand,
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [isSavingToWorkspace, setIsSavingToWorkspace] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2500);
  };

  const handleDownloadZip = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveToWorkspace = async () => {
    setIsSavingToWorkspace(true);
    try {
      const res = await fetch('/api/project/export-vercel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingToWorkspace(false);
    }
  };

  const deployCommand = 'npx vercel --yes';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 selection:bg-cyan-500 selection:text-black">
      <div className="max-w-2xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Subtle Ambient Glow */}
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center text-white shadow-lg">
              <Rocket className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Deploy Web Application to Vercel
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Zero-configuration static edge deployment pipeline.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6 text-xs text-zinc-300">
          
          {/* Status Banner */}
          <div className="p-4 rounded-2xl bg-black border border-zinc-850 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
              <div>
                <div className="font-bold text-white text-sm">Vercel Edge Ready</div>
                <div className="text-zinc-500 text-[11px] font-mono mt-0.5">
                  Code size: {Math.round(code.length / 1024)} KB • HTML5 & Tailwind CSS
                </div>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[11px] font-mono font-semibold">
              Production Verified
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Action 1: Save to Workspace */}
            <button
              onClick={handleSaveToWorkspace}
              disabled={isSavingToWorkspace}
              className="p-4 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-cyan-500/50 text-left transition group cursor-pointer"
            >
              <div className="flex items-center justify-between font-bold text-white group-hover:text-cyan-400 text-sm">
                <span className="flex items-center gap-2">
                  <FolderCheck className="w-4 h-4 text-cyan-400" />
                  Save Vercel Files
                </span>
                {saveSuccess ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <span className="text-[10px] text-zinc-500 font-mono">Workspace</span>
                )}
              </div>
              <p className="text-zinc-400 text-[11px] mt-1.5">
                Writes <code className="text-cyan-400">vercel.json</code>, <code className="text-cyan-400">package.json</code>, and <code className="text-cyan-400">index.html</code> directly into your root workspace.
              </p>
            </button>

            {/* Action 2: Download Package */}
            <button
              onClick={handleDownloadZip}
              className="p-4 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-emerald-500/50 text-left transition group cursor-pointer"
            >
              <div className="flex items-center justify-between font-bold text-white group-hover:text-emerald-400 text-sm">
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  Download HTML Bundle
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">.html</span>
              </div>
              <p className="text-zinc-400 text-[11px] mt-1.5">
                Instant download of the complete standalone website for drag-and-drop deployment on Vercel dashboard.
              </p>
            </button>
          </div>

          {/* Terminal Command Box */}
          <div className="p-4 rounded-2xl bg-black border border-zinc-850 space-y-3 font-mono">
            <div className="flex items-center justify-between text-zinc-400 text-[11px]">
              <span className="flex items-center gap-1.5 font-bold text-zinc-200">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Option 1: Deploy with Halye Terminal Shell
              </span>
              <button
                onClick={() => handleCopy(deployCommand, 'cmd')}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                {copied === 'cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied === 'cmd' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-900 text-cyan-300 flex items-center justify-between">
              <code>$ {deployCommand}</code>
              <button
                onClick={() => {
                  onRunTerminalCommand(deployCommand);
                  onClose();
                }}
                className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-[11px] cursor-pointer transition active:scale-95"
              >
                Run in Terminal →
              </button>
            </div>
          </div>

          {/* Step-by-Step Vercel Guide */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
            <div className="font-bold text-white text-xs uppercase font-mono tracking-wider">
              Option 2: Deploy via Vercel Web Dashboard (100% Free)
            </div>
            <ol className="space-y-2 text-[11px] text-zinc-400 list-decimal pl-4 leading-relaxed">
              <li>
                Click <strong className="text-white">"Download HTML Bundle"</strong> above or push your code to GitHub via the GitHub modal.
              </li>
              <li>
                Go to <a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline inline-flex items-center gap-1">vercel.com/new <ExternalLink className="w-3 h-3 inline" /></a>.
              </li>
              <li>
                Drag and drop your project folder or select your GitHub repository.
              </li>
              <li>
                Click <strong className="text-white">"Deploy"</strong>. Your website will be live worldwide in ~15 seconds with a free <code className="text-cyan-400">.vercel.app</code> SSL domain!
              </li>
            </ol>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-900 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-zinc-500 font-mono">
            Clean single-page or multi-page ready
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
