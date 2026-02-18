import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard,
  Activity,
  TrendingUp,
  Instagram,
  Settings,
  LogOut,
  Sparkles,
  Crosshair,
  ChevronRight,
  FileBarChart,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useActiveAccount } from "@/hooks/useActiveAccount";
import { useBotStatus } from "@/hooks/useBotStatus";
import { useTargetQueueCount } from "@/hooks/useTargetQueueCount";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Monitoramento",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Crescimento", url: "/growth", icon: TrendingUp },
      { title: "Atividades", url: "/activity", icon: Activity, badge: "activity" },
      { title: "Relatórios", url: "/reports", icon: FileBarChart },
    ],
  },
  {
    label: "Gerenciamento",
    items: [
      { title: "Fila de Targets", url: "/targets", icon: Crosshair, badge: "targets" },
      { title: "Contas", url: "/accounts", icon: Instagram },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Configurações", url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { signOut } = useAuth();
  const { activeAccountId } = useActiveAccount();
  const { isOnline, status } = useBotStatus(activeAccountId);
  const { pendingCount } = useTargetQueueCount(activeAccountId);
  const [todayActions, setTodayActions] = useState<number>(0);

  const fetchTodayActions = useCallback(async () => {
    if (!activeAccountId) return;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("action_log")
      .select("id", { count: "exact", head: true })
      .eq("ig_account_id", activeAccountId)
      .gte("executed_at", todayStart.toISOString());
    setTodayActions(count ?? 0);
  }, [activeAccountId]);

  useEffect(() => { fetchTodayActions(); }, [fetchTodayActions]);

  useEffect(() => {
    const interval = setInterval(fetchTodayActions, 60000);
    return () => clearInterval(interval);
  }, [fetchTodayActions]);

  return (
    <Sidebar className="border-r border-border/40">
      {/* ─── Brand Header ─── */}
      <SidebarHeader className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent ring-1 ring-primary/15 shadow-lg shadow-primary/5">
            <Sparkles className="h-[18px] w-[18px] text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold tracking-tight gradient-text">Organic</span>
            <p className="text-[10px] font-semibold text-muted-foreground/60 tracking-widest uppercase">Growth Dashboard</p>
          </div>
        </div>
      </SidebarHeader>

      {/* ─── Navigation Groups ─── */}
      <SidebarContent className="px-2 custom-scrollbar">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-0">
            <SidebarGroupLabel className="text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground/50 px-3 pt-4 pb-1.5">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className="relative rounded-lg px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-all hover:bg-secondary/60 hover:text-foreground group"
                        activeClassName="bg-primary/8 text-primary font-semibold ring-1 ring-primary/12"
                      >
                        <item.icon className="mr-2.5 h-4 w-4 transition-colors" />
                        <span className="flex-1">{item.title}</span>
                        {item.badge === "activity" && todayActions > 0 && (
                          <Badge variant="secondary" className="ml-auto h-5 min-w-[22px] px-1.5 text-[10px] font-bold bg-primary/10 text-primary border-0">
                            {todayActions > 999 ? "999+" : todayActions}
                          </Badge>
                        )}
                        {item.badge === "targets" && pendingCount > 0 && (
                          <Badge variant="secondary" className="ml-auto h-5 min-w-[22px] px-1.5 text-[10px] font-bold bg-amber-400/10 text-amber-400 border-0">
                            {pendingCount > 999 ? "999+" : pendingCount}
                          </Badge>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* ─── Footer ─── */}
      <SidebarFooter className="p-3 space-y-2">
        {/* Bot Status Card */}
        <div className={cn(
          "rounded-xl p-3.5 flex items-center gap-3 transition-all",
          isOnline
            ? "bg-emerald-400/5 ring-1 ring-emerald-400/10"
            : "bg-secondary/40 ring-1 ring-border/40"
        )}>
          <div className="relative flex items-center justify-center">
            {isOnline && (
              <span
                className="absolute h-2.5 w-2.5 rounded-full animate-ping opacity-50 bg-emerald-400"
                style={{ animationDuration: "2.5s" }}
              />
            )}
            <span className={cn(
              "relative h-2.5 w-2.5 rounded-full",
              isOnline ? "bg-emerald-400" : "bg-zinc-500"
            )} />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className={cn(
              "text-xs font-semibold",
              isOnline ? "text-emerald-400" : "text-zinc-400"
            )}>
              {isOnline ? "Bot Online" : "Bot Offline"}
            </span>
            {isOnline && status === "running" && (
              <span className="text-[10px] text-muted-foreground/70">Processando targets...</span>
            )}
            {!isOnline && (
              <span className="text-[10px] text-muted-foreground/50">Aguardando conexão</span>
            )}
          </div>
          {isOnline && (
            <ChevronRight className="h-3.5 w-3.5 text-emerald-400/40 shrink-0" />
          )}
        </div>

        {/* Logout */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              className="text-muted-foreground/60 hover:text-destructive hover:bg-destructive/8 rounded-lg transition-colors"
              aria-label="Sair da conta"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span className="text-[13px]">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
