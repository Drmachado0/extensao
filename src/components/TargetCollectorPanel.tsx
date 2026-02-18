import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Search,
  Users,
  UserPlus,
  Hash,
  MapPin,
  Loader2,
  ChevronDown,
  ChevronUp,
  Settings2,
  Bell,
  Terminal,
  RefreshCw,
  Zap,
  Volume2,
  VolumeX,
  Mail,
  Webhook,
  Monitor,
  Radio,
  Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ────────── Types ────────── */

interface ScrapeConfig {
  delayBetweenReqs: number;
  waitAfter429: number;
  waitAfter403: number;
  maxAccounts: number;
  autoExport: boolean;
}

interface NotificationConfig {
  desktop: boolean;
  sound: boolean;
  emailSummary: boolean;
  webhook: boolean;
  webhookUrl: string;
}

type CollectType = "followers" | "following" | "hashtag" | "location";

interface LogEntry {
  id: string;
  time: string;
  message: string;
  type: "info" | "success" | "error" | "warn";
}

/* ────────── Constants ────────── */

const COLLECT_TYPES: { value: CollectType; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { value: "followers", label: "Seguidores", icon: Users, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30 hover:bg-emerald-400/20" },
  { value: "following", label: "Seguindo", icon: UserPlus, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30 hover:bg-blue-400/20" },
  { value: "hashtag", label: "Hashtag", icon: Hash, color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/30 hover:bg-purple-400/20" },
  { value: "location", label: "Localização", icon: MapPin, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/30 hover:bg-amber-400/20" },
];

const DEFAULT_SCRAPE_CONFIG: ScrapeConfig = {
  delayBetweenReqs: 2,
  waitAfter429: 120,
  waitAfter403: 600,
  maxAccounts: 0,
  autoExport: false,
};

const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  desktop: true,
  sound: true,
  emailSummary: false,
  webhook: false,
  webhookUrl: "",
};

const STORAGE_KEY_SCRAPE = "organic_scrape_config";
const STORAGE_KEY_NOTIF = "organic_notification_config";

/* ────────── Props ────────── */

interface Props {
  activeAccountId: string | null;
  igUsername?: string;
  profilePicUrl?: string;
  onRefresh: () => void;
}

/* ────────── Component ────────── */

export default function TargetCollectorPanel({ activeAccountId, igUsername, profilePicUrl, onRefresh }: Props) {
  // Collect state
  const [targetInput, setTargetInput] = useState("");
  const [maxCount, setMaxCount] = useState("200");
  const [collectType, setCollectType] = useState<CollectType>("followers");
  const [collecting, setCollecting] = useState(false);

  // Config
  const [scrapeConfig, setScrapeConfig] = useState<ScrapeConfig>(() => {
    try { return { ...DEFAULT_SCRAPE_CONFIG, ...JSON.parse(localStorage.getItem(STORAGE_KEY_SCRAPE) || "{}") }; }
    catch { return DEFAULT_SCRAPE_CONFIG; }
  });
  const [notifConfig, setNotifConfig] = useState<NotificationConfig>(() => {
    try { return { ...DEFAULT_NOTIFICATION_CONFIG, ...JSON.parse(localStorage.getItem(STORAGE_KEY_NOTIF) || "{}") }; }
    catch { return DEFAULT_NOTIFICATION_CONFIG; }
  });

  // Sections open state
  const [configOpen, setConfigOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(true);

  // Log
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Persist config
  useEffect(() => { localStorage.setItem(STORAGE_KEY_SCRAPE, JSON.stringify(scrapeConfig)); }, [scrapeConfig]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_NOTIF, JSON.stringify(notifConfig)); }, [notifConfig]);

  const addLog = useCallback((message: string, type: LogEntry["type"] = "info") => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    setLogs((prev) => [...prev.slice(-49), { id: `${Date.now()}-${Math.random()}`, time, message, type }]);
  }, []);

  // Auto-scroll log
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  // Realtime log from bot_commands
  useEffect(() => {
    if (!activeAccountId) return;

    const channel = supabase
      .channel(`rt-collector-log-${activeAccountId}`)
      .on("postgres_changes" as any, {
        event: "UPDATE",
        schema: "public",
        table: "bot_commands",
        filter: `ig_account_id=eq.${activeAccountId}`,
      }, (payload: any) => {
        const cmd = payload.new;
        if (cmd.command === "scrape" || cmd.command === "scrape_followers" || cmd.command === "scrape_following" || cmd.command === "scrape_hashtag" || cmd.command === "scrape_location") {
          if (cmd.status === "completed") {
            const count = cmd.result?.count ?? cmd.result?.total ?? "?";
            addLog(`Coleta finalizada: ${count} contas coletadas`, "success");
            sendNotifications(`Coleta finalizada: ${count} contas coletadas`);
            onRefresh();
          } else if (cmd.status === "failed") {
            addLog(`Erro na coleta: ${cmd.result?.error ?? "erro desconhecido"}`, "error");
          } else if (cmd.status === "executing") {
            addLog(`Bridge executando coleta...`, "info");
          }
        }
      })
      .on("postgres_changes" as any, {
        event: "INSERT",
        schema: "public",
        table: "target_queue",
        filter: `ig_account_id=eq.${activeAccountId}`,
      }, () => {
        // Batch notification for inserts handled elsewhere
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeAccountId, addLog, onRefresh]);

  /* ── Notifications ── */
  const sendNotifications = useCallback((message: string) => {
    if (notifConfig.desktop && "Notification" in window && Notification.permission === "granted") {
      new Notification("Organic Collector", { body: message, icon: "/favicon.ico" });
    }
    if (notifConfig.sound) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        gain.gain.value = 0.1;
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.value = 1200;
          gain2.gain.value = 0.1;
          osc2.start();
          osc2.stop(ctx.currentTime + 0.15);
        }, 180);
      } catch { /* audio not available */ }
    }
    if (notifConfig.webhook && notifConfig.webhookUrl.trim()) {
      fetch(notifConfig.webhookUrl.trim(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message, source: "organic_collector", timestamp: new Date().toISOString() }),
      }).catch(() => {});
    }
  }, [notifConfig]);

  // Request desktop notification permission
  const requestNotifPermission = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  /* ── Collect handler ── */
  const handleCollect = async () => {
    if (!activeAccountId || !targetInput.trim()) return;

    const input = targetInput.trim().replace(/^[@#]/, "");
    if (input.length < 2) { toast.error("Input inválido"); return; }

    setCollecting(true);

    const commandMap: Record<CollectType, string> = {
      followers: "scrape",
      following: "scrape_following",
      hashtag: "scrape_hashtag",
      location: "scrape_location",
    };

    const params: Record<string, any> = {
      max_count: parseInt(maxCount),
      delay: scrapeConfig.delayBetweenReqs,
      wait_429: scrapeConfig.waitAfter429,
      wait_403: scrapeConfig.waitAfter403,
      max_accounts: scrapeConfig.maxAccounts,
      auto_export: scrapeConfig.autoExport,
    };

    if (collectType === "hashtag") {
      params.hashtag = input;
    } else if (collectType === "location") {
      params.location = input;
    } else {
      params.username = input;
    }

    addLog(`Enviando comando: coletar ${COLLECT_TYPES.find((c) => c.value === collectType)?.label.toLowerCase()} de "${input}"`, "info");

    try {
      const { error } = await supabase.rpc("send_bot_command", {
        p_ig_account_id: activeAccountId,
        p_command: commandMap[collectType],
        p_params: params,
      });

      if (error) {
        // Fallback: insert directly
        const { error: insertError } = await supabase.from("bot_commands").insert({
          ig_account_id: activeAccountId,
          command: commandMap[collectType],
          params,
          status: "pending",
        } as any);
        if (insertError) throw insertError;
      }

      const typeLabel = COLLECT_TYPES.find((c) => c.value === collectType)?.label ?? collectType;
      addLog(`Comando enviado! Bridge buscará ${typeLabel.toLowerCase()} de "${input}" (max: ${maxCount})`, "success");
      toast.success("Comando enviado!", { description: `Bridge buscará ${typeLabel.toLowerCase()} de ${input}` });
      setTargetInput("");
    } catch (e: any) {
      addLog(`Erro ao enviar comando: ${e.message}`, "error");
      toast.error("Erro ao enviar comando", { description: e.message });
    } finally {
      setCollecting(false);
    }
  };

  const updateScrapeConfig = <K extends keyof ScrapeConfig>(key: K, value: ScrapeConfig[K]) => {
    setScrapeConfig((prev) => ({ ...prev, [key]: value }));
  };

  const updateNotifConfig = <K extends keyof NotificationConfig>(key: K, value: NotificationConfig[K]) => {
    setNotifConfig((prev) => ({ ...prev, [key]: value }));
  };

  const getPlaceholder = () => {
    switch (collectType) {
      case "hashtag": return "#hashtag_alvo";
      case "location": return "ID ou nome da localização";
      default: return "@perfil_alvo";
    }
  };

  return (
    <Card className="border-primary/20 overflow-hidden">
      <CardContent className="p-0">
        {/* ═══ Perfil Atual ═══ */}
        <div className="p-4 pb-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Perfil Atual</h3>
          {igUsername ? (
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 border border-border/30">
              {profilePicUrl ? (
                <img src={profilePicUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{igUsername.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">@{igUsername}</p>
                <p className="text-[10px] text-muted-foreground">Conta ativa</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge className="bg-emerald-400/10 text-emerald-400 border-0 text-[10px] gap-1">
                  <Radio className="h-2.5 w-2.5" />
                  Conectado
                </Badge>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-secondary/20 border border-border/30 text-center">
              <p className="text-xs text-muted-foreground">Navegue até um perfil do Instagram</p>
            </div>
          )}
        </div>

        <Separator className="bg-border/30" />

        {/* ═══ Coletar ═══ */}
        <div className="p-4 space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Coletar</h3>

          {/* Collection type buttons */}
          <div className="grid grid-cols-2 gap-2">
            {COLLECT_TYPES.map((ct) => {
              const Icon = ct.icon;
              const isActive = collectType === ct.value;
              return (
                <button key={ct.value} onClick={() => setCollectType(ct.value)}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                    isActive ? `${ct.bg} ${ct.color} border-current/30 ring-1 ring-inset ring-current/20 shadow-sm` : "border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                  }`}>
                  <Icon className="h-4 w-4" />
                  {ct.label}
                </button>
              );
            })}
          </div>

          {/* Target input */}
          <Input value={targetInput} onChange={(e) => setTargetInput(e.target.value)} placeholder={getPlaceholder()}
            className="h-10 text-sm" onKeyDown={(e) => { if (e.key === "Enter") handleCollect(); }} />

          {/* Count + Collect button */}
          <div className="flex gap-2">
            <Select value={maxCount} onValueChange={setMaxCount}>
              <SelectTrigger className="h-10 w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["50", "100", "200", "500", "1000", "2000", "5000"].map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="flex-1 gap-2 h-10" disabled={!targetInput.trim() || collecting || !activeAccountId} onClick={handleCollect}>
              {collecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Coletar {COLLECT_TYPES.find((c) => c.value === collectType)?.label}
            </Button>
          </div>
        </div>

        <Separator className="bg-border/30" />

        {/* ═══ Configurações ═══ */}
        <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary/15 transition-colors">
              <div className="flex items-center gap-2">
                <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Configurações</span>
              </div>
              {configOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-3">
              <ConfigRow label="Delay entre req. (s)" value={scrapeConfig.delayBetweenReqs}
                onChange={(v) => updateScrapeConfig("delayBetweenReqs", v)} min={0} max={30} />
              <ConfigRow label="Espera após 429 (s)" value={scrapeConfig.waitAfter429}
                onChange={(v) => updateScrapeConfig("waitAfter429", v)} min={10} max={3600} />
              <ConfigRow label="Espera após 403 (s)" value={scrapeConfig.waitAfter403}
                onChange={(v) => updateScrapeConfig("waitAfter403", v)} min={10} max={3600} />
              <ConfigRow label="Limite contas (0=∞)" value={scrapeConfig.maxAccounts}
                onChange={(v) => updateScrapeConfig("maxAccounts", v)} min={0} max={100000} />

              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Auto-exportar ao finalizar</label>
                <Checkbox checked={scrapeConfig.autoExport}
                  onCheckedChange={(v) => updateScrapeConfig("autoExport", v === true)} className="h-4 w-4" />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator className="bg-border/30" />

        {/* ═══ Notificações ao Finalizar ═══ */}
        <Collapsible open={notifOpen} onOpenChange={setNotifOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary/15 transition-colors">
              <div className="flex items-center gap-2">
                <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Notificações ao Finalizar</span>
              </div>
              {notifOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-2.5">
              <NotifToggle icon={Monitor} label="Notificação Desktop" checked={notifConfig.desktop}
                onChange={(v) => { updateNotifConfig("desktop", v); if (v) requestNotifPermission(); }} />
              <NotifToggle icon={notifConfig.sound ? Volume2 : VolumeX} label="Alerta Sonoro" checked={notifConfig.sound}
                onChange={(v) => updateNotifConfig("sound", v)} />
              <NotifToggle icon={Mail} label="Abrir Email com resumo" checked={notifConfig.emailSummary}
                onChange={(v) => updateNotifConfig("emailSummary", v)} />
              <NotifToggle icon={Webhook} label="Enviar Webhook" checked={notifConfig.webhook}
                onChange={(v) => updateNotifConfig("webhook", v)} />
              {notifConfig.webhook && (
                <Input placeholder="https://hooks.example.com/..." className="h-8 text-xs bg-secondary/20 ml-6"
                  value={notifConfig.webhookUrl} onChange={(e) => updateNotifConfig("webhookUrl", e.target.value)} />
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator className="bg-border/30" />

        {/* ═══ Log ═══ */}
        <Collapsible open={logOpen} onOpenChange={setLogOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary/15 transition-colors">
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Log</span>
                {logs.length > 0 && (
                  <Badge className="bg-primary/10 text-primary border-0 text-[9px] h-4 px-1.5">{logs.length}</Badge>
                )}
              </div>
              {logOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4">
              <div className="rounded-lg bg-zinc-950/50 border border-border/30 p-3 max-h-[200px] overflow-y-auto scrollbar-none font-mono text-[11px] space-y-1">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground/50 text-center py-3">Nenhuma atividade registrada</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className={`flex gap-2 ${
                      log.type === "success" ? "text-emerald-400" : log.type === "error" ? "text-red-400" : log.type === "warn" ? "text-amber-400" : "text-muted-foreground"
                    }`}>
                      <span className="text-muted-foreground/50 shrink-0">{log.time}</span>
                      <span>{log.message}</span>
                    </div>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
              {logs.length > 0 && (
                <button onClick={() => setLogs([])} className="text-[10px] text-muted-foreground hover:text-foreground mt-1.5 transition-colors">
                  Limpar log
                </button>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

/* ────────── Subcomponents ────────── */

function ConfigRow({ label, value, onChange, min, max }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-xs text-muted-foreground">{label}</label>
      <Input type="number" className="h-8 w-20 text-xs text-right bg-secondary/20 tabular-nums"
        value={value} onChange={(e) => { const v = parseInt(e.target.value) || 0; onChange(Math.max(min, Math.min(max, v))); }} min={min} max={max} />
    </div>
  );
}

function NotifToggle({ icon: Icon, label, checked, onChange }: {
  icon: React.ElementType; label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} className="h-4 w-4" />
      <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
    </label>
  );
}
