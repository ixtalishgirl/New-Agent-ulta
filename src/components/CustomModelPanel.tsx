import { useEffect } from 'react';
import CustomModelPanelInner from './CustomModelPanelInner';
import { X } from 'lucide-react';

interface CustomModelPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function Wrapper({ isOpen, onClose }: CustomModelPanelProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Custom model panel"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-900/80 bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-900/70 px-5 py-4">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold text-white">Custom Models</h2>
            <p className="text-xs text-zinc-500">
              Add, remove, or replace any model endpoint. Pick one for the agent to use.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          <CustomModelPanelInner />
        </div>
      </div>
    </div>
  );
}

export { Wrapper as CustomModelPanel };
export default Wrapper;
