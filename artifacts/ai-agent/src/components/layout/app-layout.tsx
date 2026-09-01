import React from "react";
import { Sidebar } from "./sidebar";
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { collapsed, toggle } = useSidebar();
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {!collapsed && <Sidebar />}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        <button
          onClick={toggle}
          title={collapsed ? "Show sidebar" : "Hide sidebar — focus mode"}
          className="absolute top-2 left-2 z-50 p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
        {children}
      </main>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <LayoutInner>{children}</LayoutInner>
    </SidebarProvider>
  );
}
