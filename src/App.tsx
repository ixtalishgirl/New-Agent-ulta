import React, { useState, useEffect } from 'react';
import { 
  Paperclip,
  Cpu
} from 'lucide-react';
import { HalyeStudio } from './components/HalyeStudio';
import { AttachedAssetsModal, AttachedAsset } from './components/AttachedAssetsModal';
import { GithubModal } from './components/GithubModal';
import { LangChainAdminModal } from './components/LangChainAdminModal';
import { ProjectProgressTracker } from './components/ProjectProgressTracker';
import { ProjectScope } from './types';

const INITIAL_PROJECT_SCOPE: ProjectScope = {
  id: 'halye-scope-v1',
  title: 'Halye Full-Scale Continuous Engine',
  activeTask: 'LangChain Autonomous Tool Calling & Raw Superuser Access',
  percentage: 100,
  steps: [
    {
      id: 'step-1',
      title: 'Halye Noor Protocol & Multi-Turn Persistent State',
      description: 'Zero lecture, absolute obedience, multi-turn localStorage memory lock',
      status: 'completed',
      completedAt: '14:28:10',
    },
    {
      id: 'step-2',
      title: 'Linux Container Tooling (Bash, Python 3.11, Pip 23)',
      description: 'Direct shell execution, Playwright touch, self-healing exception handlers',
      status: 'completed',
      completedAt: '14:29:05',
    },
    {
      id: 'step-3',
      title: 'Visual Progress Tracker in Header with Scope Roadmap',
      description: 'Active task display, animated percentage bar, and interactive step checklist',
      status: 'completed',
      completedAt: '14:32:00',
    },
    {
      id: 'step-4',
      title: 'Real-Time Action History (Thoughts, Files Read/Edited)',
      description: 'Exact matching to user screenshots with Full View process trace',
      status: 'completed',
      completedAt: '14:33:15',
    },
    {
      id: 'step-5',
      title: 'Massive Codebase Reader & AST Diagnostics Engine',
      description: 'Audit lakhon lines of code, report jo mila (issues) and jo kiya (fixes)',
      status: 'completed',
      completedAt: '14:35:20',
    },
    {
      id: 'step-6',
      title: 'LangChain Agentic Brain & Autonomous Tool Arsenal',
      description: 'AgentExecutor (verbose=True), ConversationBufferMemory, web_search, file_system, API, terminal',
      status: 'completed',
      completedAt: '16:05:00',
    },
  ],
};

export default function App() {
  const [isGithubOpen, setIsGithubOpen] = useState(false);
  const [isAssetsOpen, setIsAssetsOpen] = useState(false);
  const [isLangChainOpen, setIsLangChainOpen] = useState(false);
  const [builderCode, setBuilderCode] = useState<string | undefined>(undefined);
  const [connectedRepo, setConnectedRepo] = useState<string | undefined>(undefined);
  const [attachedAssetsCount, setAttachedAssetsCount] = useState<number>(1);

  // Persistent Project Scope State
  const [projectScope, setProjectScope] = useState<ProjectScope>(() => {
    try {
      const saved = localStorage.getItem('halye_project_scope');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.steps)) return parsed;
      }
    } catch (e) {}
    return INITIAL_PROJECT_SCOPE;
  });

  useEffect(() => {
    try {
      localStorage.setItem('halye_project_scope', JSON.stringify(projectScope));
    } catch (e) {}
  }, [projectScope]);

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
      {/* TOP HEADER: Clean Pitch Black AMOLED & Visual Progress Tracker */}
      {/* ============================================================ */}
      <header id="main-app-header" className="h-13 bg-black border-b border-zinc-900 px-3 sm:px-5 flex items-center justify-between shrink-0 z-30 gap-2">
        {/* Brand & Identity */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-cyan-400 text-sm shadow-inner">
            H
          </div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-extrabold tracking-tight text-white hidden sm:block">Halye AI</h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Autonomous
            </span>
          </div>
        </div>

        {/* Center: Visual Progress Tracker in Header */}
        <div className="flex-1 max-w-xl mx-2 flex justify-center">
          <ProjectProgressTracker 
            scope={projectScope} 
            onUpdateScope={setProjectScope} 
          />
        </div>

        {/* Right: Attached Assets & LangChain Superuser Admin */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="header-langchain-admin-btn"
            onClick={() => setIsLangChainOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
            title="LangChain Agentic Brain & Autonomous Tool Console"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">LangChain Brain</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          <button
            id="header-attached-assets-btn"
            onClick={() => setIsAssetsOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
            title="Attached screenshots and UI assets"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Attached Assets</span>
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
          projectScope={projectScope}
          onUpdateProjectScope={setProjectScope}
        />
      </main>

      {/* ============================================================ */}
      {/* MODALS: GitHub Connector, Attached Assets & LangChain Console */}
      {/* ============================================================ */}
      <GithubModal
        isOpen={isGithubOpen}
        onClose={() => setIsGithubOpen(false)}
        onImportCodeToBuilder={(code) => {
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

      <LangChainAdminModal
        isOpen={isLangChainOpen}
        onClose={() => setIsLangChainOpen(false)}
      />
    </div>
  );
}
