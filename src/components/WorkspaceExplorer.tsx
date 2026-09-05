import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  FileCode, 
  FileArchive, 
  Plus, 
  RefreshCw, 
  Save, 
  Play, 
  Trash2, 
  Download, 
  Search, 
  Check, 
  AlertCircle, 
  Loader2, 
  Archive, 
  FileCheck,
  Terminal,
  Clock,
  HardDrive
} from 'lucide-react';
import { WorkspaceFileItem, ZipInspectionResult } from '../types';

interface WorkspaceExplorerProps {
  onRunInTerminal?: (cmd: string) => void;
  autoSelectFile?: string | null;
}

export const WorkspaceExplorer: React.FC<WorkspaceExplorerProps> = ({ 
  onRunInTerminal,
  autoSelectFile
}) => {
  const [files, setFiles] = useState<WorkspaceFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  // Active file editing state
  const [fileContent, setFileContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Zip Inspection state
  const [zipData, setZipData] = useState<ZipInspectionResult | null>(null);
  const [isInspectingZip, setIsInspectingZip] = useState(false);
  const [isExtractingZip, setIsExtractingZip] = useState(false);
  const [extractMsg, setExtractMsg] = useState<string | null>(null);

  // New File modal state
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileInitialContent, setNewFileInitialContent] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);

  // Create Zip modal state
  const [showCreateZipModal, setShowCreateZipModal] = useState(false);
  const [newZipName, setNewZipName] = useState('project_backup.zip');
  const [selectedItemsToZip, setSelectedItemsToZip] = useState<string[]>([]);
  const [isCreatingZip, setIsCreatingZip] = useState(false);
  const [createZipResult, setCreateZipResult] = useState<string | null>(null);

  // Fetch workspace files list
  const fetchFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const res = await fetch('/api/workspace/files');
      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        setFiles(data.files);
        // If no file selected yet, select a default file
        if (!selectedFilePath && data.files.length > 0) {
          const defaultTarget = data.files.find((f: WorkspaceFileItem) => f.name === 'halye_controller.py') || data.files[0];
          loadFile(defaultTarget.path, defaultTarget.isZip);
        }
      }
    } catch (err) {
      console.error('Failed to fetch workspace files:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Handle auto-selection prop
  useEffect(() => {
    if (autoSelectFile) {
      const isZip = autoSelectFile.endsWith('.zip');
      loadFile(autoSelectFile, isZip);
    }
  }, [autoSelectFile]);

  // Load a file or zip
  const loadFile = async (filePath: string, isZip = false) => {
    setSelectedFilePath(filePath);
    setSaveSuccess(false);
    setSaveError(null);
    setExtractMsg(null);

    if (isZip) {
      // Inspect ZIP file
      setIsInspectingZip(true);
      setZipData(null);
      try {
        const res = await fetch('/api/workspace/zip-inspect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zipPath: filePath }),
        });
        const data = await res.json();
        setZipData(data);
      } catch (err: any) {
        setZipData({
          success: false,
          archive_name: filePath,
          archive_path: filePath,
          total_files: 0,
          total_uncompressed_bytes: 0,
          total_compressed_bytes: 0,
          total_size_formatted: '0 B',
          files: [],
          error: err.message,
        });
      } finally {
        setIsInspectingZip(false);
      }
    } else {
      // Read text/code file
      setIsLoadingContent(true);
      setZipData(null);
      try {
        const res = await fetch(`/api/workspace/file?path=${encodeURIComponent(filePath)}`);
        const data = await res.json();
        if (data.success) {
          setFileContent(data.content || '');
          setOriginalContent(data.content || '');
        } else {
          setFileContent(`// Error loading file: ${data.error || 'Unknown error'}`);
        }
      } catch (err: any) {
        setFileContent(`// Network error loading file: ${err.message}`);
      } finally {
        setIsLoadingContent(false);
      }
    }
  };

  // Save current file
  const handleSaveFile = async () => {
    if (!selectedFilePath) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const res = await fetch('/api/workspace/file-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: selectedFilePath,
          content: fileContent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOriginalContent(fileContent);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        fetchFiles();
      } else {
        setSaveError(data.error || 'Failed to save');
      }
    } catch (err: any) {
      setSaveError(err.message || 'Error saving file');
    } finally {
      setIsSaving(false);
    }
  };

  // Create new file
  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    setIsCreatingFile(true);
    try {
      const res = await fetch('/api/workspace/file-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: newFileName.trim(),
          content: newFileInitialContent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowNewFileModal(false);
        setNewFileName('');
        setNewFileInitialContent('');
        await fetchFiles();
        loadFile(data.file.path, false);
      }
    } catch (err) {
      console.error('Failed to create file:', err);
    } finally {
      setIsCreatingFile(false);
    }
  };

  // Extract zip archive
  const handleExtractZip = async () => {
    if (!selectedFilePath) return;
    setIsExtractingZip(true);
    setExtractMsg(null);

    try {
      const res = await fetch('/api/workspace/zip-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipPath: selectedFilePath }),
      });
      const data = await res.json();
      if (data.success) {
        setExtractMsg(`✔ ${data.message} (${data.extracted_count} files extracted)`);
        fetchFiles();
      } else {
        setExtractMsg(`❌ Failed: ${data.error}`);
      }
    } catch (err: any) {
      setExtractMsg(`❌ Extraction error: ${err.message}`);
    } finally {
      setIsExtractingZip(false);
    }
  };

  // Create zip archive
  const handleCreateZip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZipName.trim() || selectedItemsToZip.length === 0) return;

    setIsCreatingZip(true);
    setCreateZipResult(null);

    try {
      const res = await fetch('/api/workspace/zip-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zipPath: newZipName.trim().endsWith('.zip') ? newZipName.trim() : newZipName.trim() + '.zip',
          items: selectedItemsToZip,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreateZipResult(`✔ Archive created successfully: ${data.zip_path}`);
        await fetchFiles();
        setTimeout(() => {
          setShowCreateZipModal(false);
          setCreateZipResult(null);
          loadFile(data.zip_path, true);
        }, 1200);
      } else {
        setCreateZipResult(`❌ Failed: ${data.error}`);
      }
    } catch (err: any) {
      setCreateZipResult(`❌ Error: ${err.message}`);
    } finally {
      setIsCreatingZip(false);
    }
  };

  // Filter files by search
  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Selected file details
  const activeFile = files.find(f => f.path === selectedFilePath);
  const isModified = fileContent !== originalContent;

  const getFileIcon = (file: WorkspaceFileItem) => {
    if (file.isDir) return <Folder className="w-4 h-4 text-amber-400 shrink-0" />;
    if (file.isZip) return <FileArchive className="w-4 h-4 text-emerald-400 shrink-0" />;
    if (['py', 'ts', 'js', 'sh'].includes(file.extension)) {
      return <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-zinc-400 shrink-0" />;
  };

  return (
    <div className="w-full h-full flex flex-col sm:flex-row overflow-hidden bg-black text-zinc-100">
      
      {/* ======================================================= */}
      {/* LEFT COLUMN: Workspace File Browser & ZIP Manager      */}
      {/* ======================================================= */}
      <div className="w-full sm:w-72 lg:w-80 h-1/3 sm:h-full flex flex-col border-b sm:border-b-0 sm:border-r border-zinc-900 bg-zinc-950 shrink-0">
        
        {/* Browser Header & Quick Actions */}
        <div className="p-3 border-b border-zinc-900 bg-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Workspace Files</span>
            <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-mono">
              {files.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowNewFileModal(true)}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition cursor-pointer"
              title="New File"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setSelectedItemsToZip(files.slice(0, 4).map(f => f.name));
                setShowCreateZipModal(true);
              }}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 border border-zinc-800 transition cursor-pointer"
              title="Create ZIP Archive"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={fetchFiles}
              disabled={isLoadingFiles}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition cursor-pointer"
              title="Refresh File List"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search Filter */}
        <div className="p-2 border-b border-zinc-900 bg-zinc-950/60">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files or zips..."
              className="w-full bg-black border border-zinc-850 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition font-mono"
            />
          </div>
        </div>

        {/* Files List Scrollable */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 font-mono text-xs">
          {filteredFiles.map((file) => {
            const isSelected = selectedFilePath === file.path;
            return (
              <button
                key={file.path}
                onClick={() => {
                  if (!file.isDir) {
                    loadFile(file.path, file.isZip);
                  }
                }}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition cursor-pointer group ${
                  isSelected 
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' 
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  {getFileIcon(file)}
                  <span className="truncate text-[11px]">{file.path}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {file.isZip && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                      ZIP
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400">
                    {file.sizeFormatted}
                  </span>
                </div>
              </button>
            );
          })}

          {filteredFiles.length === 0 && (
            <div className="p-4 text-center text-zinc-500 text-xs">
              No files found.
            </div>
          )}
        </div>

        {/* Quick Footer Stats */}
        <div className="p-2 border-t border-zinc-900 bg-black text-[10px] text-zinc-500 flex items-center justify-between font-mono">
          <span>Root: /app/applet</span>
          <span className="text-cyan-400">{files.filter(f => f.isZip).length} ZIP Archive(s)</span>
        </div>
      </div>

      {/* ======================================================= */}
      {/* RIGHT COLUMN: Code Editor OR ZIP Archive Inspector      */}
      {/* ======================================================= */}
      <div className="flex-1 h-2/3 sm:h-full flex flex-col overflow-hidden bg-black">
        
        {/* Editor / Inspector Top Navigation */}
        <div className="h-12 border-b border-zinc-900 bg-zinc-950 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {activeFile?.isZip ? (
              <FileArchive className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
            )}
            <span className="font-mono text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
              {selectedFilePath || 'No file opened'}
            </span>
            {isModified && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-mono">
                Modified
              </span>
            )}
            {activeFile && (
              <span className="hidden md:inline-block text-[10px] text-zinc-500 font-mono">
                • {activeFile.sizeFormatted}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* If ZIP Archive */}
            {activeFile?.isZip ? (
              <>
                <button
                  onClick={handleExtractZip}
                  disabled={isExtractingZip}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs font-bold font-mono flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                  {isExtractingZip ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>Extract ZIP</span>
                </button>
                {onRunInTerminal && (
                  <button
                    onClick={() => onRunInTerminal(`python3 halye_powers/zip_inspector.py --list "${selectedFilePath}"`)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                    title="Run inspect command in Linux terminal"
                  >
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">Inspect in Terminal</span>
                  </button>
                )}
              </>
            ) : (
              /* If Code / Text File */
              <>
                {saveSuccess && (
                  <span className="text-emerald-400 text-xs flex items-center gap-1 font-mono">
                    <Check className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
                {saveError && (
                  <span className="text-rose-400 text-xs flex items-center gap-1 font-mono">
                    <AlertCircle className="w-3.5 h-3.5" /> {saveError}
                  </span>
                )}
                
                {onRunInTerminal && activeFile && ['py', 'sh', 'js'].includes(activeFile.extension) && (
                  <button
                    onClick={() => {
                      const runner = activeFile.extension === 'py' ? 'python3' : activeFile.extension === 'sh' ? 'bash' : 'node';
                      onRunInTerminal(`${runner} "${selectedFilePath}"`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-cyan-400 text-xs font-bold font-mono flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                    title="Execute this script in Halye Terminal"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Script</span>
                  </button>
                )}

                <button
                  onClick={handleSaveFile}
                  disabled={isSaving || !isModified}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                    isModified 
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20' 
                      : 'bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed'
                  }`}
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          
          {/* ================================================= */}
          {/* CASE A: ZIP ARCHIVE INSPECTOR VIEW                */}
          {/* ================================================= */}
          {activeFile?.isZip ? (
            <div className="w-full h-full overflow-y-auto p-4 sm:p-6 space-y-6">
              {isInspectingZip ? (
                <div className="w-full h-64 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  <span className="text-xs text-zinc-400 font-mono">Inspecting ZIP archive contents...</span>
                </div>
              ) : zipData && zipData.success ? (
                <div className="space-y-6 max-w-5xl mx-auto">
                  
                  {/* Summary Banner */}
                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-850 shadow-2xl relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold uppercase mb-2">
                          <Archive className="w-3.5 h-3.5" /> ZIP Archive Inspector
                        </div>
                        <h2 className="text-xl font-extrabold text-white font-mono">{zipData.archive_name}</h2>
                        <p className="text-xs text-zinc-400 font-mono mt-1">
                          Path: {zipData.archive_path}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="px-3.5 py-2 rounded-xl bg-black border border-zinc-800 text-center font-mono">
                          <div className="text-[10px] text-zinc-500">FILES COUNT</div>
                          <div className="text-base font-bold text-white">{zipData.total_files}</div>
                        </div>
                        <div className="px-3.5 py-2 rounded-xl bg-black border border-zinc-800 text-center font-mono">
                          <div className="text-[10px] text-zinc-500">UNCOMPRESSED</div>
                          <div className="text-base font-bold text-cyan-400">{zipData.total_size_formatted}</div>
                        </div>
                        <div className="px-3.5 py-2 rounded-xl bg-black border border-zinc-800 text-center font-mono">
                          <div className="text-[10px] text-zinc-500">COMPRESSED</div>
                          <div className="text-base font-bold text-emerald-400">
                            {roundKb(zipData.total_compressed_bytes)} KB
                          </div>
                        </div>
                      </div>
                    </div>

                    {extractMsg && (
                      <div className="mt-4 p-3 rounded-xl bg-black border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                        {extractMsg}
                      </div>
                    )}
                  </div>

                  {/* Files inside ZIP Table */}
                  <div className="rounded-2xl bg-zinc-950 border border-zinc-850 overflow-hidden shadow-xl">
                    <div className="p-3.5 bg-black border-b border-zinc-850 flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider">
                        Files Inside Archive ({zipData.files.length})
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        Checked via python3 zip_inspector.py
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs">
                        <thead>
                          <tr className="border-b border-zinc-900 bg-zinc-950 text-zinc-400 text-[11px]">
                            <th className="p-3 font-semibold">File / Path</th>
                            <th className="p-3 font-semibold">Type</th>
                            <th className="p-3 font-semibold text-right">Original Size</th>
                            <th className="p-3 font-semibold text-right">Compressed</th>
                            <th className="p-3 font-semibold text-right">Ratio</th>
                            <th className="p-3 font-semibold text-right">Modified Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900">
                          {zipData.files.map((file, idx) => (
                            <tr key={idx} className="hover:bg-zinc-900/50 transition">
                              <td className="p-3 text-white flex items-center gap-2">
                                {file.is_dir ? (
                                  <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                ) : (
                                  <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                )}
                                <span className="truncate max-w-sm">{file.filename}</span>
                              </td>
                              <td className="p-3 text-zinc-400">
                                {file.is_dir ? 'Directory' : file.filename.split('.').pop() || 'file'}
                              </td>
                              <td className="p-3 text-right text-zinc-300">
                                {roundKb(file.file_size)} KB
                              </td>
                              <td className="p-3 text-right text-emerald-400">
                                {roundKb(file.compress_size)} KB
                              </td>
                              <td className="p-3 text-right text-zinc-400">
                                {file.compression_ratio}
                              </td>
                              <td className="p-3 text-right text-zinc-500 text-[11px]">
                                {file.date_time}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500 font-mono text-xs">
                  {zipData?.error ? `Error: ${zipData.error}` : 'Could not read zip archive.'}
                </div>
              )}
            </div>
          ) : (
            /* ================================================= */
            /* CASE B: CODE & TEXT FILE EDITOR VIEW              */
            /* ================================================= */
            <div className="w-full h-full flex flex-col">
              {isLoadingContent ? (
                <div className="w-full h-full flex items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                  <span className="text-xs text-zinc-400 font-mono">Loading file contents...</span>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col">
                  <textarea
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    spellCheck={false}
                    className="flex-1 w-full p-4 bg-black text-zinc-200 font-mono text-xs sm:text-sm focus:outline-none resize-none selection:bg-cyan-500 selection:text-black leading-relaxed"
                  />
                  <div className="px-4 py-2 border-t border-zinc-900 bg-zinc-950 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span>Lines: {fileContent.split('\n').length} | Characters: {fileContent.length}</span>
                    <span className="text-cyan-400">Monospace Editor</span>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ======================================================= */}
      {/* MODAL 1: CREATE NEW FILE                                */}
      {/* ======================================================= */}
      {showNewFileModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Create New File in Workspace</span>
            </h3>

            <form onSubmit={handleCreateFile} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  File Name or Path (e.g. script.py, test.sh, data.json)
                </label>
                <input
                  type="text"
                  required
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="my_script.py"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Initial Content (Optional)
                </label>
                <textarea
                  rows={4}
                  value={newFileInitialContent}
                  onChange={(e) => setNewFileInitialContent(e.target.value)}
                  placeholder="# Python script for Halye"
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 font-mono placeholder-zinc-600 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFileModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingFile || !newFileName.trim()}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold font-mono transition cursor-pointer shadow-lg shadow-cyan-500/20"
                >
                  {isCreatingFile ? 'Creating...' : 'Create File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 2: CREATE NEW ZIP ARCHIVE                         */}
      {/* ======================================================= */}
      {showCreateZipModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Archive className="w-4 h-4 text-emerald-400" />
              <span>Create New ZIP Archive</span>
            </h3>

            <form onSubmit={handleCreateZip} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Archive Name
                </label>
                <input
                  type="text"
                  required
                  value={newZipName}
                  onChange={(e) => setNewZipName(e.target.value)}
                  placeholder="archive.zip"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-2">
                  Select Files / Directories to Compress ({selectedItemsToZip.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto space-y-1 p-2 rounded-xl bg-black border border-zinc-850">
                  {files.filter(f => !f.isZip).map(f => {
                    const isChecked = selectedItemsToZip.includes(f.path);
                    return (
                      <label 
                        key={f.path} 
                        className="flex items-center justify-between p-1.5 rounded hover:bg-zinc-900 cursor-pointer text-xs font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedItemsToZip(prev => prev.filter(x => x !== f.path));
                              } else {
                                setSelectedItemsToZip(prev => [...prev, f.path]);
                              }
                            }}
                            className="rounded border-zinc-700 text-emerald-500 focus:ring-0"
                          />
                          <span className="text-zinc-300">{f.path}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500">{f.sizeFormatted}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {createZipResult && (
                <div className="p-3 rounded-xl bg-black border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                  {createZipResult}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateZipModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingZip || selectedItemsToZip.length === 0}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-mono transition cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  {isCreatingZip ? 'Packaging...' : 'Build ZIP Archive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

function roundKb(bytes: number): string {
  if (!bytes) return '0';
  return (bytes / 1024).toFixed(1);
}
