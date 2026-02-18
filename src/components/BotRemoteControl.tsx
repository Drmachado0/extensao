import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveAccount } from "@/hooks/useActiveAccount";
import { useBotStatus } from "@/hooks/useBotStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Play, Square, UploadCloud, Wifi, WifiOff, AlertTriangle, Loader2,
  Settings2, Users, ListPlus, Trash2, Search, Clock, Calendar, ShieldAlert
} from "lucide-react";
import { startOfDay } from "date-fns";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { showError } from "@/lib/errorHandler";

const MODES = [
  { value: "seguir", label: "Seguir", icon: "👤" },
  { value: "seguir_curtir", label: "Seguir+Curtir", icon: "👤❤️" },
  { value: "curtir", label: "Só Curtir", icon: "❤️" },
  { value: "deixar_seguir", label: "Unfollow", icon: "🚫" },
];

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Wifi }> = {
  online: { label: "Online", color: "bg-emerald-400/15 text-emerald-400 border-emerald-400/30", icon: Wifi },
  running: { label: "Processando", color: "bg-blue-400/15 text-blue-400 border-blue-400/30", icon: Loader2 },
  paused: { label: "Pausado", color: "bg-amber-400/15 text-amber-400 border-amber-400/30", icon: Wifi },
  rate_limited: { label: "Rate Limited", color: "bg-red-400/15 text-red-400 border-red-400/30", icon: AlertTriangle },
  challenge_required: { label: "Challenge!", color: "bg-red-400/15 text-red-400 border-red-400/30", icon: AlertTriangle },
  offline: { label: "Offline", color: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30", icon: WifiOff },
};

const DAYS = [
  { key: "1", label: "Seg" }, { key: "2", label: "Ter" }, { key: "3", label: "Qua" },
  { key: "4", label: "Qui" }, { key: "5", label: "Sex" }, { key: "6", label: "Sáb" },
  { key: "0", label: "Dom" },
];

export default function BotRemoteControl() {
  const { activeAccountId } = useActiveAccount();
  const { isOnline, status, currentMode, likesPerFollow, isProcessing, queueTotal, queueProcessed, delayMin, delayMax, botSchedule } = useBotStatus(activeAccountId);
  const [sending, setSending] = useState<string | null>(null);
  const [localLikes, setLocalLikes] = useState<string | null>(null);

  // Queue state
  const [queueText, setQueueText] = useState("");
  const [sourceAccount, setSourceAccount] = useState("");
  const [scraping, setScraping] = useState(false);
  const [queueCount, setQueueCount] = useState(0);

  // Protection state
  const [actionsHour, setActionsHour] = useState(0);
  const [actionsToday, setActionsToday] = useState(0);
  const [recentErrors, setRecentErrors] = useState<Array<{ status: string; details?: unknown }>>([]);
  const LIMIT_HOUR = 60;
  const LIMIT_DAY = 500;

  // Settings state
  const [dMin, setDMin] = useState(String(delayMin || 25));
  const [dMax, setDMax] = useState(String(delayMax || 45));

  // Schedule state
  const [schedEnabled, setSchedEnabled] = useState(false);
  const [schedStart, setSchedStart] = useState("08:00");
  const [schedStop, setSchedStop] = useState("22:00");
  const [activeDays, setActiveDays] = useState<string[]>(["1","2","3","4","5"]);

  // Sync settings from DB
  useEffect(() => {
    setDMin(String(delayMin || 25));
    setDMax(String(delayMax || 45));
  }, [delayMin, delayMax]);

  useEffect(() => {
    if (botSchedule) {
      setSchedEnabled(botSchedule.enabled ?? false);
      if (botSchedule.days) {
        const active: string[] = [];
        for (const [k, v] of Object.entries(botSchedule.days)) {
          const dayConfig = v as { active?: boolean; start?: string; stop?: string } | undefined;
          if (dayConfig?.active) active.push(k);
          if (dayConfig?.start) setSchedStart(dayConfig.start);
          if (dayConfig?.stop) setSchedStop(dayConfig.stop);
        }
        if (active.length > 0) setActiveDays(active);
      }
    }
  }, [botSchedule]);

  // Fetch protection data
  useEffect(() => {
    if (!activeAccountId) return;
    const fetchProtection = async () => {
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      const todayStart = startOfDay(new Date()).toISOString();

      const [hourRes, dayRes, errRes] = await Promise.all([
        supabase.from("action_log").select("*", { count: "exact", head: true })
          .eq("ig_account_id", activeAccountId).gte("executed_at", oneHourAgo).eq("status", "success"),
        supabase.from("action_log").select("*", { count: "exact", head: true })
          .eq("ig_account_id", activeAccountId).gte("executed_at", todayStart).eq("status", "success"),
        supabase.from("action_log").select("status, details")
          .eq("ig_account_id", activeAccountId).eq("status", "failed")
          .gte("executed_at", oneHourAgo).order("executed_at", { ascending: false }).limit(10),
      ]);
      setActionsHour(hourRes.count ?? 0);
      setActionsToday(dayRes.count ?? 0);
      setRecentErrors(errRes.data ?? []);
    };
    fetchProtection();
    const interval = setInterval(fetchProtection, 30000);
    return () => clearInterval(interval);
  }, [activeAccountId]);

  // Fetch queue count
  useEffect(() => {
    if (!activeAccountId) return;
    const fetchCount = async () => {
      const { count } = await supabase
        .from("target_queue")
        .select("*", { count: "exact", head: true })
        .eq("ig_account_id", activeAccountId)
        .in("status", ["pending", "injected"]);
      setQueueCount(count ?? 0);
    };
    fetchCount();
    const ch = supabase
      .channel(`rt-queue-count-${activeAccountId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "target_queue",
        filter: `ig_account_id=eq.${activeAccountId}`,
      }, fetchCount)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeAccountId]);

  const sendCommand = useCallback(async (command: string, params: Record<string, unknown> = {}) => {
    if (!activeAccountId) { 
      toast.error("Nenhuma conta ativa"); 
      return; 
    }
    setSending(command);
    try {
      logger.info("Sending bot command", { command, params, accountId: activeAccountId });
      const { error: rpcError } = await supabase.rpc("send_bot_command", {
        p_ig_account_id: activeAccountId, p_command: command, p_params: params as any,
      });
      if (rpcError) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error("Não autenticado");
        const { error: insertError } = await supabase.from("bot_commands").insert([{ ig_account_id: activeAccountId, command, params: params as any, status: "pending", user_id: userData.user.id }]);
        if (insertError) throw insertError;
      }
      const label = command === "set_mode" ? MODES.find(m => m.value === params.mode)?.label || params.mode : command;
      logger.info("Bot command sent successfully", { command, label });
      toast.success(`"${label}" enviado!`, { description: "Bridge executará em até 30s." });
    } catch (e: unknown) {
      showError(e, "Erro ao enviar comando");
    } finally { setSending(null); }
  }, [activeAccountId]);

  // Queue handlers
  const addToQueue = useCallback(async () => {
    if (!activeAccountId || !queueText.trim()) return;
    const usernames = queueText.split(/[\n,;]+/).map(u => u.trim().replace(/^@/, "")).filter(u => u.length >= 2 && u.length <= 30);
    if (usernames.length === 0) { toast.error("Nenhum username válido"); return; }
    setSending("add_queue");
    try {
      const { data, error } = await supabase.rpc("add_targets_batch", {
        p_ig_account_id: activeAccountId, p_usernames: usernames, p_source: "manual"
      });
      if (error) throw error;
      toast.success(`${data} usernames adicionados à fila`);
      setQueueText("");
    } catch (e: unknown) { 
      showError(e, "Erro ao adicionar à fila");
    }
    finally { setSending(null); }
  }, [activeAccountId, queueText]);

  const scrapeSource = useCallback(async () => {
    if (!activeAccountId || !sourceAccount.trim()) return;
    const username = sourceAccount.trim().replace(/^@/, "");
    setScraping(true);
    try {
      logger.info("Starting scrape", { username, accountId: activeAccountId });
      await sendCommand("scrape", { username, max_count: 200 });
      toast.success(`Scraping de @${username} iniciado`, { description: "Os seguidores serão adicionados à fila automaticamente." });
      setSourceAccount("");
    } catch (e: unknown) { 
      showError(e, "Erro ao iniciar scraping");
    }
    finally { setScraping(false); }
  }, [activeAccountId, sourceAccount, sendCommand]);

  const clearQueue = useCallback(async () => {
    if (!activeAccountId) return;
    setSending("clear_queue");
    try {
      logger.info("Clearing queue", { accountId: activeAccountId });
      const { error } = await supabase.rpc("clear_target_queue", {
        p_ig_account_id: activeAccountId, 
        p_status: "all"
      });
      if (error) throw error;
      toast.success("Fila limpa");
    } catch (e: unknown) { 
      showError(e, "Erro ao limpar fila");
    }
    finally { setSending(null); }
  }, [activeAccountId]);

  // Settings handlers
  const saveDelay = useCallback(() => {
    const min = parseInt(dMin) || 25;
    const max = parseInt(dMax) || 45;
    sendCommand("set_delay", { min, max });
  }, [dMin, dMax, sendCommand]);

  // Schedule handlers
  const saveSchedule = useCallback(() => {
    const days: Record<string, { active: boolean; start: string; stop: string }> = {};
    DAYS.forEach(d => {
      days[d.key] = { active: activeDays.includes(d.key), start: schedStart, stop: schedStop };
    });
    const schedule = { enabled: schedEnabled, days, randomPause: { enabled: true, minPauseMinutes: 5, maxPauseMinutes: 15, intervalMinutes: 120 } };
    sendCommand("set_schedule", { schedule });
  }, [schedEnabled, activeDays, schedStart, schedStop, sendCommand]);

  const toggleDay = (key: string) => {
    setActiveDays(prev => prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key]);
  };

  const displayMode = currentMode || "seguir_curtir";
  const statusInfo = STATUS_MAP[status] || STATUS_MAP.offline;
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-semibold">Controle Remoto</CardTitle>
        <Badge variant="outline" className={`text-[11px] ${statusInfo.color}`}>
          <StatusIcon className={`mr-1 h-3 w-3 ${status === "running" ? "animate-spin" : ""}`} />
          {statusInfo.label}
        </Badge>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="control" className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-9 mb-3">
            <TabsTrigger value="control" className="text-[11px] px-1 gap-1">
              <span className="hidden sm:inline">Controle</span>
              <span className="sm:hidden">Ctrl</span>
            </TabsTrigger>
            <TabsTrigger value="queue" className="text-[11px] px-1 gap-1">
              Fila
              {queueCount > 0 && <Badge className="ml-0.5 h-4 text-[9px] px-1" variant="secondary">{queueCount > 999 ? "999+" : queueCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-[11px] px-1">Config</TabsTrigger>
            <TabsTrigger value="schedule" className="text-[11px] px-1">
              <span className="hidden sm:inline">Agenda</span>
              <span className="sm:hidden">Agd</span>
            </TabsTrigger>
          </TabsList>

          {/* ===== TAB: CONTROLE ===== */}
          <TabsContent value="control" className="space-y-4 mt-0">
            {/* Start / Stop buttons */}
            <div className="flex gap-2">
              <Button variant={isProcessing ? "outline" : "default"} className="flex-1 gap-2 h-11 px-6"
                disabled={!isOnline || sending === "start" || isProcessing} onClick={() => sendCommand("start")}>
                {sending === "start" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Iniciar
              </Button>
              <Button variant="destructive" className="flex-1 gap-2 h-11 px-6"
                disabled={!isOnline || sending === "stop"} onClick={() => sendCommand("stop")}>
                {sending === "stop" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                Parar
              </Button>
              <Button variant="outline" className="gap-2 h-11"
                disabled={!isOnline || sending === "load_queue"} onClick={() => sendCommand("load_queue")}>
                {sending === "load_queue" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              </Button>
            </div>

            {/* Mode grid 2x2 */}
            <div>
              <span className="text-xs text-muted-foreground mb-2 block">Modo de operação</span>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                {MODES.map((m) => {
                  const isActive = displayMode === m.value;
                  return (
                    <button
                      key={m.value}
                      disabled={!isOnline || !!sending}
                      onClick={() => sendCommand("set_mode", { mode: m.value })}
                      aria-pressed={isActive}
                      className={`flex items-center gap-2 rounded-lg px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all border ${
                        isActive
                          ? "border-primary bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/20"
                          : "border-transparent bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                      } disabled:opacity-50 disabled:pointer-events-none`}
                    >
                      <span className="text-sm sm:text-base">{m.icon}</span>
                      <span className="truncate">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Likes per follow */}
            {(displayMode === "seguir_curtir" || displayMode === "curtir") && (
              <div className="flex items-center gap-3">
                <Settings2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground shrink-0">Curtidas por follow:</span>
                <Input type="number" min={0} max={10} value={localLikes !== null ? localLikes : String(likesPerFollow)}
                  onChange={(e) => { setLocalLikes(e.target.value); const c = parseInt(e.target.value); if (!isNaN(c) && c >= 0 && c <= 10) sendCommand("set_likes", { count: c }); }}
                  disabled={!isOnline || !!sending} className="h-8 w-16 text-xs text-center" />
              </div>
            )}

            {!isOnline && (
              <p className="text-xs text-muted-foreground text-center py-1">
                {status === "challenge_required" ? "⚠️ Instagram pediu verificação." : "Bridge offline. Abra o Instagram com a extensão."}
              </p>
            )}
          </TabsContent>

          {/* ===== TAB: FILA ===== */}
          <TabsContent value="queue" className="space-y-3 mt-0">
            {/* Adicionar usernames manualmente */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <ListPlus className="h-3 w-3" /> Adicionar usernames (1 por linha)
              </label>
              <textarea
                value={queueText}
                onChange={(e) => setQueueText(e.target.value)}
                placeholder={"username1\nusername2\nusername3"}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
              <Button size="sm" className="w-full gap-1.5" onClick={addToQueue}
                disabled={!queueText.trim() || sending === "add_queue"}>
                {sending === "add_queue" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ListPlus className="h-3.5 w-3.5" />}
                Adicionar à fila
              </Button>
            </div>

            {/* Scrape de conta-fonte */}
            <div className="space-y-2 pt-2 border-t border-border/30">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Search className="h-3 w-3" /> Buscar seguidores de uma conta
              </label>
              <div className="flex gap-2">
                <Input value={sourceAccount} onChange={(e) => setSourceAccount(e.target.value)}
                  placeholder="@conta_fonte" className="h-8 text-xs" />
                <Button size="sm" variant="secondary" className="shrink-0 gap-1"
                  disabled={!isOnline || !sourceAccount.trim() || scraping} onClick={scrapeSource}>
                  {scraping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5" />}
                  Scrape
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Busca até 200 seguidores e adiciona à fila. Requer bridge online.
              </p>
            </div>

            {/* Status da fila */}
            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <div className="text-xs text-muted-foreground">
                <Users className="h-3 w-3 inline mr-1" />
                {queueCount} pendentes na fila
                {queueTotal > 0 && ` (${queueProcessed}/${queueTotal})`}
              </div>
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                disabled={queueCount === 0 || sending === "clear_queue"} onClick={clearQueue}>
                <Trash2 className="h-3 w-3" /> Limpar
              </Button>
            </div>
          </TabsContent>

          {/* ===== TAB: CONFIGURAÇÕES ===== */}
          <TabsContent value="settings" className="space-y-3 mt-0">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Delay entre ações (segundos)</label>
              <div className="flex items-center gap-2">
                <Input type="number" min={5} max={120} value={dMin} onChange={(e) => setDMin(e.target.value)}
                  className="h-8 w-20 text-xs text-center" placeholder="Min" />
                <span className="text-xs text-muted-foreground">a</span>
                <Input type="number" min={10} max={300} value={dMax} onChange={(e) => setDMax(e.target.value)}
                  className="h-8 w-20 text-xs text-center" placeholder="Max" />
                <span className="text-xs text-muted-foreground">seg</span>
                <Button size="sm" variant="secondary" className="h-8 text-xs shrink-0" onClick={saveDelay}
                  disabled={!isOnline || !!sending}>
                  Salvar
                </Button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/30">
              <label className="text-xs text-muted-foreground">Atalhos</label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs"
                  disabled={!isOnline} onClick={() => sendCommand("load_queue")}>
                  📋 Carregar Fila
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs"
                  disabled={!isOnline} onClick={() => sendCommand("debug")}>
                  🔍 Debug DOM
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ===== TAB: AGENDAMENTO ===== */}
          <TabsContent value="schedule" className="space-y-3 mt-0">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Agendamento automático
              </label>
              <Switch checked={schedEnabled} onCheckedChange={setSchedEnabled} />
            </div>

            {schedEnabled && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground w-12">Início:</label>
                  <Input type="time" value={schedStart} onChange={(e) => setSchedStart(e.target.value)}
                    className="h-8 text-xs w-28" />
                  <label className="text-xs text-muted-foreground w-10 text-right">Fim:</label>
                  <Input type="time" value={schedStop} onChange={(e) => setSchedStop(e.target.value)}
                    className="h-8 text-xs w-28" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Dias ativos
                  </label>
                  <div className="flex gap-1.5">
                    {DAYS.map(d => (
                      <button key={d.key} onClick={() => toggleDay(d.key)}
                        className={`w-9 h-7 rounded text-[10px] font-semibold border transition-colors ${
                          activeDays.includes(d.key)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                        }`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button size="sm" className="w-full gap-1.5" onClick={saveSchedule} disabled={!!sending}>
                  {sending === "set_schedule" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5" />}
                  Salvar Agendamento
                </Button>
              </>
            )}

            {!schedEnabled && (
              <p className="text-xs text-muted-foreground text-center py-1">
                Ative para o bot iniciar/parar automaticamente nos horários definidos.
              </p>
            )}
          </TabsContent>
        </Tabs>

        {/* ===== PROTEÇÃO DA CONTA ===== */}
        <div className="mt-4 pt-4 border-t border-border/30 space-y-3">
          <h4 className="text-xs font-semibold flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" /> 🛡️ Proteção da Conta
          </h4>

          <div className="grid grid-cols-2 gap-3">
            {/* Ações/Hora */}
            {(() => {
              const pctHour = Math.min((actionsHour / LIMIT_HOUR) * 100, 100);
              const colorHour = pctHour > 85 ? "bg-destructive" : pctHour > 60 ? "bg-amber-500" : "bg-emerald-500";
              return (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-muted-foreground">Ações/Hora</span>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className={`h-full rounded-full transition-all ${colorHour}`} style={{ width: `${pctHour}%` }} />
                  </div>
                  <span className="text-[11px] font-medium">{actionsHour}/{LIMIT_HOUR} esta hora</span>
                </div>
              );
            })()}

            {/* Ações Hoje */}
            {(() => {
              const pctDay = Math.min((actionsToday / LIMIT_DAY) * 100, 100);
              const colorDay = pctDay > 85 ? "bg-destructive" : pctDay > 60 ? "bg-amber-500" : "bg-emerald-500";
              return (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-muted-foreground">Ações Hoje</span>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className={`h-full rounded-full transition-all ${colorDay}`} style={{ width: `${pctDay}%` }} />
                  </div>
                  <span className="text-[11px] font-medium">{actionsToday}/{LIMIT_DAY} hoje</span>
                </div>
              );
            })()}
          </div>

          {/* Alertas */}
          {status === "rate_limited" && (
            <Alert variant="destructive" className="py-2">
              <AlertTriangle className="h-3.5 w-3.5" />
              <AlertDescription className="text-xs">
                Rate limit ativo — o bot pausou para proteger sua conta.
              </AlertDescription>
            </Alert>
          )}

          {status !== "rate_limited" && recentErrors.some((e) => {
            const d = typeof e.details === "string" ? e.details : JSON.stringify(e.details ?? "");
            return d.includes("rate_limit") || d.includes("429");
          }) && (
            <Alert className="py-2 border-amber-500/30 bg-amber-500/10">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <AlertDescription className="text-xs text-amber-500">
                Rate limit detectado recentemente — considere reduzir a velocidade.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
