import { useState, useRef, useEffect } from "react";
import {
  useListConversations,
  useCreateConversation,
  useGetConversation,
  useDeleteConversation,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListConversationsQueryKey,
  getGetConversationQueryKey,
} from "@workspace/api-client-react";
import { Markdown } from "@/components/ui/markdown";
import { Button } from "@/components/ui/button";
import {
  Send,
  User,
  Loader2,
  Plus,
  MessageSquare,
  Trash2,
  X,
  Zap,
  Key,
  CheckCircle2,
  Square,
  Sparkles,
  Bot,
  Menu,
} from "lucide-react";

const QUICK_PROMPTS = [
  { icon: "⚡", label: "Ask Anything", prompt: "NVIDIA Nemotron model ke key features aur capabilities kya hain? Roman Urdu mein simple explanation do." },
  { icon: "💻", label: "Write Code", prompt: "Ek complete TypeScript utility function likho with error handling and real-time streaming." },
  { icon: "🔍", label: "System Design", prompt: "Ek fast scalable full-stack web application ka architectural roadmap banayein." },
  { icon: "🚀", label: "Algorithm", prompt: "QuickSort algorithm ko step by step with clean code explain karo." },
];

const AVAILABLE_MODELS = [
  { id: "meta/llama-3.2-11b-vision-instruct", name: "Llama 3.2 11B", desc: "⚡ Ultra-Fast (<1s)" },
  { id: "nvidia/nemotron-3.5-lightning-30b-a3b", name: "Nemotron 3.5 30B", desc: "🧠 Deep Reasoning" },
  { id: "google/diffusiongemma-26b-a4b-it", name: "Gemma 26B", desc: "🚀 Balanced" },
];

