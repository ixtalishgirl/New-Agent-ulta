import React, { useState } from 'react';
import { 
  X, 
  Lightbulb, 
  FileText, 
  Edit3, 
  Terminal, 
  Search, 
  Wrench, 
  Check, 
  Copy, 
  ExternalLink,
  Code2,
  CheckCircle2
} from 'lucide-react';
import { ActionHistoryItem } from '../types';

interface FullProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionHistory?: ActionHistoryItem;
  messageText?: string;
  onOpenFileInWorkspace?: (filePath: string) => void;
}

export const FullProcessModal: React.FC<FullProcessModalProps> = ({
  isOpen,
  onClose,
  actionHistory,
  messageText,
  onOpenFileInWorkspace,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'thoughts' | 'files' | 'diagnostics'>('all');

  if (!isOpen || !actionHistory) return null;

  const handleCopyTrace = () => {
    const traceJson = JSON.stringify({ actionHistory, messageText }, null, 2);
    navigator.clipboard.writeText(traceJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const {
    thought,
    filesRead = [],
    filesEdited = [],
    commandsRun = [],
    issuesDiagnosed = [],
    fixesApplied = [],
  } = actionHistory;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-zinc-900 bg-black flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400 text-xs font-mono font-bold">
              ⚡
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Agent Thought & Execution Trace</span>
                <span className="px-2 py-0.2 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono">
                  Full View
                </span>
              </h2>
              <p className="text-[10px] text-zinc-500 font-mono">
                Comprehensive step-by-step diagnostic log & file audit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyTrace}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
              title="Copy trace JSON"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Trace'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="px-4 py-2 bg-zinc-900/40 border-b border-zinc-900 flex items-center gap-2 overflow-x-auto text-[11px] font-mono">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              activeTab === 'all' ? 'bg-cyan-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Actions ({1 + filesRead.length + filesEdited.length + issuesDiagnosed.length})
          </button>
          <button
            onClick={() => setActiveTab('thoughts')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              activeTab === 'thoughts' ? 'bg-cyan-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Thoughts ({thought?.durationSeconds || 0}s)
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              activeTab === 'files' ? 'bg-cyan-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Files ({filesRead.length} read, {filesEdited.length} edited)
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              activeTab === 'diagnostics' ? 'bg-cyan-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Issues & Fixes ({issuesDiagnosed.length + fixesApplied.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
          {/* Thoughts */}
          {(activeTab === 'all' || activeTab === 'thoughts') && thought && (
            <div className="p-3.5 rounded-xl bg-black/60 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold font-mono">
                <Lightbulb className="w-4 h-4" />
                <span>Agent Thought Process ({thought.durationSeconds}s)</span>
              </div>
              <p className="text-zinc-300 leading-relaxed font-sans text-xs">
                {thought.summary}
              </p>
              {thought.detailedSteps && thought.detailedSteps.length > 0 && (
                <div className="pt-2 border-t border-zinc-900 space-y-1.5 font-mono text-[11px]">
                  {thought.detailedSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-zinc-400">
                      <span className="text-cyan-400 font-bold">{idx + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Files Read */}
          {(activeTab === 'all' || activeTab === 'files') && filesRead.length > 0 && (
            <div className="p-3.5 rounded-xl bg-black/60 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold font-mono">
                <FileText className="w-4 h-4" />
                <span>Files Read & Audited ({filesRead.length})</span>
              </div>
              <div className="space-y-2">
                {filesRead.map((file, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-900 space-y-1">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-zinc-200 font-bold truncate">{file.path}</span>
                      <div className="flex items-center gap-2">
                        {file.linesCount && (
                          <span className="text-zinc-500">
                            {file.linesCount.toLocaleString()} lines
                          </span>
                        )}
                        {onOpenFileInWorkspace && (
                          <button
                            onClick={() => {
                              onOpenFileInWorkspace(file.path);
                              onClose();
                            }}
                            className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {file.preview && (
                      <pre className="text-[10px] font-mono text-zinc-400 bg-black/80 p-2 rounded max-h-32 overflow-y-auto whitespace-pre-wrap">
                        {file.preview}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files Edited */}
          {(activeTab === 'all' || activeTab === 'files') && filesEdited.length > 0 && (
            <div className="p-3.5 rounded-xl bg-black/60 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono">
                <Edit3 className="w-4 h-4" />
                <span>Files Edited & Patched ({filesEdited.length})</span>
              </div>
              <div className="space-y-2">
                {filesEdited.map((file, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-900 flex items-center justify-between font-mono text-[11px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-emerald-400">
                        <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                      </div>
                      <span className="text-zinc-200 font-bold truncate">{file.path}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {file.linesModified && (
                        <span className="text-emerald-400">+{file.linesModified} lines</span>
                      )}
                      {file.status && (
                        <span className="text-zinc-500">({file.status})</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diagnostics (Jo Mila) */}
          {(activeTab === 'all' || activeTab === 'diagnostics') && issuesDiagnosed.length > 0 && (
            <div className="p-3.5 rounded-xl bg-black/60 border border-amber-900/40 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold font-mono">
                <Search className="w-4 h-4" />
                <span>Jo Mila (Issues Diagnosed in Codebase):</span>
              </div>
              <div className="space-y-2">
                {issuesDiagnosed.map((issue, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-900 space-y-1">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-amber-300 font-bold">{issue.title}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-950/60 text-amber-400 border border-amber-800/40 uppercase">
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      {issue.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fixes (Jo Kiya) */}
          {(activeTab === 'all' || activeTab === 'diagnostics') && fixesApplied.length > 0 && (
            <div className="p-3.5 rounded-xl bg-black/60 border border-emerald-900/40 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono">
                <Wrench className="w-4 h-4" />
                <span>Jo Kiya (Autonomous Fixes Applied):</span>
              </div>
              <div className="space-y-2">
                {fixesApplied.map((fix, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-900 space-y-1">
                    <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-300 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{fix.title}</span>
                    </div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      {fix.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
