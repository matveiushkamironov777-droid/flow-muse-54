import {
  LayoutDashboard, Inbox, Columns3, CalendarClock, Target,
  Repeat, ClipboardList, Settings, LogOut, Plus,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

const mainItems = [
  { title: "Дашборд", url: "/", icon: LayoutDashboard },
  { title: "Входящие", url: "/inbox", icon: Inbox },
  { title: "Канбан", url: "/board", icon: Columns3 },
  { title: "Планер", url: "/planner", icon: CalendarClock },
  { title: "Цели", url: "/goals", icon: Target },
  { title: "Привычки", url: "/habits", icon: Repeat },
];

const reviewItems = [
  { title: "Дневной обзор", url: "/reviews/daily", icon: ClipboardList },
  { title: "Недельный обзор", url: "/reviews/weekly", icon: ClipboardList },
];

export function AppSidebar({ onQuickAdd }: { onQuickAdd: () => void }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();

  return (
    <Sidebar collapsible="icon">
      {/* Brand / Logo */}
      <SidebarHeader className="px-3 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="shrink-0 flex items-center justify-center text-white font-bold text-[13px] rounded-[8px]"
            style={{
              width: 28,
              height: 28,
              background: "linear-gradient(135deg, var(--primary), oklch(0.62 0.18 280))",
            }}
          >
            F
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[13px] font-semibold leading-tight text-foreground">Flow OS</div>
              <div className="text-[11px] leading-tight" style={{ color: "var(--text-subtle)" }}>
                Потоковое планирование
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Quick capture */}
        <SidebarGroup className="pt-1 pb-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <button
                  onClick={onQuickAdd}
                  className="w-full flex items-center gap-2.5 rounded-[8px] px-2.5 py-1.5 text-[13.5px] transition-colors"
                  style={{
                    border: "1px dashed var(--border-strong)",
                    background: "var(--surface)",
                    color: "var(--text-subtle)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--primary)";
                    (e.currentTarget as HTMLElement).style.color = "var(--accent-fg)";
                    (e.currentTarget as HTMLElement).style.border = "1px dashed transparent";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--surface)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-subtle)";
                    (e.currentTarget as HTMLElement).style.border = "1px dashed var(--border-strong)";
                  }}
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">Захват</span>
                      <kbd
                        className="text-[10px] font-mono px-1 rounded"
                        style={{ background: "var(--surface-3)", color: "var(--text-subtle)" }}
                      >
                        N
                      </kbd>
                    </>
                  )}
                </button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Main nav */}
        <SidebarGroup>
          <SidebarGroupLabel
            className="uppercase tracking-[0.06em]"
            style={{ fontSize: "10.5px", color: "var(--text-subtle)" }}
          >
            Основное
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-[8px] text-[13.5px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      activeClassName="nav-active-item"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Reviews */}
        <SidebarGroup>
          <SidebarGroupLabel
            className="uppercase tracking-[0.06em]"
            style={{ fontSize: "10.5px", color: "var(--text-subtle)" }}
          >
            Обзор
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {reviewItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-[8px] text-[13.5px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      activeClassName="nav-active-item"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/settings"
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-[8px] text-[13.5px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                activeClassName="nav-active-item"
              >
                <Settings className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Настройки</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-[8px] text-[13.5px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Выход</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
