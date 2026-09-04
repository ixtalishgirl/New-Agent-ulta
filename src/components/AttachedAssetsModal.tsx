import React, { useState, useEffect } from 'react';
import { 
  Paperclip, 
  Upload, 
  Camera, 
  Trash2, 
  ExternalLink, 
  Check, 
  Sparkles, 
  X, 
  Image as ImageIcon,
  Loader2,
  Eye,
  ArrowRight
} from 'lucide-react';

export interface AttachedAsset {
  id: string;
  name: string;
  type: 'screenshot' | 'image' | 'code' | 'url';
  dataUrl?: string;
  url?: string;
  notes?: string;
  createdAt: string;
}

interface AttachedAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAssetForAgent: (asset: AttachedAsset) => void;
  onReconstructWithAsset: (asset: AttachedAsset) => void;
  onAssetsUpdated?: (count: number) => void;
}

export const AttachedAssetsModal: React.FC<AttachedAssetsModalProps> = ({
  isOpen,
  onClose,
  onSelectAssetForAgent,
  onReconstructWithAsset,
  onAssetsUpdated,
}) => {
  const [assets, setAssets] = useState<AttachedAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isCapturingUrl, setIsCapturingUrl] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AttachedAsset | null>(null);
  const [visionAnalysis, setVisionAnalysis] = useState<string | null>(null);
  const [isAnalyzingVision, setIsAnalyzingVision] = useState(false);

  // Load assets from server
  const loadAssets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/assets');
      const data = await res.json();
      if (data.success && data.assets) {
        setAssets(data.assets);
        if (onAssetsUpdated) {
          onAssetsUpdated(data.assets.length);
        }
        if (data.assets.length > 0 && !selectedAsset) {
          setSelectedAsset(data.assets[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load assets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAssets();
    }
  }, [isOpen]);

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch('/api/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            type: 'image',
            dataUrl: base64,
            notes: `Uploaded UI asset (${(file.size / 1024).toFixed(1)} KB)`,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setAssets((prev) => [data.asset, ...prev]);
          setSelectedAsset(data.asset);
          if (onAssetsUpdated) onAssetsUpdated(assets.length + 1);
        }
      } catch (err) {
        console.error('Error saving asset:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle URL screenshot capture
  const handleCaptureUrl = async () => {
    if (!urlInput.trim()) return;
    setIsCapturingUrl(true);

    try {
      const res = await fetch(`/api/screenshot?url=${encodeURIComponent(urlInput.trim())}`);
      const data = await res.json();
      if (data.screenshotUrl) {
        const saveRes = await fetch('/api/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Screenshot: ${urlInput.replace(/^https?:\/\//, '').slice(0, 25)}`,
            type: 'screenshot',
            url: data.url || urlInput,
            dataUrl: data.screenshotUrl,
            notes: `Live website capture of ${data.url || urlInput}`,
          }),
        });
        const savedData = await saveRes.json();
        if (savedData.success) {
          setAssets((prev) => [savedData.asset, ...prev]);
          setSelectedAsset(savedData.asset);
          setUrlInput('');
          if (onAssetsUpdated) onAssetsUpdated(assets.length + 1);
        }
      }
    } catch (err) {
      console.error('Error capturing screenshot:', err);
    } finally {
      setIsCapturingUrl(false);
    }
  };

  // Handle Delete asset
  const handleDeleteAsset = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/assets/${id}`, { method: 'DELETE' });
      setAssets((prev) => prev.filter((a) => a.id !== id));
      if (selectedAsset?.id === id) {
        setSelectedAsset(null);
        setVisionAnalysis(null);
      }
      if (onAssetsUpdated) onAssetsUpdated(assets.length - 1);
    } catch (err) {
      console.error('Failed to delete asset:', err);
    }
  };

  // Analyze active asset with AI Vision
  const handleAnalyzeVision = async () => {
    if (!selectedAsset || isAnalyzingVision) return;
    setIsAnalyzingVision(true);
    setVisionAnalysis(null);

    try {
      const imagePayload = selectedAsset.dataUrl || selectedAsset.url;
      const res = await fetch('/api/gemini/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePayload,
          prompt: `Analyze this attached UI asset (${selectedAsset.name}):
