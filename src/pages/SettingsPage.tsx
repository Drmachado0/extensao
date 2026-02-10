import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAccounts } from "@/hooks/useAccounts";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Settings, Save, Timer, Gauge, ShieldAlert, Zap, Chrome,
  ChevronDown, ChevronRight, Loader2, Copy, Check, RefreshCw, Wifi, WifiOff,
} from "lucide-react";

interface SettingsState {
  action_delay_min: number;
  action_delay_max: number;
  skip_delay_seconds: number;
  daily_follow_limit: number;
  daily_unfollow_limit: number;
  daily_like_limit: number;
  hourly_action_limit: number;
  rate_limit_429_wait: number;
  rate_limit_soft_wait: number;
  rate_limit_hard_wait: number;
  auto_apply_filters: boolean;
  auto_remove_from_queue: boolean;
  like_latest_posts_count: number;
  dont_unfollow_followers: boolean;
  dont_unfollow_within_days: number;
  unfollow_after_days: number;
  comment_templates: string[];
  is_running: boolean;
}

const defaults: SettingsState = {
  action_delay_min: 25,
  action_delay_max: 55,
  skip_delay_seconds: 5,
  daily_follow_limit: 100,
  daily_unfollow_limit: 100,
  daily_like_limit: 200,
  hourly_action_limit: 30,
  rate_limit_429_wait: 15,
  rate_limit_soft_wait: 10,
  rate_limit_hard_wait: 4,
  auto_apply_filters: true,
  auto_remove_from_queue: true,
  like_latest_posts_count: 0,
  dont_unfollow_followers: true,
  dont_unfollow_within_days: 3,
  unfollow_after_days: 7,
  comment_templates: [],
  is_running: false,
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { accounts, selectedAccountId, setSelectedAccountId, loading: accountsLoading } = useAccounts();
  const [s, setS] = useState<SettingsState>({ ...defaults });
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [todayUsage, setTodayUsage] = useState({ follows: 0, unfollows: 0, likes: 0 });
  const [connectionKey, setConnectionKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    speed: true, limits: true, rate: true, automation: true, extension: true,
  });

  const toggle = (k: string) => setOpenSections(p => ({ ...p, [k]: !p[k] }));
  const update = <K extends keyof SettingsState>(k: K, v: SettingsState[K]) => setS(p => ({ ...p, [k]: v }));

  const loadSettings = useCallback(async () => {
    if (!user || !selectedAccountId) { setLoading(false); return; }
    setLoading(true);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [settingsRes, followsRes, unfollowsRes, likesRes] = await Promise.all([
      supabase.from("action_settings").select("*").eq("user_id", user.id).eq("account_id", selectedAccountId).maybeSingle(),
      supabase.from("action_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("action_type", "follow").eq("status", "success").gte("created_at", today.toISOString()),
      supabase.from("action_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("action_type", "unfollow").eq("status", "success").gte("created_at", today.toISOString()),
      supabase.from("action_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("action_type", "like").eq("status", "success").gte("created_at", today.toISOString()),
    ]);

    setTodayUsage({ follows: followsRes.count ?? 0, unfollows: unfollowsRes.count ?? 0, likes: likesRes.count ?? 0 });

    if (settingsRes.data) {
      const d = settingsRes.data;
      setSettingsId(d.id);
      setS({
        action_delay_min: d.action_delay_min ?? 25,
        action_delay_max: d.action_delay_max ?? 55,
        skip_delay_seconds: d.skip_delay_seconds ?? 5,
        daily_follow_limit: d.daily_follow_limit ?? 100,
        daily_unfollow_limit: d.daily_unfollow_limit ?? 100,
        daily_like_limit: d.daily_like_limit ?? 200,
        hourly_action_limit: d.hourly_action_limit ?? 30,
        rate_limit_429_wait: d.rate_limit_429_wait ?? 15,
        rate_limit_soft_wait: d.rate_limit_soft_wait ?? 10,
        rate_limit_hard_wait: d.rate_limit_hard_wait ?? 4,
        auto_apply_filters: d.auto_apply_filters ?? true,
        auto_remove_from_queue: d.auto_remove_from_queue ?? true,
        like_latest_posts_count: d.like_latest_posts_count ?? 0,
        dont_unfollow_followers: d.dont_unfollow_followers ?? true,
        dont_unfollow_within_days: d.dont_unfollow_within_days ?? 3,
        unfollow_after_days: d.unfollow_after_days ?? 7,
        comment_templates: (d.comment_templates as string[]) || [],
        is_running: d.is_running ?? false,
      });
    } else {
      setSettingsId(null);
      setS({ ...defaults });
    }
    // Load connection key from the account, or generate if none exists
    const { data: accountData } = await supabase
      .from("instagram_accounts")
      .select("connection_key")
      .eq("id", selectedAccountId)
      .maybeSingle();
    if (accountData?.connection_key) {
      setConnectionKey(accountData.connection_key);
    } else {
      setConnectionKey(crypto.randomUUID());
    }
    setLoading(false);
  }, [user, selectedAccountId]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const saveSettings = async () => {
    if (!user || !selectedAccountId) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        account_id: selectedAccountId,
        ...s,
        comment_templates: s.comment_templates.length > 0 ? s.comment_templates : null,
      };
      if (settingsId) {
        const { error } = await supabase.from("action_settings").update(payload).eq("id", settingsId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("action_settings").insert(payload).select("id").single();
        if (error) throw error;
        if (data) setSettingsId(data.id);
      }
      toast({ title: "Configurações salvas!" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const copyKey = async () => {
    await navigator.clipboard.writeText(connectionKey);
    setCopied(true);
    toast({ title: "Chave copiada!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const regenerateKey = async () => {
    const newKey = crypto.randomUUID();
    setConnectionKey(newKey);
    setCopied(false);
    // Persist the new key to the account
    if (selectedAccountId) {
      await supabase.from("instagram_accounts").update({ connection_key: newKey }).eq("id", selectedAccountId);
    }
    toast({ title: "Nova chave gerada e salva" });
  };

  const SectionHeader = ({ sectionKey, icon: Icon, title }: { sectionKey: string; icon: React.ElementType; title: string }) => (
    <CollapsibleTrigger className="flex items-center justify-between w-full py-3 hover:text-foreground transition-colors" onClick={() => toggle(sectionKey)}>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <span className="font-semibold text-base">{title}</span>
      </div>
      {openSections[sectionKey] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
    </CollapsibleTrigger>
  );

  const LimitRow = ({ label, value, onChange, max, current }: { label: string; value: number; onChange: (v: number) => void; max: number; current: number }) => {
    const pct = max > 0 ? Math.min((current / value) * 100, 100) : 0;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">{label}</Label>
          <span className="text-xs text-muted-foreground">{current}/{value}</span>
        </div>
        <Slider min={10} max={max} step={10} value={[value]} onValueChange={([v]) => onChange(v)} />
        <Progress value={pct} className="h-1.5" />
      </div>
    );
  };

  if (loading || accountsLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div><h1 className="text-2xl font-bold">Configurações</h1></div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Ajuste velocidade, limites e automação</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Conta" /></SelectTrigger>
            <SelectContent>
              {accounts.map(a => <SelectItem key={a.id} value={a.id}>@{a.ig_username}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button className="gradient-primary glow-primary gap-2" onClick={saveSettings} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </div>

      {/* Section 1: Speed & Delays */}
      <Card className="glass-card">
        <CardContent className="py-0">
          <Collapsible open={openSections.speed}>
            <SectionHeader sectionKey="speed" icon={Timer} title="Velocidade e Delays" />
            <CollapsibleContent className="space-y-6 pb-6">
              <div className="space-y-3">
                <Label className="text-sm">Segundos entre ações (aleatorização)</Label>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Entre</span>
                  <Input type="number" className="w-20 h-8 text-sm" value={s.action_delay_min} onChange={e => update("action_delay_min", Number(e.target.value))} />
                  <span className="text-sm text-muted-foreground">e</span>
                  <Input type="number" className="w-20 h-8 text-sm" value={s.action_delay_max} onChange={e => update("action_delay_max", Number(e.target.value))} />
                  <span className="text-sm text-muted-foreground">segundos</span>
                </div>
                <Slider min={5} max={120} step={1} value={[s.action_delay_min, s.action_delay_max]} onValueChange={([min, max]) => { update("action_delay_min", min); update("action_delay_max", max); }} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Segundos após pular conta</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" className="w-24 h-8 text-sm" value={s.skip_delay_seconds} onChange={e => update("skip_delay_seconds", Number(e.target.value))} />
                  <span className="text-sm text-muted-foreground">segundos</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Section 2: Daily Limits */}
      <Card className="glass-card">
        <CardContent className="py-0">
          <Collapsible open={openSections.limits}>
            <SectionHeader sectionKey="limits" icon={Gauge} title="Limites Diários" />
            <CollapsibleContent className="space-y-6 pb-6">
              <LimitRow label="Follows por dia" value={s.daily_follow_limit} onChange={v => update("daily_follow_limit", v)} max={500} current={todayUsage.follows} />
              <LimitRow label="Unfollows por dia" value={s.daily_unfollow_limit} onChange={v => update("daily_unfollow_limit", v)} max={500} current={todayUsage.unfollows} />
              <LimitRow label="Likes por dia" value={s.daily_like_limit} onChange={v => update("daily_like_limit", v)} max={1000} current={todayUsage.likes} />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Ações por hora</Label>
                  <span className="text-sm font-medium text-primary">{s.hourly_action_limit}</span>
                </div>
                <Slider min={5} max={60} step={1} value={[s.hourly_action_limit]} onValueChange={([v]) => update("hourly_action_limit", v)} />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Section 3: Rate Limit Recovery */}
      <Card className="glass-card">
        <CardContent className="py-0">
          <Collapsible open={openSections.rate}>
            <SectionHeader sectionKey="rate" icon={ShieldAlert} title="Rate Limit Recovery" />
            <CollapsibleContent className="space-y-5 pb-6">
              <div className="space-y-2">
                <Label className="text-sm">Espera após erro 429 (minutos)</Label>
                <Input type="number" className="w-32 h-8 text-sm" value={s.rate_limit_429_wait} onChange={e => update("rate_limit_429_wait", Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Espera após rate limit suave / 403 (minutos)</Label>
                <Input type="number" className="w-32 h-8 text-sm" value={s.rate_limit_soft_wait} onChange={e => update("rate_limit_soft_wait", Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Espera após rate limit rígido (horas)</Label>
                <Input type="number" className="w-32 h-8 text-sm" value={s.rate_limit_hard_wait} onChange={e => update("rate_limit_hard_wait", Number(e.target.value))} />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Section 4: Automation */}
      <Card className="glass-card">
        <CardContent className="py-0">
          <Collapsible open={openSections.automation}>
            <SectionHeader sectionKey="automation" icon={Zap} title="Automação" />
            <CollapsibleContent className="space-y-5 pb-6">
              <ToggleRow label="Aplicar filtros automaticamente" value={s.auto_apply_filters} onChange={v => update("auto_apply_filters", v)} />
              <ToggleRow label="Remover da fila após processar" value={s.auto_remove_from_queue} onChange={v => update("auto_remove_from_queue", v)} />
              <ToggleRow label="Não dar unfollow em quem me segue" value={s.dont_unfollow_followers} onChange={v => update("dont_unfollow_followers", v)} />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Curtir posts ao seguir</Label>
                  <span className="text-sm font-medium text-primary">{s.like_latest_posts_count} posts</span>
                </div>
                <Slider min={0} max={5} step={1} value={[s.like_latest_posts_count]} onValueChange={([v]) => update("like_latest_posts_count", v)} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Não dar unfollow em quem segui há menos de</Label>
                  <span className="text-sm font-medium text-primary">{s.dont_unfollow_within_days} dias</span>
                </div>
                <Slider min={1} max={30} step={1} value={[s.dont_unfollow_within_days]} onValueChange={([v]) => update("dont_unfollow_within_days", v)} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Dar unfollow em quem segui há mais de</Label>
                  <span className="text-sm font-medium text-primary">{s.unfollow_after_days} dias</span>
                </div>
                <Slider min={1} max={90} step={1} value={[s.unfollow_after_days]} onValueChange={([v]) => update("unfollow_after_days", v)} />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm">Templates de Comentários</Label>
                <p className="text-xs text-muted-foreground">Um por linha. Use {"{emoji}"} e {"{username}"} como variáveis.</p>
                <Textarea
                  rows={5}
                  placeholder={"Muito top! {emoji}\nIncrível @{username}! 🔥\nAmei esse conteúdo {emoji}"}
                  value={s.comment_templates.join("\n")}
                  onChange={e => update("comment_templates", e.target.value.split("\n").filter(l => l.trim()))}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Section 5: Chrome Extension */}
      <Card className="glass-card">
        <CardContent className="py-0">
          <Collapsible open={openSections.extension}>
            <SectionHeader sectionKey="extension" icon={Chrome} title="Extensão Chrome" />
            <CollapsibleContent className="space-y-5 pb-6">
              <div>
                <Label className="text-sm mb-2 block">Chave de Conexão</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-secondary rounded-lg px-3 py-2 text-xs font-mono truncate select-all">{connectionKey}</code>
                  <Button variant="outline" size="sm" onClick={copyKey} className="shrink-0 gap-1.5">
                    {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={regenerateKey} className="shrink-0">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <WifiOff className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Status da Extensão</span>
                </div>
                <Badge variant="secondary" className="text-xs">Desconectada</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Última atividade</span>
                <span className="text-sm">—</span>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <Label className="text-sm">{label}</Label>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
