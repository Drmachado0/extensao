import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveAccount } from "@/hooks/useActiveAccount";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Copy, Check, Wifi, WifiOff, Key, User, Bell, Database, Info,
  Download, Trash2, AlertTriangle, ExternalLink, Settings2, Clock, Calendar,
} from "lucide-react";
import { differenceInMinutes } from "date-fns";
import { cn } from "@/lib/utils";

const APP_VERSION = "1.1.0";

const DAYS = [
  { key: "1", label: "Seg" }, { key: "2", label: "Ter" }, { key: "3", label: "Qua" },
  { key: "4", label: "Qui" }, { key: "5", label: "Sex" }, { key: "6", label: "Sáb" },
  { key: "0", label: "Dom" },
];

const SettingsPage = () => {
  const { user } = useAuth();
  const { activeAccountId } = useActiveAccount();
  // Bridge
  const [bridgeConnected, setBridgeConnected] = useState(false);
  const [bridgeAccountId, setBridgeAccountId] = useState<string | null>(null);
  const [bridgeToken, setBridgeToken] = useState("");
  const [tokenCopied, setTokenCopied] = useState(false);

  // Profile
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Notifications
  const [notifOffline, setNotifOffline] = useState(true);
  const [notifRateLimit, setNotifRateLimit] = useState(true);
  const [notifDaily, setNotifDaily] = useState(false);

  // Bot config
  const [botDelayMin, setBotDelayMin] = useState("20");
  const [botDelayMax, setBotDelayMax] = useState("45");
  const [botMaxActions, setBotMaxActions] = useState("200");
  const [maxFollowsPerDay, setMaxFollowsPerDay] = useState("");
  const [maxLikesPerDay, setMaxLikesPerDay] = useState("");
  const [maxCommentsPerDay, setMaxCommentsPerDay] = useState("");
  const [maxUnfollowsPerDay, setMaxUnfollowsPerDay] = useState("");
  const [schedEnabled, setSchedEnabled] = useState(false);
  const [schedStart, setSchedStart] = useState("08:00");
  const [schedStop, setSchedStop] = useState("22:00");
  const [schedActiveDays, setSchedActiveDays] = useState<string[]>(["1","2","3","4","5"]);
  const [savingBot, setSavingBot] = useState(false);

  // Notification save
  const [savingNotif, setSavingNotif] = useState(false);

  // Data dialogs
  const [clearLogsOpen, setClearLogsOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const fetchSettings = useCallback(async () => {
    if (!user) return;

    setEmail(user.email ?? "");
    setFullName(user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "");

    let q = supabase
      .from("ig_accounts")
      .select("id, bot_online, last_heartbeat, delay_min, delay_max, max_actions_per_session, max_follows_per_day, max_likes_per_day, max_comments_per_day, max_unfollows_per_day, bot_schedule")
      .eq("user_id", user.id);
    if (activeAccountId) q = q.eq("id", activeAccountId);
    else q = q.eq("is_active", true);
    const { data: account } = await q.maybeSingle();

    if (account) {
      setBridgeAccountId(account.id);
      const online = account.bot_online && account.last_heartbeat &&
        differenceInMinutes(new Date(), new Date(account.last_heartbeat)) <= 5;
      setBridgeConnected(!!online);
      // Bot config
      setBotDelayMin(String(account.delay_min ?? 20));
      setBotDelayMax(String(account.delay_max ?? 45));
      setBotMaxActions(String(account.max_actions_per_session ?? 200));
      setMaxFollowsPerDay(account.max_follows_per_day != null ? String(account.max_follows_per_day) : "");
      setMaxLikesPerDay(account.max_likes_per_day != null ? String(account.max_likes_per_day) : "");
      setMaxCommentsPerDay(account.max_comments_per_day != null ? String(account.max_comments_per_day) : "");
      setMaxUnfollowsPerDay(account.max_unfollows_per_day != null ? String(account.max_unfollows_per_day) : "");
      if (account.bot_schedule) {
        const sched = account.bot_schedule as any;
        setSchedEnabled(sched.enabled ?? false);
        if (sched.days) {
          const active: string[] = [];
          for (const [k, v] of Object.entries(sched.days)) {
            if ((v as any)?.active) active.push(k);
            if ((v as any)?.start) setSchedStart((v as any).start);
            if ((v as any)?.stop) setSchedStop((v as any).stop);
          }
          if (active.length > 0) setSchedActiveDays(active);
        }
      }
    }

    // Notification preferences (user_settings.settings_json.notifications)
    const { data: settingsRow } = await supabase.from("user_settings").select("settings_json").eq("user_id", user.id).maybeSingle();
    const json = (settingsRow?.settings_json as Record<string, unknown>) || {};
    const notif = (json.notifications as Record<string, boolean>) || {};
    setNotifOffline(notif.bot_offline ?? true);
    setNotifRateLimit(notif.rate_limit ?? true);
    setNotifDaily(notif.daily_report ?? false);
  }, [user, activeAccountId]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // Generate token
  const generateToken = async () => {
    if (!activeAccountId) { toast.error("Adicione uma conta Instagram primeiro."); return; }
    const { data, error } = await supabase.rpc("generate_bridge_token", { p_ig_account_id: activeAccountId });
    if (error || !data) { toast.error("Erro ao gerar token."); return; }
    setBridgeToken(data);
    toast.success("Token gerado!");
  };

  const copyToken = () => {
    navigator.clipboard.writeText(bridgeToken);
    setTokenCopied(true);
    toast.success("Token copiado!");
    setTimeout(() => setTokenCopied(false), 2000);
  };

  const saveNotificationPrefs = async () => {
    if (!user) return;
    setSavingNotif(true);
    const { data: existing } = await supabase.from("user_settings").select("id, settings_json").eq("user_id", user.id).maybeSingle();
    const current = (existing?.settings_json as Record<string, unknown>) || {};
    const updated = { ...current, notifications: { bot_offline: notifOffline, rate_limit: notifRateLimit, daily_report: notifDaily } };
    const { error } = existing
      ? await supabase.from("user_settings").update({ settings_json: updated }).eq("user_id", user.id)
      : await supabase.from("user_settings").insert({ user_id: user.id, settings_json: updated });
    setSavingNotif(false);
    if (error) { toast.error("Erro ao salvar preferências"); return; }
    toast.success("Preferências de notificação salvas!");
  };

  // Save profile
  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
    setSavingProfile(false);
    if (error) { toast.error("Erro ao salvar perfil."); return; }
    toast.success("Perfil atualizado!");
  };

  // Export data
  const exportData = async () => {
    if (!user) return;
    toast.info("Exportando dados...");
    const [accounts, actions, growth, sessions] = await Promise.all([
      supabase.from("ig_accounts").select("*").eq("user_id", user.id),
      supabase.from("action_log").select("*").eq("user_id", user.id).order("executed_at", { ascending: false }).limit(1000),
      supabase.from("growth_stats").select("*").eq("user_id", user.id).order("recorded_at", { ascending: false }).limit(1000),
      supabase.from("session_stats").select("*").eq("user_id", user.id).order("session_end", { ascending: false }).limit(500),
    ]);
    const payload = {
      exported_at: new Date().toISOString(),
      ig_accounts: accounts.data ?? [],
      action_log: actions.data ?? [],
      growth_stats: growth.data ?? [],
      session_stats: sessions.data ?? [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `growbot-data-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Dados exportados!");
  };

  // Save bot config
  const saveBotConfig = async () => {
    const id = activeAccountId;
    if (!id) { toast.error("Nenhuma conta ativa"); return; }
    setSavingBot(true);
    const days: Record<string, any> = {};
    DAYS.forEach(d => {
      days[d.key] = { active: schedActiveDays.includes(d.key), start: schedStart, stop: schedStop };
    });
    const bot_schedule = { enabled: schedEnabled, days, randomPause: { enabled: true, minPauseMinutes: 5, maxPauseMinutes: 15, intervalMinutes: 120 } };
    const { error } = await supabase.from("ig_accounts").update({
      delay_min: parseInt(botDelayMin) || 20,
      delay_max: parseInt(botDelayMax) || 45,
      max_actions_per_session: parseInt(botMaxActions) || 200,
      max_follows_per_day: maxFollowsPerDay.trim() ? parseInt(maxFollowsPerDay) || null : null,
      max_likes_per_day: maxLikesPerDay.trim() ? parseInt(maxLikesPerDay) || null : null,
      max_comments_per_day: maxCommentsPerDay.trim() ? parseInt(maxCommentsPerDay) || null : null,
      max_unfollows_per_day: maxUnfollowsPerDay.trim() ? parseInt(maxUnfollowsPerDay) || null : null,
      bot_schedule,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    setSavingBot(false);
    if (error) { toast.error("Erro ao salvar", { description: error.message }); return; }
    toast.success("Configurações do bot salvas!");
  };

  const toggleSchedDay = (key: string) => {
    setSchedActiveDays(prev => prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key]);
  };

  // Clear logs
  const clearLogs = async () => {
    if (!user) return;
    const { error } = await supabase.from("action_log").delete().eq("user_id", user.id);
    setClearLogsOpen(false);
    if (error) { toast.error("Erro ao limpar logs."); return; }
    toast.success("Logs removidos!");
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!user) return;
    await Promise.all([
      supabase.from("action_log").delete().eq("user_id", user.id),
      supabase.from("growth_stats").delete().eq("user_id", user.id),
      supabase.from("session_stats").delete().eq("user_id", user.id),
      supabase.from("bridge_tokens").delete().eq("user_id", user.id),
      supabase.from("ig_accounts").delete().eq("user_id", user.id),
    ]);
    await supabase.auth.signOut();
    setDeleteStep(0);
    toast.success("Conta excluída. Você será redirecionado.");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>

      {/* SECTION 1 — Bridge */}
       <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wifi className="h-4 w-4" /> Conexão da Extensão Bridge
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            Status:
            <Badge variant="outline" className={cn("text-xs", bridgeConnected ? "bg-success/15 text-success border-success/30" : "bg-secondary text-muted-foreground")}>
              {bridgeConnected ? "Conectada" : "Desconectada"}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={generateToken} className="gap-2">
              <Key className="h-4 w-4" /> Gerar Novo Token
            </Button>
          </div>

          {bridgeToken && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Token gerado</Label>
              <div className="flex gap-2">
                <Input readOnly value={bridgeToken} className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={copyToken} className="shrink-0">
                  {tokenCopied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-warning flex items-center gap-1.5">⚠️ Este token só será mostrado uma vez.</p>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">Como conectar a extensão:</p>
            <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
              <li>Instale a extensão <span className="text-foreground font-medium">GrowBot Bridge</span> no Chrome</li>
              <li>Clique no ícone da extensão na barra do Chrome</li>
              <li>Cole o token gerado acima</li>
              <li>Clique em <span className="text-foreground font-medium">Conectar</span></li>
              <li>Mantenha o Instagram aberto com o GrowBot ativo</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2 — Profile */}
       <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4" /> Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} readOnly className="text-muted-foreground" />
          </div>
          <Button onClick={saveProfile} disabled={savingProfile}>
            {savingProfile ? "Salvando..." : "Salvar alterações"}
          </Button>
        </CardContent>
      </Card>

      {/* SECTION 3 — Notifications */}
       <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4" /> Notificações</CardTitle>
          <CardDescription>Receba alertas por email (requer Edge Function e serviço de email configurado).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Notificar quando bot ficar offline</Label>
            <Switch checked={notifOffline} onCheckedChange={setNotifOffline} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Notificar rate limits</Label>
            <Switch checked={notifRateLimit} onCheckedChange={setNotifRateLimit} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Relatório diário por email</Label>
            <Switch checked={notifDaily} onCheckedChange={setNotifDaily} />
          </div>
          <Button onClick={saveNotificationPrefs} disabled={savingNotif} size="sm">
            {savingNotif ? "Salvando..." : "Salvar preferências"}
          </Button>
        </CardContent>
      </Card>

      {/* SECTION — Bot Config */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Settings2 className="h-4 w-4" /> ⚙️ Configurações do Bot</CardTitle>
          <CardDescription>Ajuste delays, limites e agendamento do bot.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Delay */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Delay entre ações (segundos)</Label>
            <div className="flex items-center gap-2">
              <div className="space-y-1 flex-1">
                <Label className="text-xs text-muted-foreground">Mínimo</Label>
                <Input type="number" min={5} max={120} value={botDelayMin} onChange={(e) => setBotDelayMin(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1 flex-1">
                <Label className="text-xs text-muted-foreground">Máximo</Label>
                <Input type="number" min={10} max={300} value={botDelayMax} onChange={(e) => setBotDelayMax(e.target.value)} className="h-9" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Max actions */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Máximo de ações por sessão</Label>
            <Input type="number" min={10} max={1000} value={botMaxActions} onChange={(e) => setBotMaxActions(e.target.value)} className="h-9 w-32" />
          </div>

          <Separator />

          {/* Daily limits per action type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Limites diários por tipo (opcional)</Label>
            <p className="text-xs text-muted-foreground">Deixe vazio para sem limite. A extensão respeita esses tetos por dia.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Follows/dia</Label>
                <Input type="number" min={0} placeholder="—" value={maxFollowsPerDay} onChange={(e) => setMaxFollowsPerDay(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Likes/dia</Label>
                <Input type="number" min={0} placeholder="—" value={maxLikesPerDay} onChange={(e) => setMaxLikesPerDay(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Comentários/dia</Label>
                <Input type="number" min={0} placeholder="—" value={maxCommentsPerDay} onChange={(e) => setMaxCommentsPerDay(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Unfollows/dia</Label>
                <Input type="number" min={0} placeholder="—" value={maxUnfollowsPerDay} onChange={(e) => setMaxUnfollowsPerDay(e.target.value)} className="h-9" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Schedule */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Agendamento automático
              </Label>
              <Switch checked={schedEnabled} onCheckedChange={setSchedEnabled} />
            </div>

            {schedEnabled && (
              <>
                <div className="flex items-center gap-2">
                  <div className="space-y-1 flex-1">
                    <Label className="text-xs text-muted-foreground">Início</Label>
                    <Input type="time" value={schedStart} onChange={(e) => setSchedStart(e.target.value)} className="h-9" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <Label className="text-xs text-muted-foreground">Fim</Label>
                    <Input type="time" value={schedStop} onChange={(e) => setSchedStop(e.target.value)} className="h-9" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Dias ativos
                  </Label>
                  <div className="flex gap-1.5">
                    {DAYS.map(d => (
                      <button key={d.key} onClick={() => toggleSchedDay(d.key)}
                        className={`w-10 h-8 rounded-md text-xs font-semibold border transition-colors ${
                          schedActiveDays.includes(d.key)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary text-muted-foreground border-border hover:border-primary/50"
                        }`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <Separator />

          <Button onClick={saveBotConfig} disabled={savingBot} className="w-full">
            {savingBot ? "Salvando..." : "Salvar configurações do bot"}
          </Button>

          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Info className="h-3 w-3 shrink-0" />
            As configurações são sincronizadas automaticamente com a Bridge quando o bot está online.
          </p>
        </CardContent>
      </Card>

      {/* SECTION 4 — Data */}
       <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Database className="h-4 w-4" /> Dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" onClick={exportData} className="gap-2 w-full justify-start">
            <Download className="h-4 w-4" /> Exportar todos os dados (JSON)
          </Button>
          <Button variant="outline" onClick={() => setClearLogsOpen(true)} className="gap-2 w-full justify-start">
            <Trash2 className="h-4 w-4" /> Limpar log de ações
          </Button>
          <Separator />
          <Button variant="destructive" onClick={() => setDeleteStep(1)} className="gap-2 w-full justify-start">
            <AlertTriangle className="h-4 w-4" /> Excluir conta
          </Button>
        </CardContent>
      </Card>

      {/* SECTION 5 — About */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Info className="h-4 w-4" /> Sobre</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Versão</span>
            <span className="font-mono">{APP_VERSION}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Documentação</span>
            <a href="https://docs.organicpro.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">Acessar <ExternalLink className="h-3 w-3" /></a>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Suporte</span>
            <a href="mailto:suporte@organicpro.com" className="flex items-center gap-1 text-primary hover:underline">Contato <ExternalLink className="h-3 w-3" /></a>
          </div>
        </CardContent>
      </Card>

      {/* Clear Logs Confirm */}
      <AlertDialog open={clearLogsOpen} onOpenChange={setClearLogsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar log de ações?</AlertDialogTitle>
            <AlertDialogDescription>Todos os registros de ações serão removidos permanentemente. Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={clearLogs} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Limpar tudo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account — Step 1 */}
      <AlertDialog open={deleteStep === 1} onOpenChange={(o) => !o && setDeleteStep(0)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>Todos os seus dados, contas Instagram, logs e configurações serão apagados. Esta ação é irreversível.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteStep(0)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setDeleteStep(2); setDeleteConfirmText(""); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account — Step 2 */}
      <AlertDialog open={deleteStep === 2} onOpenChange={(o) => !o && setDeleteStep(0)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmação final</AlertDialogTitle>
            <AlertDialogDescription>
              Digite <span className="font-mono font-bold text-foreground">EXCLUIR</span> para confirmar a exclusão permanente da conta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Digite EXCLUIR"
            className="my-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteStep(0)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "EXCLUIR"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsPage;
