import { useState } from "react";
import { useListFiles, useReadFile, useDeleteFile } from "@workspace/api-client-react";
import { getListFilesQueryKey, getReadFileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { FileCode, Trash2, Download, Package, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FilesPage() {
  const queryClient = useQueryClient();
  const { data: files } = useListFiles();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isDownloadingExt, setIsDownloadingExt] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const deleteFile = useDeleteFile();

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 6000);
  };

  const { data: fileContent } = useReadFile(
    { path: selectedFile! },
    { query: { enabled: !!selectedFile, queryKey: getReadFileQueryKey({ path: selectedFile! }) } }
  );

  const hasExtension = files?.some(
    (f) => f.name === "manifest.json" || f.path?.endsWith("/manifest.json")
  ) ?? false;

  const handleDelete = (path: string) => {
    if (confirm(`Delete ${path}? This cannot be undone.`)) {
      deleteFile.mutate({ params: { path } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFilesQueryKey() });
          if (selectedFile === path) setSelectedFile(null);
        }
      });
    }
  };

  const handleDownloadFile = async (path: string, name: string) => {
    try {
      const res = await fetch(`/api/files/read?path=${encodeURIComponent(path)}`);
      const data = await res.json() as { content: string };
      const blob = new Blob([data.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showError("Failed to download file.");
    }
  };

  const handleDownloadExtension = async () => {
    setIsDownloadingExt(true);
    try {
      const res = await fetch("/api/extensions/pack");
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        showError(err.error ?? "Failed to pack extension");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "haley-extension.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showError("Failed to download extension.");
    } finally {
      setIsDownloadingExt(false);
    }
  };

  return (
    <div className="flex h-full flex-col md:flex-row relative">
      {/* Error banner */}
      {errorMsg && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-destructive/10 border-b border-destructive/30 px-4 py-2 text-xs text-destructive font-mono flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-2 hover:opacity-70 text-base leading-none">×</button>
        </div>
      )}
      {/* File Tree */}
      <div className={`${selectedFile ? "hidden md:flex" : "flex"} md:w-72 border-r border-border bg-sidebar flex-col`}>
        <div className="h-12 border-b border-border flex items-center px-4 justify-between shrink-0">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <FileCode size={14} className="text-primary" />
            Files Built
            {files && files.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/20 text-primary font-mono">
                {files.length}
              </span>
            )}
          </h2>
        </div>

        {/* Extension download */}
        {hasExtension && (
          <div className="p-2 border-b border-border">
            <button
              onClick={handleDownloadExtension}
              disabled={isDownloadingExt}
              className="w-full flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded text-xs text-primary font-medium transition-colors disabled:opacity-50"
            >
              <Package size={12} className="shrink-0" />
              {isDownloadingExt ? "Packing ZIP..." : "Download Extension ZIP"}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {files && files.length > 0 ? (
            files.map(file => (
              <div
                key={file.path}
                onClick={() => setSelectedFile(file.path)}
                className={`flex items-center justify-between p-2 rounded cursor-pointer group text-xs transition-colors ${
                  selectedFile === file.path
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "hover:bg-accent text-foreground"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FileCode size={12} className={selectedFile === file.path ? "text-primary shrink-0" : "text-muted-foreground shrink-0"} />
                  <span className="truncate font-mono">{file.name}</span>
                  <span className="text-muted-foreground text-[10px] shrink-0">
                    {file.size > 1024 ? `${Math.round(file.size / 1024)}kb` : `${file.size}b`}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownloadFile(file.path, file.name); }}
                    className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Download file"
                  >
                    <Download size={10} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(file.path); }}
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete file"
                  >
                    <Trash2 size={10} />
                  </button>
                  <ChevronRight size={10} className="text-muted-foreground" />
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground mt-4">
              <FileCode size={32} className="opacity-20 mx-auto mb-3" />
              <p>No files yet.</p>
              <p className="mt-1 text-muted-foreground/60">Files appear here after the agent builds them in chat.</p>
            </div>
          )}
        </div>
      </div>

      {/* File content viewer */}
      <div className={`${selectedFile ? "flex" : "hidden md:flex"} flex-1 flex-col bg-background`}>
        {selectedFile ? (
          <>
            <div className="h-12 border-b border-border flex items-center px-4 justify-between bg-card shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => setSelectedFile(null)}
                  className="md:hidden p-1 rounded hover:bg-accent text-muted-foreground"
                >
                  ←
                </button>
                <span className="font-mono text-xs text-muted-foreground truncate">{selectedFile}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => {
                    const file = files?.find(f => f.path === selectedFile);
                    if (file) handleDownloadFile(file.path, file.name);
                  }}
                >
                  <Download size={11} /> Download
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(selectedFile)}
                >
                  <Trash2 size={11} /> Delete
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-background">
              <pre className="font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {fileContent?.content ?? "Loading..."}
              </pre>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-3 text-muted-foreground">
            <FileCode size={40} className="opacity-20" />
            <p className="text-sm">Select a file to view its contents</p>
          </div>
        )}
      </div>
    </div>
  );
}
