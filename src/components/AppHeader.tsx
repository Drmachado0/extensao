import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveAccount } from "@/hooks/useActiveAccount";
import { useBotStatus } from "@/hooks/useBotStatus";
import { useTheme } from "next-themes";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Wifi, WifiOff, Pause, AlertTriangle, Sun, Moon, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG = {
  online: {
    icon: Wifi,
    pill: "bg-emerald-400/6 ring-1 ring-emerald-400/15",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
    ping: true,
    label: "Online",
  },
  running: {
    icon: Wifi,
    pill: "bg-blue-400/6 ring-1 ring-blue-400/15",
    text: "text-blue-400",
    dot: "bg-blue-400",
    ping: true,
    label: "Processando",
  },
  paused: {
    icon: Pause,
    pill: "bg-amber-400/6 ring-1 ring-amber-400/15",
    text: "text-amber-400",
    dot: "bg-amber-400",
    ping: false,
    label: "Pausado",
  },
  rate_limited: {
    icon: AlertTriangle,
    pill: "bg-amber-400/6 ring-1 ring-amber-400/15",
    text: "text-amber-400",
    dot: "bg-amber-400",
    ping: false,
    label: "Rate Limited",
  },
  challenge_required: {
    icon: AlertTriangle,
    pill: "bg-red-400/6 ring-1 ring-red-400/15",
    text: "text-red-400",
    dot: "bg-red-400",
    ping: false,
    label: "Challenge!",
  },
  offline: {
    icon: WifiOff,
    pill: "bg-zinc-500/6 ring-1 ring-zinc-500/15",
    text: "text-zinc-400",
    dot: "bg-zinc-500",
    ping: false,
    label: "Offline",
  },
} as const;

export function AppHeader() {
  const { user } = useAuth();
  const { accounts, activeAccountId, setActiveAccountId } = useActiveAccount();
  const [displayName, setDisplayName] = useState("Usuário");
  const { isOnline, status, lastSeen, currentMode, isProcessing } = useBotStatus(activeAccountId);
  const { theme, setTheme } = useTheme();
  const [startingSending, setStartingSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchName = async () => {
      const { data } = await supabase
        .from("profiles" as any)
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      if ((data as any)?.full_name) setDisplayName((data as any).full_name);
      else setDisplayName(user.email?.split("@")[0] || "Usuário");
    };
    fetchName();
  }, [user]);

  const handleQuickStart = useCallback(async () => {
    if (!activeAccountId) {
      toast.error("Nenhuma conta selecionada");
      return;
    }
    setStartingSending(true);
    try {
      const { error } = await supabase.rpc("send_bot_command", {
        p_ig_account_id: activeAccountId,
        p_command: "start",
        p_params: {},
      });
      if (error) throw error;
      toast.success("Comando 'Iniciar' enviado!");
    } catch (e: any) {
      toast.error("Erro", { description: e.message });
    } finally {
      setStartingSending(false);
    }
  }, [activeAccountId]);

  const initials = displayName.slice(0, 2).toUpperCase();
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.offline;
  const StatusIcon = cfg.icon;

  const MODE_LABELS: Record<string, string> = {
    seguir: "Seguir",
    seguir_curtir: "Seguir+Curtir",
    curtir: "Só Curtir",
    deixar_seguir: "Unfollow",
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border/30 bg-background/60 backdrop-blur-xl sticky top-0 z-30 px-4">
      <SidebarTrigger />
      <div className="flex items-center gap-2.5">
        {/* Multi-account selector */}
        {accounts.length > 1 && (
          <>
            <Select value={activeAccountId ?? ""} onValueChange={setActiveAccountId}>
              <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs bg-secondary/40 border-border/30 rounded-lg">
                <SelectValue placeholder="Conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id} className="text-xs">
                    @{acc.ig_username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="h-5 w-px bg-border/30" />
          </>
        )}

        {/* Bot status pill */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center gap-2 rounded-full px-3 py-1.5 cursor-default transition-all", cfg.pill)}>
              <div className="relative flex items-center justify-center">
                {cfg.ping && (
                  <span
                    className={cn("absolute h-2 w-2 rounded-full animate-ping opacity-60", cfg.dot)}
                    style={{ animationDuration: "2.5s" }}
                  />
                )}
                <span className={cn("relative h-2 w-2 rounded-full", cfg.dot)} />
              </div>
              <span className={cn("text-xs font-medium", cfg.text)}>{cfg.label}</span>
              {lastSeen && (
                <span className="text-[10px] text-muted-foreground/60 hidden sm:inline">
                  · {formatDistanceToNow(new Date(lastSeen), { addSuffix: true, locale: ptBR })}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs space-y-1">
            <p><strong>Status:</strong> {cfg.label}</p>
            {currentMode && <p><strong>Modo:</strong> {MODE_LABELS[currentMode] ?? currentMode}</p>}
            {lastSeen && (
              <p><strong>Heartbeat:</strong> {formatDistanceToNow(new Date(lastSeen), { addSuffix: true, locale: ptBR })}</p>
            )}
          </TooltipContent>
        </Tooltip>

        {/* Quick start */}
        {isOnline && !isProcessing && (
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs rounded-lg"
            onClick={handleQuickStart}
            disabled={startingSending}
          >
            {startingSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Iniciar
          </Button>
        )}

        <div className="h-5 w-px bg-border/30" />

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-secondary/50 transition-all"
          aria-label="Alternar tema"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="h-5 w-px bg-border/30" />

        {/* User */}
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] font-medium text-muted-foreground/80 hidden sm:inline">{displayName}</span>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/8 text-xs font-semibold text-primary ring-1 ring-primary/10">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
