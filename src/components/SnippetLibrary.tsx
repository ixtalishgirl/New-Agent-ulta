import React, { useState, useEffect } from 'react';
import {
  Code2,
  Plus,
  Trash2,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  X,
  FileCode,
} from 'lucide-react';

interface Snippet {
  id: string;
  title: string;
  language: string;
  code: string;
  createdAt: string;
}

export const SnippetLibrary: React.FC = () => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchSnippets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/snippets');
      const data = await res.json();
      if (data.success) setSnippets(data.snippets);
      else setError('Load failed');
    } catch (err: any) {
      setError(err.message || 'Failed to load snippets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnippets();
  }, []);

  const handleSave = async () => {
    if (!title.trim() || !code.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), language, code }),
      });
      const data = await res.json();
      if (data.success) {
        setSnippets((prev) => [data.snippet, ...prev]);
        setTitle('');
        setCode('');
        setShowAdd(false);
      } else {
        setError(data.error || 'Save failed');
      }
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/snippets/${id}`, { method: 'DELETE' });
      setSnippets((prev) => prev.filter((s) => s.id !== id));
    } catch {}
  };

  const handleCopy = async (s: Snippet) => {
    try {
      await navigator.clipboard.writeText(s.code);
      setCopiedId(s.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {}
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-extrabold text-white">Code Snippets</span>
          <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 text-[10px] font-mono">
            {snippets.length}
          </span>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
        >
          {showAdd ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showAdd ? 'Cancel' : 'New Snippet'}
        </button>
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {showAdd && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3 space-y-2.5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Snippet title..."
            className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-cyan-500"
          />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="bash">Bash</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="text">Text</option>
          </select>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your code here..."
            rows={6}
            className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-cyan-500 font-mono resize-y"
          />
          <button
            onClick={handleSave}
            disabled={saving || !title.trim() || !code.trim()}
            className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-extrabold text-xs transition cursor-pointer active:scale-95 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Code2 className="w-3.5 h-3.5" />}
            Save Snippet
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
      ) : snippets.length === 0 ? (
        <div className="text-center py-10 text-zinc-500 text-xs">
          <Code2 className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
          No snippets yet. Save your first reusable code!
        </div>
      ) : (
        snippets.map((s) => (
          <div key={s.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">
            <div
              className="p-3 flex items-center justify-between cursor-pointer hover:bg-zinc-900/50 transition"
              onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] font-mono font-bold shrink-0">
                  {s.language}
                </span>
                <span className="text-xs font-bold text-white truncate">{s.title}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); handleCopy(s); }}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 transition cursor-pointer"
                  title="Copy code"
                >
                  {copiedId === s.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-zinc-800 transition cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {expandedId === s.id && (
              <pre className="px-3 pb-3 text-[11px] font-mono text-zinc-300 whitespace-pre-wrap break-all max-h-64 overflow-y-auto border-t border-zinc-900 pt-2 mx-3 mb-3">
                {s.code}
              </pre>
            )}
          </div>
        ))
      )}
    </div>
  );
};
