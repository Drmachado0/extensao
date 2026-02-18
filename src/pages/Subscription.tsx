import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Crown, Zap, Star, CreditCard, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

const planDetails: Record<string, { name: string; price: string; period: string; color: string; icon: React.ElementType }> = {
  free: { name: "Free", price: "R$0", period: "", color: "text-muted-foreground", icon: Zap },
  pro: { name: "Pro", price: "R$49", period: "/mês", color: "text-primary", icon: Star },
  business: { name: "Business", price: "R$99", period: "/mês", color: "text-yellow-400", icon: Crown },
  enterprise: { name: "Enterprise", price: "Custom", period: "", color: "text-yellow-400", icon: Crown },
};

const comparisonRows = [
  { feature: "Contas Instagram", free: "1", pro: "3", business: "10" },
  { feature: "Ações/dia", free: "50", pro: "500", business: "2.000" },
  { feature: "Filtros", free: "Básicos", pro: "Avançados", business: "Avançados" },
  { feature: "Whitelist", free: "50 contas", pro: "500 contas", business: "Ilimitada" },
  { feature: "Suporte", free: "Comunidade", pro: "Email", business: "Prioritário" },
  { feature: "Logs", free: "7 dias", pro: "30 dias", business: "90 dias" },
];

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [sub, setSub] = useState<any>(null);
  const [accountsCount, setAccountsCount] = useState(0);
  const [todayActions, setTodayActions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const todayIso = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
      const [acctRes, actionsRes] = await Promise.all([
        supabase.from("ig_accounts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        (supabase as any).from("action_log").select("id", { count: "exact", head: true }).gte("executed_at", todayIso),
      ]);
      // No subscriptions table in current schema — use user_settings instead
      const { data: settingsData } = await supabase.from("user_settings").select("settings_json").eq("user_id", user.id).maybeSingle();
      const planFromSettings = (settingsData?.settings_json as any)?.plan ?? null;
      setSub(planFromSettings ? { plan: planFromSettings } : null);
      setAccountsCount(acctRes.count ?? 0);
      setTodayActions(actionsRes.count ?? 0);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const currentPlan = sub?.plan || "free";
  const plan = planDetails[currentPlan] || planDetails.free;
  const PlanIcon = plan.icon;
  const maxAccounts = sub?.max_accounts ?? 1;
  const maxActions = sub?.max_daily_actions ?? 50;

  const handleUpgrade = (planId: string) => {
    toast.info("Integração com Stripe será implementada em breve. Contate o suporte para upgrade.");
  };

  if (loading) return <div className="space-y-6 animate-fade-in"><Skeleton className="h-40 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Assinatura</h1>
        <p className="text-muted-foreground">Gerencie seu plano e pagamentos</p>
      </div>

      {/* Current Plan Card */}
      <Card className="glass-card border-primary/30">
        <CardHeader className="flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <PlanIcon className={`h-8 w-8 ${plan.color}`} />
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Plano {plan.name}
                <Badge className="gradient-primary text-primary-foreground">{plan.name}</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {sub?.current_period_end
                  ? `Renova em ${new Date(sub.current_period_end).toLocaleDateString("pt-BR")}`
                  : "Plano gratuito — sem renovação"}
              </p>
            </div>
          </div>
          {currentPlan === "free" ? (
            <Button className="gradient-primary gap-1.5" onClick={() => handleUpgrade("pro")}>
              <ArrowUpRight className="h-4 w-4" /> Fazer Upgrade
            </Button>
          ) : (
            <Button variant="outline" onClick={() => toast.info("Portal Stripe será integrado em breve.")}>
              <CreditCard className="h-4 w-4 mr-1.5" /> Gerenciar Assinatura
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4 mt-2">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Contas Instagram</span>
                <span className="font-medium">{accountsCount}/{maxAccounts}</span>
              </div>
              <Progress value={Math.min((accountsCount / maxAccounts) * 100, 100)} className="h-2" />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ações hoje</span>
                <span className="font-medium">{todayActions}/{maxActions}</span>
              </div>
              <Progress value={Math.min((todayActions / maxActions) * 100, 100)} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison Table */}
      <Card className="glass-card">
        <CardHeader><CardTitle>Comparação de Planos</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                <TableHead className="text-center">Free</TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <Badge className="gradient-primary text-primary-foreground text-[10px]">Recomendado</Badge>
                    <span>Pro <span className="text-muted-foreground text-xs">R$49/mês</span></span>
                  </div>
                </TableHead>
                <TableHead className="text-center">Business <span className="text-muted-foreground text-xs">R$99/mês</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonRows.map(row => (
                <TableRow key={row.feature}>
                  <TableCell className="font-medium">{row.feature}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{row.free}</TableCell>
                  <TableCell className="text-center">{row.pro}</TableCell>
                  <TableCell className="text-center">{row.business}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell />
                <TableCell className="text-center">
                  <Button variant="outline" size="sm" disabled={currentPlan === "free"}>
                    {currentPlan === "free" ? "Plano Atual" : "Downgrade"}
                  </Button>
                </TableCell>
                <TableCell className="text-center">
                  <Button size="sm" className={currentPlan === "pro" ? "" : "gradient-primary"} disabled={currentPlan === "pro"} onClick={() => handleUpgrade("pro")}>
                    {currentPlan === "pro" ? "Plano Atual" : "Upgrade"}
                  </Button>
                </TableCell>
                <TableCell className="text-center">
                  <Button variant="outline" size="sm" disabled={currentPlan === "business"} onClick={() => handleUpgrade("business")}>
                    {currentPlan === "business" ? "Plano Atual" : "Upgrade"}
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment History Placeholder */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Histórico de Pagamentos</CardTitle></CardHeader>
        <CardContent>
          {currentPlan === "free" ? (
            <p className="text-muted-foreground text-sm py-6 text-center">Nenhum pagamento — plano gratuito ativo.</p>
          ) : (
            <p className="text-muted-foreground text-sm py-6 text-center">O histórico de pagamentos será carregado via integração Stripe.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
