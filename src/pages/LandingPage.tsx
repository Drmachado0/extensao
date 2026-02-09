import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Instagram, Zap, Filter, BarChart3, Shield, Check, ArrowRight } from "lucide-react";

const features = [
  { icon: Zap, title: "Automação Inteligente", desc: "Follow, unfollow e likes automáticos com delays humanizados." },
  { icon: Filter, title: "Filtros Avançados", desc: "Segmente por followers, engajamento, nicho e muito mais." },
  { icon: BarChart3, title: "Analytics Completo", desc: "Acompanhe o crescimento com gráficos detalhados em tempo real." },
  { icon: Shield, title: "100% Seguro", desc: "Limites inteligentes para proteger sua conta contra bloqueios." },
];

const plans = [
  {
    name: "Free",
    price: "R$0",
    period: "",
    features: ["1 conta Instagram", "50 ações/dia", "Filtros básicos", "Dashboard simplificado"],
    cta: "Começar Grátis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "R$49",
    period: "/mês",
    features: ["3 contas Instagram", "500 ações/dia", "Filtros avançados", "Analytics completo", "Suporte por email"],
    cta: "Assinar Pro",
    highlighted: true,
  },
  {
    name: "Business",
    price: "R$99",
    period: "/mês",
    features: ["Contas ilimitadas", "Ações ilimitadas", "Todos os filtros", "API access", "Suporte prioritário"],
    cta: "Assinar Business",
    highlighted: false,
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-2">
            <Instagram className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold gradient-text">Organic Pro</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild><Link to="/auth">Entrar</Link></Button>
            <Button className="gradient-primary" asChild><Link to="/auth">Começar Grátis</Link></Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center">
        <Badge variant="secondary" className="mb-6">🚀 Crescimento orgânico no piloto automático</Badge>
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
          Cresça no Instagram com <br />
          <span className="gradient-text">inteligência e segurança</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Automatize follows, unfollows e likes com filtros avançados e limites inteligentes.
          Tudo em um dashboard premium e fácil de usar.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button size="lg" className="gradient-primary glow-primary" onClick={() => navigate("/auth")}>
            Começar Grátis <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}>
            Ver Planos
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Tudo que você precisa para <span className="gradient-text">crescer</span>
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="glass-card hover:border-primary/30 transition-colors">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center mb-3">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <CardTitle className="text-lg">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Planos e Preços</h2>
        <p className="text-muted-foreground text-center mb-12">Escolha o plano ideal para o seu crescimento</p>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((p) => (
            <Card key={p.name} className={`glass-card relative ${p.highlighted ? "border-primary glow-primary" : ""}`}>
              {p.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="gradient-primary text-primary-foreground">Mais Popular</Badge>
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
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Button className={`w-full ${p.highlighted ? "gradient-primary" : ""}`} variant={p.highlighted ? "default" : "outline"} onClick={() => navigate("/auth")}>
                  {p.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Instagram className="h-4 w-4 text-primary" />
            <span className="font-semibold gradient-text">Organic Pro</span>
          </div>
          <p>© 2026 Organic Pro. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
