import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Instagram, Key, Chrome, ArrowRight, ArrowLeft, Copy, Check, SkipForward, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface OnboardingWizardProps {
  onComplete: () => void;
}

const STEPS = [
  { icon: Instagram, title: "Adicionar Conta", desc: "Conecte sua conta do Instagram" },
  { icon: Key, title: "Gerar Token", desc: "Crie um token para a extensão Bridge" },
  { icon: Chrome, title: "Instalar Extensão", desc: "Baixe e instale o GrowBot Bridge no Chrome" },
];
const EXTENSION_ZIP_URL = "/organic-extension.zip";
const CHROME_STORE_URL = "https://chromewebstore.google.com/";

const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAddAccount = async () => {
    if (!user || !username.trim()) return;
    setSaving(true);
    const clean = username.trim().replace(/^@/, "");
    const { data, error } = await supabase
      .from("ig_accounts")
      .insert({ user_id: user.id, ig_username: clean })
      .select("id")
      .single();
    setSaving(false);
    if (error) {
      toast.error("Erro ao adicionar conta");
      return;
    }
    toast.success(`@${clean} adicionada!`);
    setAccountId(data.id);
    setStep(1);
  };

  const handleGenerateToken = async () => {
    if (!accountId) return;
    setTokenLoading(true);
    const { data, error } = await supabase.rpc("generate_bridge_token", { p_ig_account_id: accountId });
    setTokenLoading(false);
    if (error || !data) {
      toast.error("Erro ao gerar token");
      return;
    }
    setToken(data);
  };

  const copyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    toast.success("Token copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_skipped", "true");
    onComplete();
  };

  const handleFinish = () => {
    localStorage.setItem("onboarding_completed", "true");
    onComplete();
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-lg border-border/40 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
        <CardContent className="p-8 space-y-6">
          {/* Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Passo {step + 1} de {STEPS.length}</span>
              <button onClick={handleSkip} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                <SkipForward className="h-3 w-3" /> Pular
              </button>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Step indicators */}
          <div className="flex justify-center gap-6">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                    isActive ? "bg-primary/15 ring-2 ring-primary/30" : isDone ? "bg-primary/10" : "bg-secondary/60"
                  }`}>
                    <Icon className={`h-5 w-5 ${isActive ? "text-primary" : isDone ? "text-primary/60" : "text-muted-foreground"}`} />
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{s.title}</span>
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <div className="animate-fade-in space-y-4">
            {step === 0 && (
              <>
                <div className="text-center space-y-1">
                  <h2 className="text-lg font-semibold">Adicione sua conta Instagram</h2>
                  <p className="text-sm text-muted-foreground">Insira o username da conta que deseja monitorar</p>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="@username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddAccount()}
                    className="bg-secondary/40"
                  />
                  <Button onClick={handleAddAccount} disabled={saving || !username.trim()}>
                    {saving ? "..." : "Adicionar"}
                  </Button>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="text-center space-y-1">
                  <h2 className="text-lg font-semibold">Gere o Token Bridge</h2>
                  <p className="text-sm text-muted-foreground">Este token conecta a extensão ao seu dashboard</p>
                </div>
                {!token ? (
                  <Button onClick={handleGenerateToken} disabled={tokenLoading} className="w-full gap-2">
                    <Key className="h-4 w-4" /> {tokenLoading ? "Gerando..." : "Gerar Token"}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input readOnly value={token} className="font-mono text-xs" />
                      <Button variant="outline" size="icon" onClick={copyToken} className="shrink-0">
                        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-amber-400 flex items-center gap-1.5">⚠️ Copie agora — este token não será mostrado novamente.</p>
                    <Button onClick={() => setStep(2)} className="w-full gap-2">
                      Próximo <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <div className="text-center space-y-1">
                  <h2 className="text-lg font-semibold">Instale a Extensão</h2>
                  <p className="text-sm text-muted-foreground">Baixe a extensão, instale no Chrome e cole o token gerado</p>
                </div>
                <div className="flex flex-col gap-2">
                  <a href={EXTENSION_ZIP_URL} download="organic-extension.zip" target="_blank" rel="noopener noreferrer" className="inline-flex">
                    <Button type="button" variant="outline" className="w-full gap-2">
                      <Download className="h-4 w-4" /> Baixar GrowBot Bridge (.zip)
                    </Button>
                  </a>
                  <p className="text-xs text-muted-foreground text-center">Ou instale pela Chrome Web Store:</p>
                  <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex">
                    <Button type="button" variant="ghost" size="sm" className="w-full gap-2">
                      <ExternalLink className="h-3.5 w-3.5" /> Abrir Chrome Web Store
                    </Button>
                  </a>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mt-4">
                  <li>Abra <span className="text-foreground font-medium">chrome://extensions</span> e ative &quot;Modo desenvolvedor&quot;</li>
                  <li>Arraste o .zip baixado ou use &quot;Carregar sem compactação&quot; na pasta extraída</li>
                  <li>Clique no ícone da extensão na barra do Chrome e cole o token do passo anterior</li>
                  <li>Clique em <span className="text-foreground font-medium">Conectar</span> e mantenha o Instagram aberto</li>
                </ol>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Voltar
                  </Button>
                  <Button onClick={handleFinish} className="flex-1 gap-2">
                    Concluir <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingWizard;
