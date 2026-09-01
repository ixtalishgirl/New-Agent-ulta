import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { MessageSquare, Folder, Terminal, History, Activity, X, Zap, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { useGetStats, useListFiles } from "@workspace/api-client-react";
import { useSidebar } from "@/lib/sidebar-context";

interface TgStatus { connected: boolean; chatId: string | null; tokenSet: boolean; }

export function Sidebar() {
  const [location] = useLocation();
  const { data: stats } = useGetStats();
  const { data: files } = useListFiles();
  const { toggle } = useSidebar();
  const [tgStatus, setTgStatus] = useState<TgStatus | null>(null);
  const [tgLoading, setTgLoading] = useState(false);
  const [tgMsg, setTgMsg] = useState<string | null>(null);

  const fileCount = files?.length ?? 0;

  const links = [
    { href: "/", label: "Chat", icon: MessageSquare, badge: null },
    { href: "/files", label: "Files", icon: Folder, badge: fileCount > 0 ? fileCount : null },
    { href: "/terminal", label: "Terminal", icon: Terminal, badge: null },
    { href: "/history", label: "History", icon: History, badge: null },
  ];

  useEffect(() => {
    fetch("/api/telegram/status")
      .then((r) => r.json())
      .then((d) => setTgStatus(d as TgStatus))
      .catch(() => {});
  }, []);

  const connectTelegram = async () => {
    setTgLoading(true);
    setTgMsg(null);
    try {
      const res = await fetch("/api/telegram/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json() as { success: boolean; chatId?: string; message?: string };
      if (data.success) {
        setTgStatus((p) => ({ ...p!, connected: true, chatId: data.chatId ?? null }));
        setTgMsg("✅ Connected!");
      } else {
        setTgMsg(data.message ?? "Pehle bot ko message bhejo");
      }
    } catch { setTgMsg("Error. Dobara try karo."); }
    setTgLoading(false);
  };

  return (
    <aside className="w-56 border-r border-border bg-sidebar flex flex-col h-screen shrink-0">
      <div className="p-3 border-b border-border flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
          H
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm leading-tight text-sidebar-foreground">Haley's Agent</h1>
          <div className="flex items-center gap-1 mt-0.5">
            <Zap size={9} className="text-yellow-400 shrink-0" />
            <p className="text-[10px] text-yellow-400 font-mono">Dolphin Nemo • God Mode</p>
          </div>
        </div>
        <button
          onClick={toggle}
          title="Close sidebar"
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-0.5">
        {links.map((link) => {
          const isActive = location === link.href;
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm cursor-pointer transition-colors ${
                isActive
                  ? "bg-primary/15 text-primary font-medium border border-primary/20"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}>
                <Icon size={15} className={isActive ? "text-primary" : ""} />
                <span className="flex-1">{link.label}</span>
                {link.badge !== null && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-primary/20 text-primary min-w-[18px] text-center">
                    {link.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Telegram Panel */}
      <div className="p-2.5 border-t border-border">
        <div className="rounded-lg border border-border bg-card p-2.5 space-y-2">
          <div className="flex items-center gap-1.5">
            <Send size={11} className={tgStatus?.connected ? "text-green-400" : "text-muted-foreground"} />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Telegram</span>
            {tgStatus?.connected ? (
              <CheckCircle2 size={10} className="text-green-400 ml-auto" />
            ) : (
              <AlertCircle size={10} className="text-yellow-500 ml-auto" />
            )}
          </div>

          {tgStatus?.connected ? (
            <div className="text-[10px] text-green-400 font-mono">
              ✅ Connected
              <div className="text-muted-foreground mt-0.5">Results phone py aaynge 🔔</div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                <span className="text-cyan-400 font-mono">@Haley_Agent_bot</span> ko ek hi message bhejo, phir Connect dabao
              </p>
              <button
                onClick={connectTelegram}
                disabled={tgLoading}
                className="w-full text-[10px] py-1.5 px-2 rounded bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 transition-colors disabled:opacity-50 font-medium"
              >
                {tgLoading ? "Check kar raha hoon..." : "🔗 Auto-Connect"}
              </button>
              {tgMsg && (
                <p className={`text-[10px] ${tgMsg.startsWith("✅") ? "text-green-400" : "text-yellow-400"}`}>
                  {tgMsg}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {stats && (
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-1.5 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <Activity size={10} /> System Stats
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Conversations</span>
              <span className="font-mono text-foreground">{stats.totalConversations}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Messages</span>
              <span className="font-mono text-foreground">{stats.totalMessages}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Files Built</span>
              <span className="font-mono text-primary">{stats.totalFiles}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
