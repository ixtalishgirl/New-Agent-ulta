import React, { useState } from 'react';
import { 
  FileText, 
  Edit3, 
  Lightbulb, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  Terminal, 
  AlertTriangle, 
  Wrench, 
  Maximize2, 
  Check, 
  Code2, 
  Search,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { ActionHistoryItem, ActionHistoryIssue, ActionHistoryFix } from '../types';

interface ActionHistoryCardProps {
  actionHistory?: ActionHistoryItem;
  defaultExpanded?: boolean;
  onOpenFullView?: () => void;
  onOpenFileInWorkspace?: (filePath: string) => void;
}

export const ActionHistoryCard: React.FC<ActionHistoryCardProps> = ({
  actionHistory,
  defaultExpanded = true,
  onOpenFullView,
  onOpenFileInWorkspace,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isThoughtExpanded, setIsThoughtExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'diagnostics' | 'fixes'>('summary');

  if (!actionHistory) return null;

  const {
    thought,
    filesRead = [],
    filesEdited = [],
    commandsRun = [],
    issuesDiagnosed = [],
    fixesApplied = [],
  } = actionHistory;

  const totalActions = 
    (thought ? 1 : 0) + 
    filesRead.length + 
    filesEdited.length + 
    commandsRun.length + 
    issuesDiagnosed.length + 
    fixesApplied.length;

  if (totalActions === 0) return null;

  return (
    <div className="my-2 rounded-2xl bg-zinc-950/90 border border-zinc-800/80 shadow-lg overflow-hidden text-xs font-sans transition-all duration-200">
      {/* Top Header Accordion (Matches Screenshot 1 & 2: "Action history") */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-3.5 py-2.5 bg-black/60 hover:bg-zinc-900/60 border-b border-zinc-900 flex items-center justify-between cursor-pointer transition select-none"
      >
        <div className="flex items-center gap-2 text-zinc-300 font-semibold">
          <div className="w-5 h-5 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400">
            <Layers className="w-3 h-3" />
          </div>
          <span className="text-[11px] font-mono tracking-wide text-zinc-200">Action history</span>
          <span className="text-[10px] text-zinc-500 font-mono">
            ({filesRead.length} read • {filesEdited.length} edited{thought ? ` • ${thought.durationSeconds}s` : ''})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenFullView && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenFullView();
              }}
              className="px-2 py-0.5 rounded-md bg-zinc-900 hover:bg-cyan-950/50 text-zinc-400 hover:text-cyan-300 border border-zinc-800 text-[10px] font-mono flex items-center gap-1 transition cursor-pointer"
              title="Open full trace and thought process"
            >
              <Maximize2 className="w-2.5 h-2.5" />
              <span>Full view</span>
            </button>
          )}

          <div className="text-zinc-500 hover:text-white transition">
            {isExpanded ? <ChevronDown className="w-4 h-4 text-cyan-400" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-3 space-y-2.5 bg-zinc-950/40">
          {/* 1. Thought Section (Screenshot: "💡 Thought for 4 seconds") */}
          {thought && (
            <div className="rounded-xl bg-black/40 border border-zinc-900 overflow-hidden">
              <button
                type="button"
                onClick={() => setIsThoughtExpanded(!isThoughtExpanded)}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-zinc-900/40 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-2 text-zinc-300 font-mono text-[11px]">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Thought for {thought.durationSeconds || 4} seconds</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                  <span>{isThoughtExpanded ? 'Hide logic' : 'View thoughts'}</span>
                  {isThoughtExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </div>
              </button>

              {/* Collapsible Thought Details */}
              {isThoughtExpanded && (
                <div className="p-3 pt-1 border-t border-zinc-900/80 bg-zinc-950/60 text-[11px] space-y-1.5 font-sans leading-relaxed text-zinc-300">
                  <p className="text-zinc-400">{thought.summary}</p>
                  {thought.detailedSteps && thought.detailedSteps.length > 0 && (
                    <div className="mt-2 space-y-1 font-mono text-[10px] text-zinc-400">
                      {thought.detailedSteps.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-1.5">
                          <span className="text-cyan-400 shrink-0">›</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. Read Files Section (Screenshot 1: "Read file: src/components/HalyeStudio.tsx") */}
          {filesRead.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 px-1 text-[10px] font-mono text-zinc-400">
                <FileText className="w-3 h-3 text-cyan-400" />
                <span>Read {filesRead.length} file{filesRead.length > 1 ? 's' : ''}:</span>
              </div>
              <div className="space-y-1">
                {filesRead.map((file, fIdx) => (
                  <div
                    key={fIdx}
                    className="p-2 px-2.5 rounded-lg bg-black/60 border border-zinc-900 flex items-center justify-between gap-2 hover:border-zinc-800 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="font-mono text-[11px] text-zinc-200 truncate">
                        {file.path}
                      </span>
                      {file.linesCount && (
                        <span className="text-[9px] text-zinc-500 font-mono shrink-0">
                          ({file.linesCount.toLocaleString()} lines)
                        </span>
                      )}
                    </div>
                    {onOpenFileInWorkspace && (
                      <button
                        type="button"
                        onClick={() => onOpenFileInWorkspace(file.path)}
                        className="text-[9px] text-cyan-400 hover:text-cyan-300 font-mono hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
                        title="View file contents in workspace"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Edited Files Section (Screenshot 2: "Edited 1 file: server.ts" with green checkmark) */}
          {filesEdited.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 px-1 text-[10px] font-mono text-zinc-400">
                <Edit3 className="w-3 h-3 text-emerald-400" />
                <span>Edited {filesEdited.length} file{filesEdited.length > 1 ? 's' : ''}:</span>
              </div>
              <div className="space-y-1">
                {filesEdited.map((file, eIdx) => (
                  <div
                    key={eIdx}
                    className="p-2 px-2.5 rounded-lg bg-black/60 border border-zinc-900 flex items-center justify-between gap-2 hover:border-zinc-800 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[11px] text-zinc-200 truncate">
                        {file.path}
                      </span>
                      {file.linesModified && (
                        <span className="text-[9px] text-emerald-400 font-mono shrink-0">
                          (+{file.linesModified} lines)
                        </span>
                      )}
                    </div>
                    
                    {/* Circled Green Checkmark from Screenshot 2 */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-4 h-4 rounded-full border border-emerald-500/80 bg-emerald-950/40 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-950">
                        <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Terminal Commands Executed */}
          {commandsRun.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 px-1 text-[10px] font-mono text-zinc-400">
                <Terminal className="w-3 h-3 text-emerald-400" />
                <span>Terminal automation ({commandsRun.length}):</span>
              </div>
              <div className="space-y-1">
                {commandsRun.map((cmd, cIdx) => (
                  <div
                    key={cIdx}
                    className="p-2 px-2.5 rounded-lg bg-black/80 border border-zinc-900 font-mono text-[10px] flex items-center justify-between gap-2"
                  >
                    <span className="text-emerald-400 truncate">$ {cmd.command}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] ${cmd.exitCode === 0 ? 'text-emerald-400 bg-emerald-950/30' : 'text-rose-400 bg-rose-950/30'}`}>
                      exit {cmd.exitCode}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. "Jo Mila" & "Jo Kiya" (Diagnostics Found vs Fixes Applied) */}
          {(issuesDiagnosed.length > 0 || fixesApplied.length > 0) && (
            <div className="pt-2 border-t border-zinc-900 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
              {/* Jo Mila (Issues Detected) */}
              {issuesDiagnosed.length > 0 && (
                <div className="p-2.5 rounded-xl bg-black/60 border border-amber-900/40 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold font-mono">
                    <Search className="w-3 h-3" />
                    <span>Jo Mila (Issues Diagnosed):</span>
                  </div>
                  <div className="space-y-1">
                    {issuesDiagnosed.map((issue, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-zinc-300">
                        <span className="text-amber-400 shrink-0 font-bold">•</span>
                        <div>
                          <span className="font-semibold text-zinc-200">{issue.title}:</span>{' '}
                          <span className="text-zinc-400">{issue.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Jo Kiya (Fixes Applied) */}
              {fixesApplied.length > 0 && (
                <div className="p-2.5 rounded-xl bg-black/60 border border-emerald-900/40 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono">
                    <Wrench className="w-3 h-3" />
                    <span>Jo Kiya (Fixes Applied):</span>
                  </div>
                  <div className="space-y-1">
                    {fixesApplied.map((fix, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-zinc-300">
                        <span className="text-emerald-400 shrink-0 font-bold">✓</span>
                        <div>
                          <span className="font-semibold text-emerald-300">{fix.title}:</span>{' '}
                          <span className="text-zinc-400">{fix.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Process View Button */}
          {onOpenFullView && (
            <div className="pt-1 flex items-center justify-end">
              <button
                type="button"
                onClick={onOpenFullView}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Pura process & code trace dekhein</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
