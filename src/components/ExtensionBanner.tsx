import { useExtensionDetection } from "@/hooks/useExtensionDetection";
import { useBotStatus } from "@/hooks/useBotStatus";
import { Download, X, Chrome, CheckCircle2, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

/**
 * Combina detecção DOM + status Supabase para determinar se a extensão está ativa.
 *
 * botConnected = bot_online=true no banco (extensão instalada/conectada, sem exigir heartbeat recente)
 * isOnline     = botConnected E heartbeat < 30 min (bot rodando ativamente agora)
 */
function useExtensionStatus() {
  const dom = useExtensionDetection();
  const bot = useBotStatus();

  // Extensão ativa = já se comunicou com Supabase OU sinal DOM detectado
  const isActive = bot.botConnected || dom.extensionDetected === true;

  // Ainda carregando = DOM verificando E sem dados do Supabase ainda
  const isLoading = dom.extensionDetected === null && !bot.botConnected;

  // Mostrar banner somente se: não ativo, não carregando, não dispensado
  const showBanner = !isActive && !isLoading && !dom.dismissed;

  const version =
    dom.extensionVersion ||
    (bot.botConnected ? "via Supabase" : null);

  return {
    isActive,
    isLoading,
    showBanner,
    version,
    dismiss: dom.dismiss,
    botOnline: bot.isOnline,        // heartbeat recente → bot rodando agora
    botConnected: bot.botConnected, // extensão conectada (sem exigir heartbeat recente)
  };
}

// ─── Banner Principal ──────────────────────────────────────────────

export function ExtensionBanner() {
  const { showBanner, dismiss } = useExtensionStatus();
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

// ─── Badge de Status ───────────────────────────────────────────────

/**
 * Badge compacto com 3 estados:
 * 1. Bot ativo (heartbeat recente) → verde brilhante, ícone Wifi
 * 2. Extensão conectada (bot_online=true, sem heartbeat recente) → verde suave, ícone CheckCircle2
 * 3. Não detectada → âmbar, link de download
 */
export function ExtensionStatusBadge() {
  const { isActive, isLoading, version, botOnline, botConnected } = useExtensionStatus();

  if (isLoading) return null;

  if (botOnline) {
    // Bot rodando ativamente (heartbeat recente)
    return (
      <div
        className="flex items-center gap-1.5 text-xs text-emerald-400"
        title={version ? `v${version}` : "Bot ativo"}
      >
        <Wifi className="h-3.5 w-3.5" />
        <span>Bot ativo</span>
      </div>
    );
  }

  if (isActive) {
    // Extensão conectada mas bot parado (sem heartbeat recente)
    return (
      <div
        className="flex items-center gap-1.5 text-xs text-emerald-600"
        title={version ? `v${version}` : "Extensão conectada"}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>Extensão conectada</span>
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
