import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { useAccounts } from "@/hooks/useAccounts";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ChipInput } from "@/components/ChipInput";
import { RangeInput } from "@/components/RangeInput";
import {
  Filter, Save, RotateCcw, FlaskConical, ChevronDown, ChevronRight,
  Users, FileText, Activity, Shield,
} from "lucide-react";
import { showError } from "@/lib/errorHandler";
import { logger } from "@/lib/logger";
import { LoadingSpinner } from "@/components/LoadingSpinner";

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

// Filters are stored in user_settings as settings_json.filter_config
// since there's no dedicated filters table in the current schema
export default function FiltersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { accounts, selectedAccountId, setSelectedAccountId, loading: accountsLoading } = useAccounts();
  const [filter, setFilter] = useState<FilterState>({ ...defaultFilter });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<number | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ account: true, bio: true, activity: true, unfollow: true });

  const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const loadFilter = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("settings_json")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.settings_json) {
        const json = data.settings_json as Record<string, unknown>;
        const filterConfig = json.filter_config as Partial<FilterState> | undefined;
        if (filterConfig) {
          setFilter({ ...defaultFilter, ...filterConfig });
        } else {
          setFilter({ ...defaultFilter });
        }
      } else {
        setFilter({ ...defaultFilter });
      }
    } catch (error) {
      logger.error("Erro ao carregar filtros", error as Error, { userId: user.id });
      showError(error, "Erro ao carregar filtros");
      setFilter({ ...defaultFilter });
    } finally {
      setLoading(false);
      setTestResult(null);
    }
  }, [user]);

  useEffect(() => { loadFilter(); }, [loadFilter]);

  const update = <K extends keyof FilterState>(key: K, val: FilterState[K]) => {
    setFilter(prev => ({ ...prev, [key]: val }));
    setTestResult(null);
  };

  const saveFilter = async () => {
    if (!user) return;
    setSaving(true);
    try {
      logger.info("Salvando filtros", { userId: user.id, filterName: filter.filter_name });
      
      const { data: existing, error: fetchError } = await supabase
        .from("user_settings")
        .select("id,settings_json")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const existingJson = (existing?.settings_json as Record<string, unknown>) || {};
      const updatedJson: Record<string, unknown> = {
        ...existingJson,
        filter_config: filter,
      };

      if (existing) {
        const { error: updateError } = await supabase
          .from("user_settings")
          .update({ settings_json: updatedJson })
          .eq("user_id", user.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("user_settings")
          .insert({ user_id: user.id, settings_json: updatedJson });
        if (insertError) throw insertError;
      }
      toast({ title: "Filtros salvos com sucesso!" });
    } catch (error) {
      showError(error, "Erro ao salvar filtros");
    } finally {
      setSaving(false);
    }
  };

  const resetFilter = () => {
    setFilter({ ...defaultFilter });
    setTestResult(null);
  };

  const testFilters = async () => {
    if (!selectedAccountId) {
      toast({ title: "Selecione uma conta", variant: "destructive" });
      return;
    }
    setTesting(true);
    try {
      logger.info("Testando filtros", { accountId: selectedAccountId });
      
      const { data: queueItems, error } = await supabase
        .from("target_queue")
        .select("username,status")
        .eq("ig_account_id", selectedAccountId)
        .eq("status", "pending");

      if (error) throw error;

      const items = queueItems || [];
      setTestResult(items.length);
      toast({ title: `${items.length} alvos na fila (filtros aplicados na extensão)` });
    } catch (error) {
      showError(error, "Erro ao testar filtros");
    } finally {
      setTesting(false);
    }
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

  if (loading || accountsLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div><h1 className="text-2xl font-bold">Filtros</h1></div>
        <Skeleton className="h-96 rounded-xl" />
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
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Section 4: Unfollow / Skip Filters */}
      <Card className="glass-card">
        <CardContent className="py-0">
          <Collapsible open={openSections.unfollow}>
            <SectionHeader sectionKey="unfollow" icon={Shield} title="Unfollow e Pular" />
            <CollapsibleContent className="space-y-4 pb-6">
              <ToggleRow
                label="Pular quem já estou seguindo"
                description="Evita tentativas duplicadas de follow"
                value={filter.skip_already_following}
                onChange={v => update("skip_already_following", v)}
              />
              <ToggleRow
                label="Pular tentativas anteriores"
                description="Pula contas que já foram processadas"
                value={filter.skip_already_attempted}
                onChange={v => update("skip_already_attempted", v)}
              />
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button className="gradient-primary glow-primary gap-2" onClick={saveFilter} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Filtros
        </Button>
        <Button variant="outline" className="gap-2" onClick={testFilters} disabled={testing || !selectedAccountId}>
          {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
          {testResult !== null ? `${testResult} passam nos filtros` : "Testar Filtros"}
        </Button>
        <Button variant="ghost" className="gap-2 text-muted-foreground" onClick={resetFilter}>
          <RotateCcw className="h-4 w-4" />
          Resetar
        </Button>
      </div>
    </div>
  );
}
