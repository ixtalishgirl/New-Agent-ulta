import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Loader2, 
  RefreshCw, 
  Terminal, 
  Sparkles,
  Check
} from 'lucide-react';

interface BugBountyModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  onApplyFix?: (fixedCode: string) => void;
  onRunTerminalCommand: (cmd: string) => void;
}

interface AuditData {
  success: boolean;
  status: 'EXCELLENT' | 'PASSING' | 'NEEDS_FIXES' | 'FAILED';
  score: number;
  total_issues: number;
  total_warnings: number;
  issues: string[];
  warnings: string[];
  strengths: string[];
  summary: string;
}

export const BugBountyModal: React.FC<BugBountyModalProps> = ({
  isOpen,
  onClose,
  code,
  onApplyFix,
  onRunTerminalCommand,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunAudit = async () => {
    setIsRunning(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/tools/bug-bounty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.success) {
        setAuditResult(data);
      } else {
        setErrorMsg(data.error || 'Audit analysis could not complete.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Audit service failed to connect');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 selection:bg-cyan-500 selection:text-black">
      <div className="max-w-2xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Ambient Glow */}
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center text-emerald-400 shadow-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Autonomous Bug Hunter & AST Auditor
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Deep static analysis for unclosed tags, script errors, broken links, and syntax regressions.
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

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6 text-xs">
          
          {/* Action Callout */}
          {!auditResult && !isRunning && (
            <div className="p-6 rounded-2xl bg-black border border-zinc-850 text-center space-y-4">
              <div className="text-zinc-300 text-sm leading-relaxed max-w-md mx-auto">
                Scan your current project's code (<code className="text-cyan-400 font-mono">{Math.round(code.length / 1024)} KB</code>) against HTML5 standards, unclosed tags, JavaScript syntax errors, and responsiveness.
              </div>
              <button
                onClick={handleRunAudit}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95 flex items-center justify-center gap-2 mx-auto"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Run Autonomous Bug Bounty Now</span>
              </button>
            </div>
          )}

          {isRunning && (
            <div className="p-12 rounded-2xl bg-black border border-zinc-850 text-center space-y-4">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
              <div className="font-mono text-zinc-300 text-xs">
                Executing AST audit via <code className="text-cyan-400">power_bug_bounty.py</code>...
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/50 text-rose-400">
              {errorMsg}
            </div>
          )}

          {auditResult && (
            <div className="space-y-6">
              {/* Score Metric Card */}
              <div className="p-5 rounded-2xl bg-black border border-zinc-850 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Health Score</div>
                  <div className="text-3xl font-black font-mono text-white mt-1 flex items-center gap-2">
                    <span className={auditResult.score >= 90 ? 'text-emerald-400' : auditResult.score >= 70 ? 'text-amber-400' : 'text-rose-400'}>
                      {auditResult.score} / 100
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 font-sans font-bold text-zinc-300">
                      {auditResult.status}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleRunAudit}
                  className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                  title="Re-run audit"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-mono">Re-audit</span>
                </button>
              </div>

              {/* Strengths */}
              {auditResult.strengths && auditResult.strengths.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified Validations ({auditResult.strengths.length})
                  </div>
                  <div className="space-y-1.5">
                    {auditResult.strengths.map((s, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-black border border-zinc-900 text-zinc-300 flex items-center gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Issues / Bugs */}
              {auditResult.issues && auditResult.issues.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Critical Issues Detected ({auditResult.issues.length})
                  </div>
                  <div className="space-y-1.5">
                    {auditResult.issues.map((issue, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-900/40 text-rose-300">
                        {issue}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {auditResult.warnings && auditResult.warnings.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                    Warnings & Improvements ({auditResult.warnings.length})
                  </div>
                  <div className="space-y-1.5">
                    {auditResult.warnings.map((w, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-black border border-zinc-900 text-zinc-400">
                        ⚠ {w}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-900 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-zinc-500 font-mono">
            CLI: <code className="text-cyan-400">python3 halye_powers/power_bug_bounty.py</code>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs transition cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
