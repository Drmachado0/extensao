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
  ChevronDown, ChevronRight, Loader2, Copy, Check, RefreshCw, WifiOff,
} from "lucide-react";

interface SettingsState {
  delay_min: number;
  delay_max: number;
  max_actions_per_session: number;
  likes_per_follow: number;
}

const defaults: SettingsState = {
  delay_min: 25,
  delay_max: 45,
  max_actions_per_session: 200,
  likes_per_follow: 2,
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { accounts, selectedAccountId, setSelectedAccountId, loading: accountsLoading } = useAccounts();
  const [s, setS] = useState<SettingsState>({ ...defaults });
  const [userSettings, setUserSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [todayUsage, setTodayUsage] = useState({ follows: 0, unfollows: 0, likes: 0 });
  const [copied, setCopied] = useState(false);
  const [bridgeToken, setBridgeToken] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    speed: true, limits: true, rate: true, automation: true, extension: true,
  });

  const toggle = (k: string) => setOpenSections(p => ({ ...p, [k]: !p[k] }));
  const update = <K extends keyof SettingsState>(k: K, v: SettingsState[K]) => setS(p => ({ ...p, [k]: v }));

  const loadSettings = useCallback(async () => {
    if (!user || !selectedAccountId) { setLoading(false); return; }
    setLoading(true);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [accountRes, followsRes, unfollowsRes, likesRes, userSettingsRes] = await Promise.all([
      supabase.from("ig_accounts").select("delay_min,delay_max,max_actions_per_session,likes_per_follow").eq("id", selectedAccountId).maybeSingle(),
      supabase.from("action_log").select("id", { count: "exact", head: true }).eq("ig_account_id", selectedAccountId).eq("action_type", "follow").eq("status", "success").gte("executed_at", today.toISOString()),
      supabase.from("action_log").select("id", { count: "exact", head: true }).eq("ig_account_id", selectedAccountId).eq("action_type", "unfollow").eq("status", "success").gte("executed_at", today.toISOString()),
      supabase.from("action_log").select("id", { count: "exact", head: true }).eq("ig_account_id", selectedAccountId).eq("action_type", "like").eq("status", "success").gte("executed_at", today.toISOString()),
      supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

    setTodayUsage({ follows: followsRes.count ?? 0, unfollows: unfollowsRes.count ?? 0, likes: likesRes.count ?? 0 });
    setUserSettings(userSettingsRes.data);

    if (accountRes.data) {
      const d = accountRes.data as any;
      setS({
        delay_min: d.delay_min ?? 25,
        delay_max: d.delay_max ?? 45,
        max_actions_per_session: d.max_actions_per_session ?? 200,
        likes_per_follow: d.likes_per_follow ?? 2,
      });
    } else {
      setS({ ...defaults });
    }

    // Load bridge token
    const { data: tokenData } = await supabase
      .from("bridge_tokens")
      .select("token_hash")
      .eq("ig_account_id", selectedAccountId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setBridgeToken(tokenData?.token_hash ?? "");

    setLoading(false);
  }, [user, selectedAccountId]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const saveSettings = async () => {
    if (!user || !selectedAccountId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("ig_accounts")
        .update({
          delay_min: s.delay_min,
          delay_max: s.delay_max,
          max_actions_per_session: s.max_actions_per_session,
          likes_per_follow: s.likes_per_follow,
        })
        .eq("id", selectedAccountId);
      if (error) throw error;
      toast({ title: "Configurações salvas!" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const generateToken = async () => {
    try {
      const { data, error } = await supabase.rpc("generate_bridge_token", { p_ig_account_id: selectedAccountId });
      if (error) throw error;
      setBridgeToken(data as string);
      toast({ title: "Token gerado com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro ao gerar token", description: err.message, variant: "destructive" });
    }
  };

  const copyToken = async () => {
    if (!bridgeToken) return;
    await navigator.clipboard.writeText(bridgeToken);
    setCopied(true);
    toast({ title: "Token copiado!" });
    setTimeout(() => setCopied(false), 2000);
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
                  <Input type="number" className="w-20 h-8 text-sm" value={s.delay_min} onChange={e => update("delay_min", Number(e.target.value))} />
                  <span className="text-sm text-muted-foreground">e</span>
                  <Input type="number" className="w-20 h-8 text-sm" value={s.delay_max} onChange={e => update("delay_max", Number(e.target.value))} />
                  <span className="text-sm text-muted-foreground">segundos</span>
                </div>
                <Slider min={5} max={120} step={1} value={[s.delay_min, s.delay_max]} onValueChange={([min, max]) => { update("delay_min", min); update("delay_max", max); }} />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Section 2: Session Limits */}
      <Card className="glass-card">
        <CardContent className="py-0">
          <Collapsible open={openSections.limits}>
            <SectionHeader sectionKey="limits" icon={Gauge} title="Limites de Sessão" />
            <CollapsibleContent className="space-y-6 pb-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Ações máximas por sessão</Label>
                  <span className="text-sm font-medium text-primary">{s.max_actions_per_session}</span>
                </div>
                <Slider min={10} max={1000} step={10} value={[s.max_actions_per_session]} onValueChange={([v]) => update("max_actions_per_session", v)} />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Curtidas ao seguir (posts recentes)</Label>
                  <span className="text-sm font-medium text-primary">{s.likes_per_follow} posts</span>
                </div>
                <Slider min={0} max={10} step={1} value={[s.likes_per_follow]} onValueChange={([v]) => update("likes_per_follow", v)} />
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Uso hoje:</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Follows</span><span>{todayUsage.follows}</span>
                  </div>
                  <Progress value={todayUsage.follows} className="h-1.5" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Unfollows</span><span>{todayUsage.unfollows}</span>
                  </div>
                  <Progress value={todayUsage.unfollows} className="h-1.5" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Likes</span><span>{todayUsage.likes}</span>
                  </div>
                  <Progress value={todayUsage.likes} className="h-1.5" />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Section 3: Chrome Extension / Bridge Token */}
      <Card className="glass-card">
        <CardContent className="py-0">
          <Collapsible open={openSections.extension}>
            <SectionHeader sectionKey="extension" icon={Chrome} title="Extensão Chrome — Token de Conexão" />
            <CollapsibleContent className="space-y-5 pb-6">
              <p className="text-sm text-muted-foreground">
                Cole este token na extensão Chrome para conectar ao Organic Pro.
              </p>
              <div>
                <Label className="text-sm mb-2 block">Token de Conexão</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-secondary rounded-lg px-3 py-2 text-xs font-mono truncate select-all">
                    {bridgeToken || "—"}
                  </code>
                  <Button variant="outline" size="sm" onClick={copyToken} disabled={!bridgeToken} className="shrink-0 gap-1.5">
                    {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={generateToken} className="shrink-0" disabled={!selectedAccountId}>
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
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );
}
