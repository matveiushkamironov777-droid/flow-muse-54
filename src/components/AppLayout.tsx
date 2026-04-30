import { useState, useEffect, useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { QuickAddDialog } from "@/components/QuickAddDialog";
import { Search, Bell, HelpCircle } from "lucide-react";
import { useFirstRun } from "@/hooks/useFirstRun";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Дашборд",
  "/inbox": "Входящие",
  "/board": "Канбан",
  "/planner": "Планер",
  "/goals": "Цели",
  "/habits": "Привычки",
  "/reviews/daily": "Дневной обзор",
  "/reviews/weekly": "Недельный обзор",
  "/settings": "Настройки",
};

export function AppLayout() {
  useFirstRun();
  const [quickAdd, setQuickAdd] = useState(false);
  const location = useLocation();
  const pageLabel = ROUTE_LABELS[location.pathname] ?? "Flow OS";

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (
      e.key === "n" &&
      !e.metaKey &&
      !e.ctrlKey &&
      !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
    ) {
      e.preventDefault();
      setQuickAdd(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar onQuickAdd={() => setQuickAdd(true)} />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <header
            className="h-14 flex items-center justify-between shrink-0 px-5"
            style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
          >
            {/* Left: trigger + breadcrumbs */}
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="flex items-center gap-1.5 text-[13px]">
                <span style={{ color: "var(--text-subtle)" }}>Flow Planning</span>
                <span style={{ color: "var(--text-subtle)" }}>/</span>
                <span className="font-semibold text-foreground">{pageLabel}</span>
              </div>
            </div>

            {/* Right: search + icons */}
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 rounded-[var(--r-md)] px-3 h-8 text-[13px]"
                style={{
                  width: 240,
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text-subtle)",
                }}
              >
                <Search className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1">Поиск...</span>
                <kbd
                  className="font-mono text-[10px] px-1 rounded"
                  style={{ background: "var(--surface-3)", color: "var(--text-subtle)" }}
                >
                  ⌘K
                </kbd>
              </div>
              <button
                className="h-8 w-8 rounded-[var(--r-md)] flex items-center justify-center transition-colors hover:bg-accent"
                style={{ color: "var(--text-subtle)" }}
              >
                <Bell className="h-4 w-4" />
              </button>
              <button
                className="h-8 w-8 rounded-[var(--r-md)] flex items-center justify-center transition-colors hover:bg-accent"
                style={{ color: "var(--text-subtle)" }}
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-auto" style={{ padding: "28px 28px 64px" }}>
            <Outlet />
          </main>
        </div>
      </div>
      <QuickAddDialog open={quickAdd} onOpenChange={setQuickAdd} />
    </SidebarProvider>
  );
}
