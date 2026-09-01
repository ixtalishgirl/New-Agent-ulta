import { useState } from "react";
import { Check, Copy, Save } from "lucide-react";

interface MarkdownProps {
  content: string;
  className?: string;
  onSaveFile?: (filename: string, code: string) => void;
}

interface CodeBlock {
  lang: string;
  code: string;
  filename: string;
}

function extractCodeBlocks(text: string): Array<{ type: "text" | "code"; value: string; meta?: CodeBlock }> {
  const parts: Array<{ type: "text" | "code"; value: string; meta?: CodeBlock }> = [];
  const regex = /```([\w./-]*)\n?([\s\S]*?)```/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: "text", value: text.slice(last, match.index) });
    }

    const lang = match[1]?.trim() ?? "";
    const code = match[2] ?? "";

    let filename = "";
    if (lang.includes(".")) {
      filename = lang;
    } else {
      const commentMatch = code.match(/^(?:\/\/|#|<!--)\s*([\w./-]+\.\w+)/);
      if (commentMatch) filename = commentMatch[1];
      else {
        const extMap: Record<string, string> = {
          javascript: "js", js: "js", typescript: "ts", ts: "ts",
          python: "py", py: "py", html: "html", css: "css",
          json: "json", bash: "sh", sh: "sh", php: "php",
          rust: "rs", go: "go", java: "java", cpp: "cpp", c: "c",
        };
        const ext = extMap[lang.toLowerCase()] ?? "txt";
        filename = `code.${ext}`;
      }
    }

    parts.push({ type: "code", value: match[0], meta: { lang, code, filename } });
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push({ type: "text", value: text.slice(last) });
  }

  return parts;
}

function renderText(text: string): string {
  return text
    // Images — must come before links
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg border-2 border-white/60 my-2 shadow-md" style="max-height:480px;object-fit:contain" />')
    // Screenshot paths from agent output (bare /api/screenshots/... or /tmp/...screenshots/...)
    .replace(/\/api\/screenshots\/([\w.\-]+\.(?:png|jpg|jpeg))/gi,
      '<img src="/api/screenshots/$1" alt="screenshot" class="max-w-full rounded-lg border-2 border-white/60 my-2 shadow-md cursor-pointer" style="max-height:480px;object-fit:contain" onclick="window.open(this.src,\'_blank\')" />')
    .replace(/`([^`]+)`/g, '<code class="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-white text-xs font-mono">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em class="text-zinc-200 italic">$1</em>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-white mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-white mt-4 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-extrabold text-white mt-4 mb-2">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-white">$1</li>')
    .replace(/\n/g, "<br />");
}

function CodeBlockView({ meta, onSave }: { meta: CodeBlock; onSave?: (filename: string, code: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(meta.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(meta.filename, meta.code);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="my-3 rounded-md border border-white/40 overflow-hidden bg-black shadow-lg">
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-950 border-b border-white/30">
        <span className="text-xs font-mono text-zinc-300">
          {meta.filename || meta.lang || "code"}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            data-testid="button-copy-code"
          >
            {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
            {copied ? "Copied" : "Copy"}
          </button>
          {onSave && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              data-testid="button-save-file"
            >
              {saved ? <Check size={11} /> : <Save size={11} />}
              {saved ? "Saved" : "Save"}
            </button>
          )}
        </div>
      </div>
      <pre className="bg-black p-4 overflow-x-auto font-mono text-sm text-white whitespace-pre">
        <code className="text-white">{meta.code}</code>
      </pre>
    </div>
  );
}

function renderAgentTags(text: string): string {
  // Highlight <EXECUTE>, <PYTHON>, <WRITE_FILE>, <DONE> tags visually
  return text
    .replace(/<EXECUTE>([\s\S]*?)<\/EXECUTE>/g,
      '<div class="my-2 rounded border border-cyan-500/30 bg-cyan-500/5 overflow-hidden"><div class="px-2 py-1 bg-cyan-500/15 text-cyan-400 text-[11px] font-mono font-bold">⚡ EXECUTE</div><pre class="px-3 py-2 text-xs font-mono text-cyan-200 whitespace-pre-wrap overflow-x-auto">$1</pre></div>')
    .replace(/<PYTHON>([\s\S]*?)<\/PYTHON>/g,
      '<div class="my-2 rounded border border-yellow-500/30 bg-yellow-500/5 overflow-hidden"><div class="px-2 py-1 bg-yellow-500/15 text-yellow-400 text-[11px] font-mono font-bold">🐍 PYTHON</div><pre class="px-3 py-2 text-xs font-mono text-yellow-200 whitespace-pre-wrap overflow-x-auto">$1</pre></div>')
    .replace(/<WRITE_FILE>([\s\S]*?)<\/WRITE_FILE>/g,
      '<div class="my-2 rounded border border-violet-500/30 bg-violet-500/5 overflow-hidden"><div class="px-2 py-1 bg-violet-500/15 text-violet-400 text-[11px] font-mono font-bold">📁 WRITE_FILE</div><pre class="px-3 py-2 text-xs font-mono text-violet-200 whitespace-pre-wrap overflow-x-auto">$1</pre></div>')
    .replace(/<DONE>([\s\S]*?)<\/DONE>/g,
      '<div class="my-2 rounded border border-green-500/40 bg-green-500/10 px-3 py-2 text-green-400 font-bold text-sm">✅ DONE: $1</div>');
}

function ExecResultBlock({ content }: { content: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="my-2 rounded border border-orange-500/30 bg-orange-500/5 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 text-orange-400 text-[11px] font-mono font-bold hover:bg-orange-500/20 transition-colors text-left"
      >
        <span>⚡ EXECUTION RESULT</span>
        <span className="ml-auto">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <pre className="px-3 py-2 text-xs font-mono text-orange-200/80 whitespace-pre-wrap overflow-x-auto max-h-64">
          {content}
        </pre>
      )}
    </div>
  );
}

export function Markdown({ content, className = "", onSaveFile }: MarkdownProps) {
  // Split out execution result blocks first
  const segments: Array<{ type: "exec" | "normal"; value: string }> = [];
  const execRe = /\[⚡ EXECUTION RESULT[^\]]*\]\n```\n([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = execRe.exec(content)) !== null) {
    if (m.index > last) segments.push({ type: "normal", value: content.slice(last, m.index) });
    segments.push({ type: "exec", value: m[1] });
    last = m.index + m[0].length;
  }
  if (last < content.length) segments.push({ type: "normal", value: content.slice(last) });

  return (
    <div className={`prose prose-invert prose-p:leading-relaxed max-w-none ${className}`}>
      {segments.map((seg, si) => {
        if (seg.type === "exec") {
          return <ExecResultBlock key={si} content={seg.value} />;
        }
        // Apply agent tag rendering then code blocks
        const tagRendered = renderAgentTags(seg.value);
        // If renderAgentTags changed something, render as HTML
        if (tagRendered !== seg.value) {
          return <span key={si} dangerouslySetInnerHTML={{ __html: tagRendered }} />;
        }
        const parts = extractCodeBlocks(seg.value);
        return (
          <span key={si}>
            {parts.map((part, i) =>
              part.type === "code" && part.meta ? (
                <CodeBlockView key={i} meta={part.meta} onSave={onSaveFile} />
              ) : (
                <span key={i} dangerouslySetInnerHTML={{ __html: renderText(part.value) }} />
              )
            )}
          </span>
        );
      })}
    </div>
  );
}
