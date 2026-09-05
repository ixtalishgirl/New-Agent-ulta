import React, { useState } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Sparkles, 
  Bug, 
  Code2, 
  ExternalLink,
  Download,
  Info
} from 'lucide-react';
import { AttachedFile } from '../types';

interface ScreenshotModalProps {
  file: AttachedFile | null;
  onClose: () => void;
  onAction?: (actionPrompt: string) => void;
}

export const ScreenshotModal: React.FC<ScreenshotModalProps> = ({ file, onClose, onAction }) => {
  const [zoom, setZoom] = useState<number>(1);

  if (!file || !file.dataUrl) return null;

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  const handleTriggerAction = (promptText: string) => {
    if (onAction) {
      onAction(promptText);
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative flex flex-col w-full max-w-5xl h-[88vh] bg-black border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-850 bg-zinc-950/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400 shrink-0">
              <Code2 className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h3 className="text-sm font-bold text-white truncate">{file.name}</h3>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                <span>Screenshot Vision Perception</span>
                <span>•</span>
                <span>{typeof file.size === 'number' ? `${(file.size / 1024).toFixed(1)} KB` : (file.size || 'Image')}</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
              <button
                onClick={handleZoomOut}
                className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[10px] font-mono text-zinc-300 select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition cursor-pointer"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <a
              href={file.dataUrl}
              download={file.name}
              className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition cursor-pointer"
              title="Download image"
            >
              <Download className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition cursor-pointer"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Image Display Area */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/60 relative select-none">
          <img
            src={file.dataUrl}
            alt={file.name}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-100 ease-out"
          />
        </div>

        {/* Bottom Action Bar */}
        <div className="p-3.5 border-t border-zinc-850 bg-zinc-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Vision Quick Actions:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTriggerAction('Is screenshot me mojood error aur bugs ko diagnose karo aur exact fix batao.')}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Debug Screenshot Error</span>
            </button>

            <button
              onClick={() => handleTriggerAction('Is screenshot ke UI architecture aur components ko explain karo.')}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-cyan-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Explain Architecture</span>
            </button>

            <button
              onClick={() => handleTriggerAction('Is screenshot ko dekh kar complete standalone HTML + Tailwind CSS code pure Pitch Black AMOLED (#000000) theme me reconstruct karo.')}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-lg shadow-cyan-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Reconstruct in AMOLED</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
