import React, { useState } from 'react';
import { 
  GitBranch, 
  Folder, 
  FileCode, 
  Star, 
  GitFork, 
  Download, 
  Check, 
  Loader2, 
  X,
  Search,
  Code
} from 'lucide-react';

interface GithubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCodeToBuilder: (code: string, filename?: string) => void;
  onRepoConnected?: (repoName: string) => void;
}

export const GithubModal: React.FC<GithubModalProps> = ({
  isOpen,
  onClose,
  onImportCodeToBuilder,
  onRepoConnected,
}) => {
  const [repoInput, setRepoInput] = useState('tailwindlabs/tailwindcss');
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [repoData, setRepoData] = useState<any>(null);
  const [tree, setTree] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [imported, setImported] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleConnectRepo = async () => {
    if (!repoInput.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setSelectedFile(null);

    try {
      const res = await fetch('/api/github/repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: repoInput.trim(),
          token: tokenInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to load GitHub repository');
      }

      setRepoData(data.repo);
      setTree(data.tree || []);
      if (onRepoConnected && data.repo?.fullName) {
        onRepoConnected(data.repo.fullName);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFile = async (path: string) => {
    try {
      const res = await fetch('/api/github/repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: repoInput.trim(),
          token: tokenInput.trim() || undefined,
          path,
        }),
      });

      const data = await res.json();
      if (data.success && data.content) {
        setSelectedFile({ path, content: data.content });
      }
    } catch (err) {
      console.error('File load failed:', err);
    }
  };

  const handleImport = () => {
    if (!selectedFile) return;
    onImportCodeToBuilder(selectedFile.content, selectedFile.path);
    setImported(true);
    setTimeout(() => {
      setImported(false);
      onClose();
    }, 1200);
  };

  const filteredTree = tree.filter((item) =>
    item.path?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div 
      id="github-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        id="github-modal-dialog"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                GitHub Repository Connector
                {repoData && (
                  <span className="px-2 py-0.5 text-xs font-mono rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Connected
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">Connect any repository to pull source codes directly into your Live App.</p>
            </div>
          </div>
          <button 
            id="close-github-modal-btn"
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px] flex items-center bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-slate-500 font-mono mr-1.5">github.com/</span>
            <input
              id="github-repo-input"
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="owner/repository (e.g. facebook/react)"
              className="flex-1 bg-transparent text-slate-200 outline-none font-mono"
              onKeyDown={(e) => e.key === 'Enter' && handleConnectRepo()}
            />
          </div>

          <div className="w-48">
            <input
              id="github-token-input"
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Personal Token (Optional)"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none"
            />
          </div>

          <button
            id="github-connect-btn"
            onClick={handleConnectRepo}
            disabled={loading || !repoInput.trim()}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm shrink-0"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitBranch className="w-3.5 h-3.5" />}
            <span>{loading ? 'Connecting...' : 'Connect Repo'}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="px-6 py-2 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-hidden grid md:grid-cols-12">
          {/* File Tree Column */}
          <div className="md:col-span-5 border-r border-slate-800 flex flex-col bg-slate-950/40 p-4 space-y-3 overflow-hidden">
            {repoData ? (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                  <span className="font-bold text-white truncate">{repoData.fullName}</span>
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-400" /> {repoData.stars}</span>
                    <span className="flex items-center gap-0.5"><GitFork className="w-3 h-3 text-cyan-400" /> {repoData.forks}</span>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filter files..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 outline-none"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 font-mono text-xs pr-1">
                  {filteredTree.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => item.type === 'blob' && handleSelectFile(item.path)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 truncate transition cursor-pointer ${
                        selectedFile?.path === item.path
                          ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {item.type === 'tree' ? (
                        <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      )}
                      <span className="truncate">{item.path}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-600">
                <GitBranch className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-xs font-semibold text-slate-400">No Repo Loaded</p>
                <p className="text-[11px] text-slate-500 mt-1">Enter a GitHub repository name above and click Connect.</p>
              </div>
            )}
          </div>

          {/* Code Viewer Column */}
          <div className="md:col-span-7 flex flex-col bg-slate-950 p-4 space-y-3 overflow-hidden">
            {selectedFile ? (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                  <span className="font-mono text-cyan-400 font-semibold truncate max-w-[280px]">
                    {selectedFile.path}
                  </span>
                  <button
                    id="import-github-code-btn"
                    onClick={handleImport}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    {imported ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Download className="w-3.5 h-3.5" />}
                    <span>{imported ? 'Imported to Live App!' : 'Import to Live App'}</span>
                  </button>
                </div>

                <div className="flex-1 overflow-auto bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre selection:bg-cyan-500/30">
                  {selectedFile.content}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-600">
                <Code className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-xs font-semibold text-slate-400">Select a file from the repository tree</p>
                <p className="text-[11px] text-slate-500 mt-1">You can preview raw code and directly import it into the Live Builder.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
