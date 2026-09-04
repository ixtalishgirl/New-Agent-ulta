import React, { useState } from 'react';
import { 
  GitBranch, 
  Paperclip
} from 'lucide-react';
import { HalyeStudio } from './components/HalyeStudio';
import { AttachedAssetsModal, AttachedAsset } from './components/AttachedAssetsModal';
import { GithubModal } from './components/GithubModal';

export default function App() {
  const [isGithubOpen, setIsGithubOpen] = useState(false);
  const [isAssetsOpen, setIsAssetsOpen] = useState(false);
  const [builderCode, setBuilderCode] = useState<string | undefined>(undefined);
  const [connectedRepo, setConnectedRepo] = useState<string | undefined>(undefined);
  const [attachedAssetsCount, setAttachedAssetsCount] = useState<number>(1);

  // When user imports code from GitHub or rebuilds from an Attached Asset
  const handleLoadCodeIntoBuilder = (code: string) => {
    setBuilderCode(code);
  };

  const handleSelectAssetForAgent = (asset: AttachedAsset) => {
    console.log('Selected asset for Halye agent:', asset.name);
  };

  return (
    <div id="halye-app-root" className="flex flex-col h-screen w-screen bg-black text-zinc-100 overflow-hidden select-none">
      {/* ============================================================ */}
      {/* TOP HEADER: Pure Pitch Black AMOLED, GitHub & Attached Assets */}
      {/* ============================================================ */}
      <header id="main-app-header" className="h-13 bg-black border-b border-zinc-900 px-4 sm:px-5 flex items-center justify-between shrink-0 z-30">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-cyan-400 text-sm shadow-inner">
            H
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-extrabold tracking-tight text-white">Halye AI</h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Autonomous Agent
            </span>
          </div>
        </div>

        {/* Center: Autonomous Powers Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Linux Shell • Python 3.11 • Pip 23 • God-Level Vision</span>
        </div>

        {/* Right: GitHub & Attached Assets */}
        <div className="flex items-center gap-2">
          {/* GitHub Option */}
          <button
            id="header-github-btn"
            onClick={() => setIsGithubOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-zinc-800 active:scale-95"
            title="Connect GitHub repository"
          >
            <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
            <span>{connectedRepo ? connectedRepo.split('/')[1] || 'GitHub' : 'GitHub'}</span>
          </button>

          {/* Attached Assets Option */}
          <button
            id="header-attached-assets-btn"
            onClick={() => setIsAssetsOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
            title="Attached screenshots and UI assets"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>Attached Assets</span>
            {attachedAssetsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-black text-cyan-300 text-[10px] font-mono font-bold">
                {attachedAssetsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ============================================================ */}
      {/* MAIN UNIFIED WORKSPACE: Halye Studio                         */}
      {/* ============================================================ */}
      <main id="app-workspace-canvas" className="flex-1 overflow-hidden relative">
        <HalyeStudio
          initialCode={builderCode}
          connectedRepoName={connectedRepo}
          attachedAssetsCount={attachedAssetsCount}
          onOpenGithub={() => setIsGithubOpen(true)}
          onOpenAssets={() => setIsAssetsOpen(true)}
        />
      </main>

      {/* ============================================================ */}
      {/* MODALS: GitHub Connector & Attached Assets Inspector         */}
      {/* ============================================================ */}
      <GithubModal
        isOpen={isGithubOpen}
        onClose={() => setIsGithubOpen(false)}
        onImportCodeToBuilder={(code, filename) => {
          handleLoadCodeIntoBuilder(code);
        }}
        onRepoConnected={(repoName) => {
          setConnectedRepo(repoName);
        }}
      />

      <AttachedAssetsModal
        isOpen={isAssetsOpen}
        onClose={() => setIsAssetsOpen(false)}
        onSelectAssetForAgent={handleSelectAssetForAgent}
        onReconstructWithAsset={(asset) => {
          console.log('Reconstructing with asset:', asset.name);
        }}
        onAssetsUpdated={(count) => setAttachedAssetsCount(count)}
      />
    </div>
  );
}
