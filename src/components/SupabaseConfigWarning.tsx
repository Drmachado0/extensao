import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, Settings, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function SupabaseConfigWarning() {
  const [copied, setCopied] = useState(false);

  const copyInstructions = () => {
    try {
      const text = `VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Erro ao copiar:", error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl border-amber-500/50 bg-amber-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">Configuração Necessária</CardTitle>
              <CardDescription className="mt-1">
                As variáveis de ambiente do Supabase não estão configuradas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="mb-3 text-sm font-medium">Para configurar no Lovable:</p>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Vá em <strong>Settings</strong> → <strong>Environment Variables</strong></li>
              <li>Adicione as seguintes variáveis:</li>
            </ol>
            <div className="mt-4 rounded-md bg-background p-3 font-mono text-xs">
              <div className="mb-1 text-muted-foreground">VITE_SUPABASE_URL</div>
              <div className="text-foreground">https://seu-projeto.supabase.co</div>
              <div className="mt-3 mb-1 text-muted-foreground">VITE_SUPABASE_PUBLISHABLE_KEY</div>
              <div className="text-foreground">sua_chave_publica_aqui</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 gap-2"
              onClick={copyInstructions}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar formato
                </>
              )}
            </Button>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card p-4">
            <Settings className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">Onde encontrar essas informações?</p>
              <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                <li>Acesse seu projeto no <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Supabase</a></li>
                <li>Vá em <strong>Settings</strong> → <strong>API</strong></li>
                <li>Copie a <strong>URL do projeto</strong> e a <strong>chave pública (anon key)</strong></li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
            <p className="text-xs text-blue-400">
              <strong>Dica:</strong> Após adicionar as variáveis, recarregue a página para aplicar as mudanças.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
