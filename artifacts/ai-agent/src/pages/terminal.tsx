import { useState, useRef, useEffect } from "react";
import { useRunCommand } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Terminal as TerminalIcon,
  Trash2,
  ChevronRight,
  Play,
  Zap,
  FolderOpen,
  FileCode,
} from "lucide-react";

interface TerminalLine {
  type: "input" | "stdout" | "stderr" | "info" | "success";
  text: string;
  ts?: string;
}

const PYTHON = "/home/runner/workspace/.pythonlibs/bin/python3";
const CHROMIUM = "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium";

const QUICK_CMDS = [
  { label: "📂 ls files",      cmd: "ls -la /tmp/haley-workspace/" },
  { label: "🐍 Python ver",    cmd: `${PYTHON} --version && ${PYTHON} -c "import playwright; print('playwright: OK')"` },
  { label: "🌐 Test Browser",  cmd: `${PYTHON} haley_god_agent.py --test` },
  { label: "🐜 GOD AGENT",    cmd: `${PYTHON} haley_god_agent.py` },
  { label: "🧠 Memory",        cmd: `${PYTHON} haley_god_agent.py --memory` },
  { label: "📥 Install deps",  cmd: `${PYTHON} -m pip install playwright httpx replicate 2>&1 | tail -5` },
  { label: "📋 List agents",   cmd: "ls -lh /tmp/haley-workspace/*.py 2>/dev/null" },
  { label: "🗑️ Clear memory", cmd: "rm -f /tmp/haley-workspace/god_memory.json && echo '✅ Memory cleared'" },
];

export default function TerminalPage() {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: "info", text: "╔══════════════════════════════════════╗" },
    { type: "info", text: "║  🔥 HALEY'S GOD-MODE TERMINAL        ║" },
    { type: "info", text: "║  All commands allowed. No limits.    ║" },
    { type: "info", text: "╚══════════════════════════════════════╝" },
    { type: "info", text: "" },
    { type: "success", text: "✅ Working dir: /tmp/haley-workspace" },
    { type: "info", text: "📌 Quick buttons ↑ ya command type karo" },
  ]);
  const [command, setCommand] = useState("");
  const [cwd, setCwd] = useState("/tmp/haley-workspace");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const runCommand = useRunCommand();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const now = () => new Date().toLocaleTimeString("en-GB", { hour12: false });

  const addLines = (newLines: TerminalLine[]) => {
    setLines((prev) => [...prev, ...newLines]);
  };

  const runCmd = (cmd: string) => {
    if (!cmd.trim()) return;
    const trimmed = cmd.trim();

    addLines([{ type: "input", text: `${cwd} $ ${trimmed}`, ts: now() }]);
    setHistory((prev) => [trimmed, ...prev.slice(0, 99)]);
    setHistIdx(-1);
    setCommand("");

    if (trimmed === "clear" || trimmed === "cls") {
      setLines([{ type: "success", text: "Terminal cleared. 🧹" }]);
      return;
    }

    if (trimmed.startsWith("cd ")) {
      const dir = trimmed.slice(3).trim();
      const next = dir.startsWith("/") ? dir : `${cwd}/${dir}`;
      setCwd(next);
      addLines([{ type: "success", text: `📂 cd → ${next}` }]);
      return;
    }

    runCommand.mutate(
      { data: { command: trimmed, cwd } },
      {
        onSuccess: (result) => {
          const out: TerminalLine[] = [];
          if (result.stdout) {
            result.stdout
              .split("\n")
              .filter((l: string) => l !== "")
              .forEach((l: string) => out.push({ type: "stdout", text: l }));
          }
          if (result.stderr) {
            result.stderr
              .split("\n")
              .filter((l: string) => l !== "")
              .forEach((l: string) => out.push({ type: "stderr", text: l }));
          }
          if (result.exitCode === 0 && !result.stdout && !result.stderr) {
            out.push({ type: "success", text: "✅ Done (exit 0)" });
          }
          if (result.exitCode !== 0) {
            out.push({ type: "stderr", text: `⚠️ Exit code: ${result.exitCode}` });
          }
          addLines(out);
        },
        onError: () => {
          addLines([{ type: "stderr", text: "❌ Command execution failed." }]);
        },
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runCmd(command);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const idx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(idx);
      setCommand(history[idx] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const idx = Math.max(histIdx - 1, -1);
      setHistIdx(idx);
      setCommand(idx === -1 ? "" : history[idx] ?? "");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center px-4 justify-between bg-[#111] shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon size={15} className="text-green-400" />
          <span className="font-mono font-semibold text-sm text-green-400">GOD TERMINAL</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-green-500/10 text-green-400 border border-green-500/20">
            NO LIMITS
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700 ml-1 max-w-[160px] truncate">
            <FolderOpen size={9} className="inline mr-1" />
            {cwd}
          </span>
        </div>
        <button
          className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          onClick={() => setLines([{ type: "success", text: "🧹 Terminal cleared." }])}
          title="Clear terminal"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Quick command buttons */}
      <div className="flex gap-1.5 px-3 py-2 bg-[#111] border-b border-border shrink-0 overflow-x-auto flex-nowrap">
        {QUICK_CMDS.map((q) => (
          <button
            key={q.label}
            onClick={() => runCmd(q.cmd)}
            disabled={runCommand.isPending}
            className="shrink-0 px-2.5 py-1 rounded text-[11px] font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 hover:border-green-500/40 hover:text-green-400 transition-colors disabled:opacity-40 whitespace-nowrap"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-[13px] space-y-0.5 cursor-text"
        onClick={() => inputRef.current?.focus()}
        style={{ background: "#0d0d0d" }}
      >
        {lines.map((line, i) => (
          <div
            key={i}
            className={
              line.type === "input"
                ? "text-cyan-400 flex gap-2"
                : line.type === "stderr"
                ? "text-red-400"
                : line.type === "success"
                ? "text-green-400"
                : line.type === "info"
                ? "text-zinc-500"
                : "text-zinc-200"
            }
          >
            {line.type === "input" && (
              <span className="text-zinc-600 text-[11px] shrink-0 pt-0.5">{line.ts}</span>
            )}
            <span className="whitespace-pre-wrap break-all">{line.text}</span>
          </div>
        ))}
        {runCommand.isPending && (
          <div className="text-yellow-400 animate-pulse flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
            Running...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 bg-[#111] shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <ChevronRight size={14} className="text-green-400 shrink-0" />
          <input
            ref={inputRef}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Koi bhi command — no restrictions..."
            className="flex-1 font-mono text-sm bg-transparent text-zinc-200 placeholder:text-zinc-600 border-0 outline-none focus:outline-none h-8"
            disabled={runCommand.isPending}
            data-testid="input-terminal-command"
            autoFocus
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={runCommand.isPending || !command.trim()}
            className="h-8 px-3 rounded text-xs font-mono bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/30 transition-colors disabled:opacity-40 flex items-center gap-1.5"
            data-testid="button-run-command"
          >
            <Play size={11} />
            Run
          </button>
        </form>
      </div>
    </div>
  );
}
