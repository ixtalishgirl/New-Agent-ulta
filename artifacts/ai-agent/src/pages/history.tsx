import { useState } from "react";
import {
  useListConversations,
  useDeleteConversation,
  useGetConversation,
} from "@workspace/api-client-react";
import {
  getListConversationsQueryKey,
  getGetConversationQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useGetStats } from "@workspace/api-client-react";
import { getGetStatsQueryKey } from "@workspace/api-client-react";
import { Bot, Trash2, MessageSquare, Clock, Database, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function HistoryPage() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: conversations, isLoading } = useListConversations();
  const { data: stats } = useGetStats({
    query: { queryKey: getGetStatsQueryKey() },
  });
  const deleteConversation = useDeleteConversation();

  const { data: selected } = useGetConversation(selectedId!, {
    query: {
      enabled: !!selectedId,
      queryKey: getGetConversationQueryKey(selectedId!),
    },
  });

  const filtered = conversations?.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListConversationsQueryKey(),
          });
          if (selectedId === id) setSelectedId(null);
        },
      }
    );
  };

  return (
    <div className="flex h-full bg-background">
      {/* Left panel */}
      <div className="w-80 border-r border-border flex flex-col bg-sidebar">
        {/* Stats bar */}
        <div className="p-4 border-b border-border space-y-3">
          <h1 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Bot size={16} className="text-primary" />
            Conversation History
          </h1>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-card rounded p-2 text-center border border-border">
              <p className="text-xs text-muted-foreground">Chats</p>
              <p className="text-lg font-bold text-primary">
                {stats?.totalConversations ?? 0}
              </p>
            </div>
            <div className="bg-card rounded p-2 text-center border border-border">
              <p className="text-xs text-muted-foreground">Messages</p>
              <p className="text-lg font-bold text-primary">
                {stats?.totalMessages ?? 0}
              </p>
            </div>
            <div className="bg-card rounded p-2 text-center border border-border">
              <p className="text-xs text-muted-foreground">Files</p>
              <p className="text-lg font-bold text-primary">
                {stats?.totalFiles ?? 0}
              </p>
            </div>
          </div>
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs bg-card border-border"
            data-testid="input-search-history"
          />
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-card rounded animate-pulse border border-border"
                />
              ))}
            </div>
          ) : filtered?.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground text-sm">
              No conversations found.
            </div>
          ) : (
            filtered?.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`p-3 rounded cursor-pointer group flex items-start justify-between gap-2 transition-colors ${
                  selectedId === conv.id
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-accent border border-transparent"
                }`}
                data-testid={`card-conversation-${conv.id}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{conv.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-card border border-border font-mono text-muted-foreground">
                      {conv.model}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <MessageSquare size={9} />
                      {conv.messageCount}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={(e) => handleDelete(conv.id, e)}
                  data-testid={`button-delete-conversation-${conv.id}`}
                >
                  <Trash2 size={11} />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right panel — conversation preview */}
      <div className="flex-1 flex flex-col">
        {selected ? (
          <>
            <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-card">
              <div>
                <p className="font-semibold text-sm">{selected.title}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {selected.model} · {selected.messages.length} messages
                </p>
              </div>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => setLocation("/")}
                data-testid="button-open-chat"
              >
                Open in Chat
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selected.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 text-sm ${
                      msg.role === "user"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-card border border-border text-card-foreground"
                    }`}
                    data-testid={`message-${msg.id}`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
            <MessageSquare size={48} className="opacity-20" />
            <p className="text-sm">Select a conversation to preview messages.</p>
          </div>
        )}
      </div>
    </div>
  );
}