export default function ChatPage() {
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("meta/llama-3.2-11b-vision-instruct");
  const [input, setInput] = useState("");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [nvidiaKeyInput, setNvidiaKeyInput] = useState("");
  const [hasNvidiaKey, setHasNvidiaKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { data: conversations } = useListConversations();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();

  const { data: activeConversation } = useGetConversation(activeId!, {
    query: { enabled: !!activeId, queryKey: getGetConversationQueryKey(activeId!) },
  });

  useEffect(() => {
    if (!activeId && conversations?.length) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation?.messages, streamingText, isStreaming]);

  // Load NVIDIA Key status on mount
  useEffect(() => {
    fetch("/api/settings/nvidia")
      .then((res) => res.json())
      .then((data) => {
        setHasNvidiaKey(Boolean(data.hasKey));
        setMaskedKey(data.maskedKey ?? null);
      })
      .catch(() => {});
  }, []);

  const handleSaveNvidiaKey = async () => {
    if (!nvidiaKeyInput.trim()) return;
    setIsSavingKey(true);
    try {
      const res = await fetch("/api/settings/nvidia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: nvidiaKeyInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setHasNvidiaKey(true);
        setMaskedKey(data.maskedKey);
        setNvidiaKeyInput("");
        setShowKeyModal(false);
        setSavedNotice(`🔑 NVIDIA API Key active! ${ACTIVE_MODEL} is ready.`);
        setTimeout(() => setSavedNotice(null), 6000);
      } else {
        setErrorNotice(data.error || "Failed to save key");
        setTimeout(() => setErrorNotice(null), 5000);
      }
    } catch {
      setErrorNotice("Network error while saving NVIDIA API key");
      setTimeout(() => setErrorNotice(null), 5000);
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleDeleteNvidiaKey = async () => {
    try {
      await fetch("/api/settings/nvidia", { method: "DELETE" });
      setHasNvidiaKey(false);
      setMaskedKey(null);
      setSavedNotice("NVIDIA API Key removed");
      setTimeout(() => setSavedNotice(null), 5000);
    } catch {}
  };

  const handleStop = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsStreaming(false);
    setStreamingText("");
  };

  const doSend = async (messageText: string) => {
    if (!messageText.trim() || isStreaming) return;

    let convId = activeId;
    if (!convId) {
      const title = messageText.slice(0, 40) || "New Chat";
      const newConv = await createConversation.mutateAsync({ data: { title, model: selectedModel } });
      convId = newConv.id;
      setActiveId(convId);
      queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
    }

    const currentMsg = messageText.trim();
    setInput("");
    setIsStreaming(true);
    setStreamingText("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentMsg,
          conversationId: convId,
          model: selectedModel,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server response error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        let currentEvent = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (currentEvent === "start" && data.conversationId) {
                if (!convId) {
                  convId = data.conversationId;
                  setActiveId(convId);
                  queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
                }
              } else if (currentEvent === "chunk") {
                if (data.fullReply) {
                  setStreamingText(data.fullReply);
                } else if (data.chunk) {
                  setStreamingText((prev) => prev + data.chunk);
                }
              } else if (currentEvent === "done") {
                setStreamingText("");
                queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(convId!) });
                queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
              } else if (currentEvent === "error") {
                setErrorNotice(data.error ?? "Generation error");
                setTimeout(() => setErrorNotice(null), 7000);
              }
            } catch {}
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorNotice(`Error: ${msg}`);
        setTimeout(() => setErrorNotice(null), 7000);
      }
    } finally {
      setIsStreaming(false);
      setStreamingText("");
      abortRef.current = null;
      if (convId) {
        queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(convId) });
      }
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await doSend(input);
  };

  const handleNewChat = async () => {
    const newConv = await createConversation.mutateAsync({
      data: { title: "New Chat", model: selectedModel },
    });
    setActiveId(newConv.id);
    queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
  };

  const handleDeleteConv = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          if (activeId === id) {
            setActiveId(null);
          }
        },
      }
    );
  };

  return (
    <div className="flex h-full w-full bg-black text-white overflow-hidden font-sans">
      {/* Left sidebar — conversations */}
      {sidebarOpen && (
        <div className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col shrink-0">
          <div className="p-3 border-b border-zinc-800 flex items-center gap-2">
            <Button
              size="sm"
              className="flex-1 h-9 text-xs font-semibold bg-white text-black hover:bg-zinc-200 gap-1.5"
              onClick={handleNewChat}
              data-testid="button-new-chat"
            >
              <Plus size={14} /> New Chat
            </Button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Close sidebar"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations?.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setActiveId(conv.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer text-xs transition-colors ${
                  activeId === conv.id
                    ? "bg-zinc-800 text-white font-medium border border-zinc-700"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
                data-testid={`conversation-${conv.id}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MessageSquare size={13} className="shrink-0 text-zinc-400" />
                  <span className="truncate">{conv.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteConv(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 p-1 rounded transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {!conversations?.length && (
              <div className="text-center p-6 text-xs text-zinc-600">No chats yet</div>
            )}
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-black min-w-0 h-full">
        {/* Header */}
        <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors mr-1"
                title="Open sidebar"
              >
                <Menu size={18} />
              </button>
            )}
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-white" />
              <span className="font-semibold text-sm truncate text-white">
                {activeConversation?.title || "New Chat"}
              </span>
            </div>

            {/* Model Selector */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-emerald-400 text-xs font-mono rounded-lg px-2.5 py-1 focus:outline-none focus:border-white cursor-pointer"
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id} className="bg-zinc-950 text-white font-sans">
                  {m.name} ({m.desc})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowKeyModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border transition-colors ${
                hasNvidiaKey
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25"
                  : "bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25 animate-pulse"
              }`}
              title="Configure NVIDIA API Key"
              data-testid="button-nvidia-key"
            >
              <Key size={13} />
              <span className="font-mono text-[11px]">
                {hasNvidiaKey ? (maskedKey || "NVIDIA Active") : "Set NVIDIA Key"}
              </span>
            </button>
          </div>
        </header>

        {/* NVIDIA Key Modal */}
        {showKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-zinc-950 border-2 border-white rounded-xl shadow-2xl p-5 space-y-4 text-white">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Key size={18} className="text-emerald-400" />
                  <h3 className="text-sm font-bold">NVIDIA API Key Configuration</h3>
                </div>
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Selected Model: <span className="font-mono font-bold text-emerald-400">{selectedModel}</span>
                </p>
                <p className="text-[11px] text-zinc-400">
                  Enter your NVIDIA API Key (<code className="text-zinc-200">nvapi-...</code>).
                </p>

                {hasNvidiaKey && (
                  <div className="flex items-center justify-between p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span>Key Configured: <strong className="font-mono">{maskedKey}</strong></span>
                    </div>
                    <button
                      onClick={handleDeleteNvidiaKey}
                      className="text-red-400 hover:text-red-300 text-[11px] underline ml-2"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-semibold text-zinc-300">
                    {hasNvidiaKey ? "Update NVIDIA API Key:" : "Enter NVIDIA API Key:"}
                  </label>
                  <input
                    type="password"
                    value={nvidiaKeyInput}
                    onChange={(e) => setNvidiaKeyInput(e.target.value)}
                    placeholder="nvapi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-black border-2 border-zinc-700 focus:border-white rounded-md px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveNvidiaKey();
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowKeyModal(false)}
                  className="text-xs border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveNvidiaKey}
                  disabled={!nvidiaKeyInput.trim() || isSavingKey}
                  className="text-xs bg-white text-black font-bold hover:bg-zinc-200"
                >
                  {isSavingKey ? <Loader2 size={12} className="animate-spin mr-1" /> : <Zap size={12} className="mr-1" />}
                  Save & Activate
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Notices */}
        {savedNotice && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-4 py-2 text-xs text-emerald-300 font-mono shrink-0 flex items-center justify-between">
            <span>{savedNotice}</span>
            <button onClick={() => setSavedNotice(null)} className="ml-2 hover:opacity-70">
              <X size={12} />
            </button>
          </div>
        )}

        {errorNotice && (
          <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 text-xs text-red-300 font-mono shrink-0 flex items-center justify-between">
            <span>{errorNotice}</span>
            <button onClick={() => setErrorNotice(null)} className="ml-2 hover:opacity-70">
              <X size={12} />
            </button>
          </div>
        )}

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6" ref={scrollRef}>
          {!activeConversation?.messages?.length && !streamingText ? (
            <div className="h-full flex items-center justify-center flex-col gap-6 px-4 max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border-2 border-white flex items-center justify-center shadow-2xl">
                <Sparkles size={28} className="text-white" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">NVIDIA AI Chat Workspace</h2>
                <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Ultra-fast response streaming and direct answers powered by{" "}
                  <span className="text-emerald-400 font-mono">{selectedModel}</span>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-2">
                {QUICK_PROMPTS.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => doSend(qp.prompt)}
                    className="flex items-start gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 hover:border-zinc-700 text-left transition-all group"
                  >
                    <span className="text-lg">{qp.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white group-hover:text-emerald-300">{qp.label}</p>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">{qp.prompt}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {activeConversation?.messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  data-testid={`message-${msg.id}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white flex items-center justify-center shrink-0 mt-1">
                      <Bot size={15} className="text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-xl p-4 ${
                      msg.role === "user"
                        ? "bg-zinc-900 text-white border border-zinc-700 text-sm shadow-md"
                        : "bg-black text-white border-2 border-white shadow-2xl"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <Markdown content={msg.content} />
                    ) : (
                      <p className="whitespace-pre-wrap break-words text-white">{msg.content}</p>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mt-1">
                      <User size={15} className="text-zinc-300" />
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming live text bubble */}
              {isStreaming && streamingText && (
                <div className="flex gap-3.5 justify-start">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white flex items-center justify-center shrink-0 mt-1 animate-pulse">
                    <Bot size={15} className="text-white" />
                  </div>
                  <div className="max-w-[85%] rounded-xl p-4 bg-black text-white border-2 border-white shadow-2xl">
                    <Markdown content={streamingText} />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Loading indicator when waiting for initial tokens */}
          {isStreaming && !streamingText && (
            <div className="flex items-center gap-3 text-xs text-zinc-400 p-2">
              <Loader2 size={16} className="animate-spin text-white" />
              <span>Generating with {selectedModel}...</span>
            </div>
          )}
        </div>

        {/* Input box */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 shrink-0">
          <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything or request code..."
              rows={2}
              className="flex-1 bg-black border-2 border-zinc-700 focus:border-white shadow-lg rounded-xl px-4 py-3 text-sm font-mono text-white placeholder:text-zinc-500 resize-none focus:outline-none transition-colors min-h-[56px] max-h-36"
              disabled={isStreaming}
              data-testid="input-chat-message"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />

            {isStreaming ? (
              <Button
                type="button"
                onClick={handleStop}
                variant="destructive"
                className="h-[56px] px-4 font-bold text-xs gap-1.5 rounded-xl shrink-0"
                data-testid="button-stop"
              >
                <Square size={14} className="fill-current" /> Stop
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="h-[56px] px-5 font-bold text-xs bg-white text-black hover:bg-zinc-200 gap-1.5 rounded-xl shrink-0"
                data-testid="button-send-message"
              >
                <Send size={15} /> Send
              </Button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
