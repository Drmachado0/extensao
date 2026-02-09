import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ChipInput } from "@/components/ChipInput";
import { RangeInput } from "@/components/RangeInput";
import {
  Filter, Save, RotateCcw, FlaskConical, ChevronDown, ChevronRight,
  Users, FileText, Activity, Shield, Loader2,
} from "lucide-react";

interface FilterState {
  filter_name: string;
  is_active: boolean;
  min_followers?: number;
  max_followers?: number;
  min_following?: number;
  max_following?: number;
  min_posts?: number;
  max_posts?: number;
  min_follow_ratio?: number;
  max_follow_ratio?: number;
  has_profile_pic?: boolean;
  is_private?: boolean;
  is_verified?: boolean;
  is_business?: boolean;
  bio_contains: string[];
  bio_not_contains: string[];
  bio_url_contains?: string;
  bio_url_not_contains?: string;
  business_category_contains?: string;
  business_category_not_contains?: string;
  max_days_since_last_post?: number;
  skip_already_following: boolean;
  skip_already_attempted: boolean;
}

const defaultFilter: FilterState = {
  filter_name: "Filtro Padrão",
  is_active: true,
  bio_contains: [],
  bio_not_contains: [],
  skip_already_following: true,
  skip_already_attempted: false,
};

export default function FiltersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterState>({ ...defaultFilter });
  const [filterId, setFilterId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<number | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ account: true, bio: true, activity: true, unfollow: true });

  const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Fetch accounts + existing filter
  useEffect(() => {
    if (!user) return;
    supabase.from("instagram_accounts").select("id,ig_username,is_active").eq("user_id", user.id).then(({ data }) => {
      const accs = data || [];
      setAccounts(accs);
      const active = accs.find(a => a.is_active);
      if (active) setSelectedAccountId(active.id);
      else if (accs.length > 0) setSelectedAccountId(accs[0].id);
    });
  }, [user]);

  const loadFilter = useCallback(async () => {
    if (!user || !selectedAccountId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("action_filters")
      .select("*")
      .eq("user_id", user.id)
      .eq("account_id", selectedAccountId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setFilterId(data.id);
      setFilter({
        filter_name: data.filter_name,
        is_active: data.is_active ?? true,
        min_followers: data.min_followers ?? undefined,
        max_followers: data.max_followers ?? undefined,
        min_following: data.min_following ?? undefined,
        max_following: data.max_following ?? undefined,
        min_posts: data.min_posts ?? undefined,
        max_posts: data.max_posts ?? undefined,
        min_follow_ratio: data.min_follow_ratio != null ? Number(data.min_follow_ratio) : undefined,
        max_follow_ratio: data.max_follow_ratio != null ? Number(data.max_follow_ratio) : undefined,
        has_profile_pic: data.has_profile_pic ?? undefined,
        is_private: data.is_private ?? undefined,
        is_verified: data.is_verified ?? undefined,
        is_business: data.is_business ?? undefined,
        bio_contains: (data.bio_contains as string[]) || [],
        bio_not_contains: (data.bio_not_contains as string[]) || [],
        bio_url_contains: data.bio_url_contains ?? undefined,
        bio_url_not_contains: data.bio_url_not_contains ?? undefined,
        business_category_contains: data.business_category_contains ?? undefined,
        business_category_not_contains: data.business_category_not_contains ?? undefined,
        max_days_since_last_post: data.max_days_since_last_post ?? undefined,
        skip_already_following: data.skip_already_following ?? true,
        skip_already_attempted: data.skip_already_attempted ?? false,
      });
    } else {
      setFilterId(null);
      setFilter({ ...defaultFilter });
    }
    setLoading(false);
    setTestResult(null);
  }, [user, selectedAccountId]);

  useEffect(() => { loadFilter(); }, [loadFilter]);

  const update = <K extends keyof FilterState>(key: K, val: FilterState[K]) => {
    setFilter(prev => ({ ...prev, [key]: val }));
    setTestResult(null);
  };

  const saveFilter = async () => {
    if (!user || !selectedAccountId) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      account_id: selectedAccountId,
      filter_name: filter.filter_name || "Filtro Padrão",
      is_active: filter.is_active,
      min_followers: filter.min_followers ?? null,
      max_followers: filter.max_followers ?? null,
      min_following: filter.min_following ?? null,
      max_following: filter.max_following ?? null,
      min_posts: filter.min_posts ?? null,
      max_posts: filter.max_posts ?? null,
      min_follow_ratio: filter.min_follow_ratio ?? null,
      max_follow_ratio: filter.max_follow_ratio ?? null,
      has_profile_pic: filter.has_profile_pic ?? null,
      is_private: filter.is_private ?? null,
      is_verified: filter.is_verified ?? null,
      is_business: filter.is_business ?? null,
      bio_contains: filter.bio_contains.length > 0 ? filter.bio_contains : null,
      bio_not_contains: filter.bio_not_contains.length > 0 ? filter.bio_not_contains : null,
      bio_url_contains: filter.bio_url_contains || null,
      bio_url_not_contains: filter.bio_url_not_contains || null,
      business_category_contains: filter.business_category_contains || null,
      business_category_not_contains: filter.business_category_not_contains || null,
      max_days_since_last_post: filter.max_days_since_last_post ?? null,
      skip_already_following: filter.skip_already_following,
      skip_already_attempted: filter.skip_already_attempted,
    };

    if (filterId) {
      await supabase.from("action_filters").update(payload).eq("id", filterId);
    } else {
      const { data } = await supabase.from("action_filters").insert(payload).select("id").single();
      if (data) setFilterId(data.id);
    }
    toast({ title: "Filtros salvos com sucesso!" });
    setSaving(false);
  };

  const resetFilter = () => {
    setFilter({ ...defaultFilter });
    setTestResult(null);
  };

  const testFilters = async () => {
    if (!user || !selectedAccountId) return;
    setTesting(true);
    // Count pending queue items that would pass the filter
    const { data: queueItems } = await supabase
      .from("target_queue")
      .select("target_followers,target_following,target_posts_count,target_follow_ratio,target_is_private,target_is_verified,target_is_business,target_bio,target_external_url,target_last_post_date,target_profile_pic_url")
      .eq("user_id", user.id)
      .eq("account_id", selectedAccountId)
      .eq("status", "pending");

    const items = queueItems || [];
    let passing = 0;
    const f = filter;
    const now = Date.now();

    for (const item of items) {
      let pass = true;
      if (f.min_followers != null && (item.target_followers ?? 0) < f.min_followers) pass = false;
      if (f.max_followers != null && (item.target_followers ?? Infinity) > f.max_followers) pass = false;
      if (f.min_following != null && (item.target_following ?? 0) < f.min_following) pass = false;
      if (f.max_following != null && (item.target_following ?? Infinity) > f.max_following) pass = false;
      if (f.min_posts != null && (item.target_posts_count ?? 0) < f.min_posts) pass = false;
      if (f.max_posts != null && (item.target_posts_count ?? Infinity) > f.max_posts) pass = false;
      if (f.min_follow_ratio != null && (Number(item.target_follow_ratio) || 0) < f.min_follow_ratio) pass = false;
      if (f.max_follow_ratio != null && (Number(item.target_follow_ratio) || Infinity) > f.max_follow_ratio) pass = false;
      if (f.has_profile_pic === true && !item.target_profile_pic_url) pass = false;
      if (f.is_private === true && !item.target_is_private) pass = false;
      if (f.is_private === false && item.target_is_private) pass = false;
      if (f.is_verified === true && !item.target_is_verified) pass = false;
      if (f.is_verified === false && item.target_is_verified) pass = false;
      if (f.is_business === true && !item.target_is_business) pass = false;
      if (f.is_business === false && item.target_is_business) pass = false;
      if (f.bio_contains.length > 0 && !f.bio_contains.some(w => (item.target_bio || "").toLowerCase().includes(w.toLowerCase()))) pass = false;
      if (f.bio_not_contains.length > 0 && f.bio_not_contains.some(w => (item.target_bio || "").toLowerCase().includes(w.toLowerCase()))) pass = false;
      if (f.max_days_since_last_post != null && item.target_last_post_date) {
        const daysDiff = (now - new Date(item.target_last_post_date).getTime()) / 86400000;
        if (daysDiff > f.max_days_since_last_post) pass = false;
      }
      if (pass) passing++;
    }

    setTestResult(passing);
    setTesting(false);
    toast({ title: `${passing} de ${items.length} contas passam nos filtros` });
  };

  const SectionHeader = ({ sectionKey, icon: Icon, title }: { sectionKey: string; icon: React.ElementType; title: string }) => (
    <CollapsibleTrigger className="flex items-center justify-between w-full py-3 hover:text-foreground transition-colors" onClick={() => toggleSection(sectionKey)}>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <span className="font-semibold text-base">{title}</span>
      </div>
      {openSections[sectionKey] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
    </CollapsibleTrigger>
  );

  const ToggleRow = ({ label, description, value, onChange }: { label: string; description?: string; value?: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-2">
      <div>
        <Label className="text-sm">{label}</Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={value ?? false} onCheckedChange={onChange} />
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div><h1 className="text-2xl font-bold">Filtros</h1></div>
        <div className="h-96 animate-pulse rounded-xl bg-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Filtros</h1>
          <p className="text-muted-foreground">Configure filtros avançados de segmentação</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecionar conta" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map(a => (
                <SelectItem key={a.id} value={a.id}>@{a.ig_username}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filter Name */}
      <Card className="glass-card">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-sm">Nome do Filtro</Label>
              <Input value={filter.filter_name} onChange={e => update("filter_name", e.target.value)} className="mt-1" />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Label className="text-sm">Ativo</Label>
              <Switch checked={filter.is_active} onCheckedChange={v => update("is_active", v)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 1: Account Filters */}
      <Card className="glass-card">
        <CardContent className="py-0">
          <Collapsible open={openSections.account}>
            <SectionHeader sectionKey="account" icon={Users} title="Filtros de Conta" />
            <CollapsibleContent className="space-y-6 pb-6">
              <RangeInput label="Seguidores" minVal={filter.min_followers} maxVal={filter.max_followers} onMinChange={v => update("min_followers", v)} onMaxChange={v => update("max_followers", v)} sliderMax={1000000} step={1000} />
              <RangeInput label="Seguindo" minVal={filter.min_following} maxVal={filter.max_following} onMinChange={v => update("min_following", v)} onMaxChange={v => update("max_following", v)} sliderMax={100000} step={500} />
              <RangeInput label="Posts" minVal={filter.min_posts} maxVal={filter.max_posts} onMinChange={v => update("min_posts", v)} onMaxChange={v => update("max_posts", v)} sliderMax={50000} step={100} />
              <RangeInput label="Razão Follow (seguindo/seguidores)" minVal={filter.min_follow_ratio} maxVal={filter.max_follow_ratio} onMinChange={v => update("min_follow_ratio", v)} onMaxChange={v => update("max_follow_ratio", v)} sliderMin={0} sliderMax={100} step={0.1} />
              <Separator />
              <ToggleRow label="Tem Foto de Perfil" value={filter.has_profile_pic} onChange={v => update("has_profile_pic", v)} />
              <ToggleRow label="Conta Verificada" value={filter.is_verified} onChange={v => update("is_verified", v)} />
              <ToggleRow label="Conta Comercial" value={filter.is_business} onChange={v => update("is_business", v)} />
              <ToggleRow label="Conta Privada" value={filter.is_private} onChange={v => update("is_private", v)} />
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Section 2: Bio Filters */}
      <Card className="glass-card">
        <CardContent className="py-0">
          <Collapsible open={openSections.bio}>
            <SectionHeader sectionKey="bio" icon={FileText} title="Filtros de Bio" />
            <CollapsibleContent className="space-y-5 pb-6">
              <div>
                <Label className="text-sm mb-2 block">Bio contém (palavras-chave)</Label>
                <ChipInput value={filter.bio_contains} onChange={v => update("bio_contains", v)} placeholder="Ex: empreendedor, fitness..." />
              </div>
              <div>
                <Label className="text-sm mb-2 block">Bio NÃO contém</Label>
                <ChipInput value={filter.bio_not_contains} onChange={v => update("bio_not_contains", v)} placeholder="Ex: spam, bot..." />
              </div>
              <div>
                <Label className="text-sm">Link na Bio contém</Label>
                <Input value={filter.bio_url_contains ?? ""} onChange={e => update("bio_url_contains", e.target.value || undefined)} className="mt-1" placeholder="Ex: linktree, shopify" />
              </div>
              <div>
                <Label className="text-sm">Link na Bio NÃO contém</Label>
                <Input value={filter.bio_url_not_contains ?? ""} onChange={e => update("bio_url_not_contains", e.target.value || undefined)} className="mt-1" placeholder="Ex: onlyfans" />
              </div>
              <div>
                <Label className="text-sm">Categoria comercial contém</Label>
                <Input value={filter.business_category_contains ?? ""} onChange={e => update("business_category_contains", e.target.value || undefined)} className="mt-1" placeholder="Ex: Fitness, Moda" />
              </div>
              <div>
                <Label className="text-sm">Categoria comercial NÃO contém</Label>
                <Input value={filter.business_category_not_contains ?? ""} onChange={e => update("business_category_not_contains", e.target.value || undefined)} className="mt-1" placeholder="Ex: Político" />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Section 3: Activity Filters */}
      <Card className="glass-card">
        <CardContent className="py-0">
          <Collapsible open={openSections.activity}>
            <SectionHeader sectionKey="activity" icon={Activity} title="Filtros de Atividade" />
            <CollapsibleContent className="space-y-5 pb-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Última postagem há no máximo</Label>
                  <span className="text-sm font-medium text-primary">{filter.max_days_since_last_post ?? "—"} dias</span>
                </div>
                <Slider
                  min={1} max={365} step={1}
                  value={[filter.max_days_since_last_post ?? 90]}
                  onValueChange={([v]) => update("max_days_since_last_post", v)}
                />
              </div>
              <Separator />
              <ToggleRow label="Pular contas que já sigo" description="Ignora contas que você já está seguindo" value={filter.skip_already_following} onChange={v => update("skip_already_following", v)} />
              <ToggleRow label="Pular contas já tentadas" description="Ignora contas que já foram processadas" value={filter.skip_already_attempted} onChange={v => update("skip_already_attempted", v)} />
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Section 4: Unfollow Protections — display only, values come from action_settings */}
      <Card className="glass-card">
        <CardContent className="py-0">
          <Collapsible open={openSections.unfollow}>
            <SectionHeader sectionKey="unfollow" icon={Shield} title="Proteções de Unfollow" />
            <CollapsibleContent className="pb-6">
              <p className="text-sm text-muted-foreground mb-4">
                As configurações de proteção de unfollow são gerenciadas na página de <strong>Configurações</strong> (action_settings).
                Aqui está um resumo das opções disponíveis:
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Não dar unfollow em quem me segue</p>
                <p>• Não dar unfollow em quem segui há menos de X dias</p>
                <p>• Dar unfollow em quem segui há mais de X dias</p>
                <p>• Não dar unfollow em contas que batem nos filtros</p>
                <p>• Não dar unfollow em quem segui fora do GrowBot</p>
              </div>
              <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => window.location.hash = "#/settings"}>
                <Shield className="h-4 w-4" /> Ir para Configurações
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Test Result */}
      {testResult !== null && (
        <Card className="glass-card border-primary/30">
          <CardContent className="py-4 flex items-center gap-3">
            <FlaskConical className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{testResult} contas da fila passariam nos filtros atuais</span>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button className="gradient-primary glow-primary gap-2" onClick={saveFilter} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Filtros
        </Button>
        <Button variant="outline" className="gap-2" onClick={testFilters} disabled={testing}>
          {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
          Testar Filtros
        </Button>
        <Button variant="outline" className="gap-2" onClick={resetFilter}>
          <RotateCcw className="h-4 w-4" /> Resetar
        </Button>
      </div>
    </div>
  );
}
