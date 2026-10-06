import React, { useState } from 'react';
import {
  FileText,
  Edit3,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Check,
  Terminal,
  Maximize2,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { ActionHistoryItem } from '../types';

interface ActionHistoryCardProps {
  actionHistory?: ActionHistoryItem;
  defaultExpanded?: boolean;
  onOpenFullView?: () => void;
  onOpenFileInWorkspace?: (filePath: string) => void;
}

export const ActionHistoryCard: React.FC<ActionHistoryCardProps> = ({
  actionHistory,
  defaultExpanded = false,
  onOpenFullView,
  onOpenFileInWorkspace,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isThoughtExpanded, setIsThoughtExpanded] = useState(false);

  if (!actionHistory) return null;

  const {
    thought,
    filesRead = [],
    filesEdited = [],
    commandsRun = [],
  } = actionHistory;

  const totalActions =
    (thought ? 1 : 0) +
    filesRead.length +
    filesEdited.length +
    commandsRun.length;

  if (totalActions === 0) return null;

  return (
    <div className="my-1.5 rounded-xl bg-zinc-950/90 border border-zinc-800/70 overflow-hidden text-xs font-sans">
      {/* Compact single-line header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-3 py-1.5 bg-black/60 hover:bg-zinc-900/60 flex items-center justify-between cursor-pointer transition select-none"
      >
        <div className="flex items-center gap-2 text-zinc-400">
          <Layers className="w-3 h-3 text-cyan-400" />
          <span className="text-[10px] font-mono text-zinc-300">Action history</span>
          <span className="text-[10px] text-zinc-500 font-mono">
            ({filesRead.length} read · {filesEdited.length} edited{commandsRun.length > 0 ? ` · ${commandsRun.length} cmd` : ''})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {onOpenFullView && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenFullView();
              }}
              className="p-1 rounded text-zinc-500 hover:text-cyan-300 transition cursor-pointer"
              title="Full view"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          )}
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          )}
        </div>
      </div>

      {/* Compact expanded content */}
      {isExpanded && (
        <div className="px-3 py-2 space-y-1.5 bg-zinc-950/40 border-t border-zinc-900/60">
          {thought && (
            <button
              type="button"
              onClick={() => setIsThoughtExpanded(!isThoughtExpanded)}
              className="w-full flex items-center gap-2 text-left text-[10px] font-mono text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
            >
              <Lightbulb className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Thought for {thought.durationSeconds || 4}s</span>
              <span className="text-zinc-600">{isThoughtExpanded ? '▾' : '▸'}</span>
            </button>
          )}
          {isThoughtExpanded && thought?.summary && (
            <p className="text-[10px] text-zinc-500 pl-5 leading-relaxed">{thought.summary}</p>
          )}

          {filesRead.length > 0 && (
            <div className="space-y-0.5">
              {filesRead.map((file, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                  <FileText className="w-3 h-3 text-zinc-600 shrink-0" />
                  <span className="truncate">{file.path}</span>
                  {onOpenFileInWorkspace && (
                    <button
                      type="button"
                      onClick={() => onOpenFileInWorkspace(file.path)}
                      className="text-cyan-500 hover:text-cyan-300 shrink-0 cursor-pointer"
                      title="Inspect"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {filesEdited.length > 0 && (
            <div className="space-y-0.5">
              {filesEdited.map((file, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                  <Edit3 className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="truncate">{file.path}</span>
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                </div>
              ))}
            </div>
          )}

          {commandsRun.length > 0 && (
            <div className="space-y-0.5">
              {commandsRun.map((cmd, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px] font-mono">
                  <Terminal className="w-3 h-3 text-zinc-600 shrink-0" />
                  <span className="text-zinc-500 truncate">$ {cmd.command}</span>
                  <span className={cmd.exitCode === 0 ? 'text-emerald-500' : 'text-rose-400'}>
                    {cmd.exitCode === 0 ? '✓' : `✗${cmd.exitCode}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
