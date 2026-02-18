import { useExtensionDetection } from "@/hooks/useExtensionDetection";
import { Download, X, Chrome, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function ExtensionBanner() {
  const { showBanner, dismiss } = useExtensionDetection();
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (!installing) return;
    const t = setTimeout(() => setInstalling(false), 4000);
    return () => clearTimeout(t);
  }, [installing]);

  if (!showBanner) return null;

  return (
    <div className="relative mb-4 overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 p-4 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5 blur-xl" />
      <div className="relative flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
          <Chrome className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground mb-1">
            Extensão Organic não detectada
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            Para usar todas as funcionalidades do Organic (automação, coleta de alvos, controle remoto do bot),
            você precisa instalar a extensão no Chrome. Baixe e instale manualmente via{" "}
            <code className="text-[10px] bg-secondary/50 px-1 py-0.5 rounded">chrome://extensions</code>.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
              onClick={() => {
                setInstalling(true);
                const link = document.createElement("a");
                link.href = "/organic-extension.zip";
                link.download = "organic-extension.zip";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <Download className="h-3.5 w-3.5" />
              {installing ? "Baixando..." : "Baixar Extensão"}
            </Button>
            {installing && (
              <div className="text-[11px] text-muted-foreground space-y-0.5">
                <p className="font-medium text-foreground/80">Como instalar:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Extraia o arquivo <code className="bg-secondary/50 px-1 rounded text-[10px]">.zip</code></li>
                  <li>Acesse <code className="bg-secondary/50 px-1 rounded text-[10px]">chrome://extensions</code></li>
                  <li>Ative o <strong>Modo do desenvolvedor</strong></li>
                  <li>Clique em <strong>Carregar sem compactação</strong></li>
                  <li>Selecione a pasta extraída</li>
                </ol>
              </div>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={dismiss}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Badge compacto que mostra o status da extensão na sidebar ou header.
 */
export function ExtensionStatusBadge() {
  const { extensionDetected, extensionVersion } = useExtensionDetection();

  if (extensionDetected === null) return null;

  if (extensionDetected) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-400" title={`Extensão v${extensionVersion || "?"}`}>
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>Extensão ativa</span>
      </div>
    );
  }

  return (
    <a
      href="/organic-extension.zip"
      download
      className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
      title="Clique para baixar a extensão"
    >
      <Download className="h-3.5 w-3.5" />
      <span>Instalar extensão</span>
    </a>
  );
}
