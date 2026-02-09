import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CreditCard, Check } from "lucide-react";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "R$0",
    period: "",
    features: ["1 conta Instagram", "50 ações/dia", "Filtros básicos", "Dashboard simplificado"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$49",
    period: "/mês",
    features: ["3 contas Instagram", "500 ações/dia", "Filtros avançados", "Analytics completo", "Suporte por email"],
  },
  {
    id: "business",
    name: "Business",
    price: "R$99",
    period: "/mês",
    features: ["Contas ilimitadas", "Ações ilimitadas", "Todos os filtros", "API access", "Suporte prioritário"],
  },
];

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState("free");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data?.plan) setCurrentPlan(data.plan);
    });
  }, [user]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Assinatura</h1>
        <p className="text-muted-foreground">Gerencie seu plano</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isActive = currentPlan === p.id;
          return (
            <Card key={p.id} className={`glass-card relative ${isActive ? "border-primary glow-primary" : ""}`}>
              {isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="gradient-primary text-primary-foreground">Plano Atual</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{p.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold">{p.price}</span>
                  <span className="text-muted-foreground">{p.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${isActive ? "" : p.id === "pro" ? "gradient-primary" : ""}`}
                  variant={isActive ? "outline" : p.id === "pro" ? "default" : "outline"}
                  disabled={isActive}
                >
                  {isActive ? "Plano Atual" : "Fazer Upgrade"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
