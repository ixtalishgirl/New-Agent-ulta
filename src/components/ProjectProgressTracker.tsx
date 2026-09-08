import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Circle, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  Sparkles, 
  ListChecks, 
  Layers, 
  Check, 
  X,
  Target
} from 'lucide-react';
import { ProjectScope, ProjectScopeStep } from '../types';

interface ProjectProgressTrackerProps {
  scope: ProjectScope;
  onUpdateScope: (updated: ProjectScope) => void;
  isCompact?: boolean;
}

export const ProjectProgressTracker: React.FC<ProjectProgressTrackerProps> = ({
  scope,
  onUpdateScope,
  isCompact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [scopeTitle, setScopeTitle] = useState(scope.title);

  // Recalculate percentage based on steps
  const totalSteps = scope.steps.length;
  const completedSteps = scope.steps.filter((s) => s.status === 'completed').length;
  const inProgressStep = scope.steps.find((s) => s.status === 'in_progress');
  const computedPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : scope.percentage || 0;

  const handleToggleStepStatus = (stepId: string) => {
    const updatedSteps: ProjectScopeStep[] = scope.steps.map((step) => {
      if (step.id === stepId) {
        if (step.status === 'completed') return { ...step, status: 'pending', completedAt: undefined };
        if (step.status === 'pending') return { ...step, status: 'in_progress' };
        return { ...step, status: 'completed', completedAt: new Date().toLocaleTimeString() };
      }
      return step;
    });

    const newCompleted = updatedSteps.filter((s) => s.status === 'completed').length;
    const newPct = updatedSteps.length > 0 ? Math.round((newCompleted / updatedSteps.length) * 100) : 0;

    onUpdateScope({
      ...scope,
      steps: updatedSteps,
      percentage: newPct,
      activeTask: updatedSteps.find((s) => s.status === 'in_progress')?.title || scope.activeTask,
    });
  };

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepTitle.trim()) return;
    const newStep: ProjectScopeStep = {
      id: `step-${Date.now()}`,
      title: newStepTitle.trim(),
      status: 'pending',
    };
    const updatedSteps = [...scope.steps, newStep];
    const newCompleted = updatedSteps.filter((s) => s.status === 'completed').length;
    const newPct = Math.round((newCompleted / updatedSteps.length) * 100);

    onUpdateScope({
      ...scope,
      steps: updatedSteps,
      percentage: newPct,
    });
    setNewStepTitle('');
  };

  const handleDeleteStep = (stepId: string) => {
    const updatedSteps = scope.steps.filter((s) => s.id !== stepId);
    const newCompleted = updatedSteps.filter((s) => s.status === 'completed').length;
    const newPct = updatedSteps.length > 0 ? Math.round((newCompleted / updatedSteps.length) * 100) : 0;

    onUpdateScope({
      ...scope,
      steps: updatedSteps,
      percentage: newPct,
    });
  };

  const handleSaveTitle = () => {
    if (scopeTitle.trim()) {
      onUpdateScope({
        ...scope,
        title: scopeTitle.trim(),
      });
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="relative">
      {/* Visual Progress Bar in Header */}
      <button
        type="button"
        id="project-progress-tracker-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 transition cursor-pointer group shadow-sm active:scale-98"
        title="Click to view full project scope & roadmap steps"
      >
        {/* Animated Circular / Milestone Indicator */}
        <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
          <svg className="w-6 h-6 -rotate-90 transform" viewBox="0 0 36 36">
            <path
              className="text-zinc-800"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-cyan-400 transition-all duration-500 ease-out"
              strokeDasharray={`${computedPercentage}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className="absolute text-[8px] font-mono font-bold text-white">
            {computedPercentage}%
          </span>
        </div>

        {/* Task & Step Info */}
        <div className="flex flex-col text-left min-w-0 max-w-[150px] sm:max-w-[200px] md:max-w-[260px]">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-white truncate group-hover:text-cyan-300 transition">
              {scope.activeTask || inProgressStep?.title || scope.title}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[9px] text-zinc-400 font-mono">
            <span className="text-cyan-400 font-semibold">
              Step {completedSteps + (inProgressStep ? 1 : 0)}/{totalSteps}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="truncate">{computedPercentage}% completed</span>
          </div>
        </div>

        {/* Linear Progress Bar Strip */}
        <div className="hidden sm:flex flex-col w-20 md:w-28 gap-1 shrink-0">
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/80">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-300 transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]"
              style={{ width: `${computedPercentage}%` }}
            />
          </div>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-transform duration-200 ${isOpen ? 'rotate-180 text-cyan-400' : ''}`} />
      </button>

      {/* Popover / Scope Steps Roadmap Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs"
            onClick={() => setIsOpen(false)}
          />

          {/* Card */}
          <div className="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 top-full mt-2 w-[92vw] sm:w-[460px] max-w-[480px] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400 shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  {isEditingTitle ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={scopeTitle}
                        onChange={(e) => setScopeTitle(e.target.value)}
                        className="bg-black border border-zinc-700 rounded px-2 py-0.5 text-xs text-white outline-none focus:border-cyan-500 font-bold"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveTitle}
                        className="p-1 text-emerald-400 hover:text-emerald-300"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <h3 
                      onClick={() => setIsEditingTitle(true)}
                      className="text-xs font-bold text-white truncate cursor-pointer hover:text-cyan-400 transition flex items-center gap-1"
                      title="Click to rename project scope"
                    >
                      <span>{scope.title}</span>
                      <span className="text-[10px] text-zinc-600 font-mono">✎</span>
                    </h3>
                  )}
                  <p className="text-[10px] text-zinc-400 font-mono">
                    Active Project Scope & Task Progress
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] font-bold">
                  {computedPercentage}% Done
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Linear Progress Bar Details */}
            <div className="py-3 border-b border-zinc-900 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-zinc-400">Completion Status</span>
                <span className="text-white font-bold">
                  {completedSteps} of {totalSteps} Steps Complete
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-300 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                  style={{ width: `${computedPercentage}%` }}
                />
              </div>
            </div>

            {/* Steps List */}
            <div className="py-3 max-h-64 overflow-y-auto space-y-2 pr-1">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                <span>PROJECT SCOPE ROADMAP</span>
                <span>Click to change status</span>
              </div>

              {scope.steps.map((step, idx) => {
                const isDone = step.status === 'completed';
                const isCurrent = step.status === 'in_progress';

                return (
                  <div
                    key={step.id}
                    className={`p-2.5 rounded-xl border transition flex items-start justify-between gap-2.5 ${
                      isDone
                        ? 'bg-black/60 border-zinc-900 text-zinc-400'
                        : isCurrent
                        ? 'bg-cyan-950/20 border-cyan-500/40 text-white shadow-sm shadow-cyan-950/20'
                        : 'bg-black/30 border-zinc-850/60 text-zinc-300'
                    }`}
                  >
                    {/* Status Toggle Icon */}
                    <button
                      type="button"
                      onClick={() => handleToggleStepStatus(step.id)}
                      className="mt-0.5 shrink-0 cursor-pointer transition active:scale-90"
                      title={isDone ? 'Mark Pending' : isCurrent ? 'Mark Completed' : 'Mark In Progress'}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : isCurrent ? (
                        <div className="w-4 h-4 rounded-full border-2 border-cyan-400 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        </div>
                      ) : (
                        <Circle className="w-4 h-4 text-zinc-600 hover:text-zinc-400" />
                      )}
                    </button>

                    {/* Step Title & Details */}
                    <div 
                      onClick={() => handleToggleStepStatus(step.id)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-semibold ${isDone ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>
                          {idx + 1}. {step.title}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[9px] font-mono font-bold animate-pulse">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      {step.description && (
                        <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">
                          {step.description}
                        </p>
                      )}
                      {step.completedAt && (
                        <span className="text-[9px] text-emerald-400 font-mono mt-0.5 block">
                          ✓ Completed at {step.completedAt}
                        </span>
                      )}
                    </div>

                    {/* Delete Step */}
                    <button
                      type="button"
                      onClick={() => handleDeleteStep(step.id)}
                      className="text-zinc-600 hover:text-rose-400 p-1 rounded transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Delete step"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add Step Form */}
            <form onSubmit={handleAddStep} className="pt-3 border-t border-zinc-900 flex items-center gap-2">
              <input
                type="text"
                value={newStepTitle}
                onChange={(e) => setNewStepTitle(e.target.value)}
                placeholder="Add milestone step (e.g. Implement AST Scanner)..."
                className="flex-1 bg-black border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-cyan-500 font-sans transition"
              />
              <button
                type="submit"
                disabled={!newStepTitle.trim()}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-black font-bold text-xs flex items-center gap-1 transition cursor-pointer active:scale-95 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