1. Component breakdown (navbars, cards, buttons, heroes)
2. Color scheme & Tailwind style guide
3. Exact recommendations for Halye to build this live in the builder.`,
        }),
      });

      const data = await res.json();
      if (data.analysis) {
        setVisionAnalysis(data.analysis);
      }
    } catch (err: any) {
      setVisionAnalysis(`Vision analysis error: ${err.message}`);
    } finally {
      setIsAnalyzingVision(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      id="attached-assets-overlay"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        id="attached-assets-dialog"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Paperclip className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Attached Assets & Screenshots
                <span className="px-2 py-0.5 text-xs font-mono rounded-full bg-cyan-500/20 text-cyan-300">
                  {assets.length} items
                </span>
              </h3>
              <p className="text-xs text-slate-400">Attach screenshots, UI mockups, or URLs for Halye to analyze and rebuild.</p>
            </div>
          </div>
          <button 
            id="close-assets-modal-btn"
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid md:grid-cols-12 gap-6">
          {/* Left Column: Upload / Add / List */}
          <div className="md:col-span-5 space-y-4 flex flex-col">
            {/* Capture Live Website URL */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <label className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-cyan-400" /> Capture Website Screenshot
              </label>
              <div className="flex gap-2">
                <input
                  id="asset-url-input"
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCaptureUrl()}
                  placeholder="https://example.com"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                />
                <button
                  id="asset-capture-url-btn"
                  onClick={handleCaptureUrl}
                  disabled={isCapturingUrl || !urlInput.trim()}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1 transition cursor-pointer shrink-0"
                >
                  {isCapturingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  <span>{isCapturingUrl ? 'Snap...' : 'Snap'}</span>
                </button>
              </div>
            </div>

            {/* Upload File Box */}
            <label className="p-4 rounded-xl border border-dashed border-slate-700 hover:border-cyan-500/60 bg-slate-950/40 transition cursor-pointer flex items-center justify-center gap-3 text-center">
              <Upload className="w-5 h-5 text-slate-400" />
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-200">Upload Image / Screenshot</p>
                <p className="text-[11px] text-slate-400">Click to browse or drop PNG / JPEG</p>
              </div>
              <input
                id="asset-file-upload-input"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Assets List */}
            <div className="flex-1 min-h-[220px] flex flex-col">
              <span className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Attached Items ({assets.length})
              </span>
              <div className="space-y-2 overflow-y-auto max-h-56 pr-1">
                {assets.length === 0 ? (
                  <p className="text-xs text-slate-600 italic py-4 text-center">No assets attached yet.</p>
                ) : (
                  assets.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => {
                        setSelectedAsset(asset);
                        setVisionAnalysis(null);
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition cursor-pointer ${
                        selectedAsset?.id === asset.id
                          ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {asset.dataUrl ? (
                          <img
                            src={asset.dataUrl}
                            alt=""
                            className="w-10 h-8 rounded object-cover border border-slate-800 bg-black shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-8 rounded bg-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{asset.name}</p>
                          <span className="text-[10px] text-slate-400 block font-mono">{asset.type}</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDeleteAsset(asset.id, e)}
                        title="Delete asset"
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Preview & Agent Action */}
          <div className="md:col-span-7 flex flex-col space-y-3">
            {selectedAsset ? (
              <div className="flex-1 flex flex-col p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                {/* Image display */}
                <div className="flex-1 min-h-[220px] max-h-[300px] rounded-lg overflow-hidden bg-black/60 flex items-center justify-center border border-slate-800/50 mb-3 relative">
                  {selectedAsset.dataUrl ? (
                    <img
                      src={selectedAsset.dataUrl}
                      alt={selectedAsset.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-500">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">Preview unavailable</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800">
                  <span className="font-bold text-white truncate max-w-[280px]">{selectedAsset.name}</span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {new Date(selectedAsset.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    id="analyze-asset-vision-btn"
                    onClick={handleAnalyzeVision}
                    disabled={isAnalyzingVision}
                    className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {isAnalyzingVision ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>{isAnalyzingVision ? 'Analyzing...' : 'Inspect with AI Vision'}</span>
                  </button>

                  <button
                    id="reconstruct-from-asset-btn"
                    onClick={() => {
                      onReconstructWithAsset(selectedAsset);
                      onClose();
                    }}
                    className="py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Rebuild in Live App</span>
                  </button>
                </div>

                {/* Vision Results */}
                {visionAnalysis && (
                  <div className="mt-3 p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-xs text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap font-sans">
                    <p className="font-bold text-cyan-400 text-[11px] mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Halye Vision Insights
                    </p>
                    {visionAnalysis}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-xl bg-slate-950 border border-slate-800/80 text-center text-slate-600">
                <ImageIcon className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-semibold text-slate-400">Select an asset or screenshot</p>
                <p className="text-xs mt-1">Upload an image or snap a URL to inspect it here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
