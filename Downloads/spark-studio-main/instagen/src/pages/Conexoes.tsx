import { AtSign as Instagram, Share2 as Facebook, Plug, Plus, Sparkles, Loader2 } from "lucide-react";
import { useMarcas } from "@/hooks/useMarcas";
import { useSocialAccounts, useConnectMeta, disconnectSocialAccount, SocialAccount } from "@/hooks/useSocialAccounts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

function statusBadge(acc: SocialAccount) {
  if (acc.status === "revoked") return <Badge variant="secondary" className="bg-muted text-muted-foreground">Revogado</Badge>;
  if (acc.status === "expired") return <Badge variant="destructive">Expirado — reconectar</Badge>;
  if (acc.status === "error") return <Badge variant="destructive">Erro</Badge>;
  if (acc.token_expires_at) {
    const days = Math.floor((new Date(acc.token_expires_at).getTime() - Date.now()) / 86400000);
    if (days <= 7 && days >= 0) return <Badge className="border-0 bg-accent-yellow text-foreground">Token expira em {days}d</Badge>;
  }
  return <Badge className="border-0 bg-emerald-500 text-white">Conectado</Badge>;
}

export default function Conexoes() {
  const { marcas, active } = useMarcas();
  const { setActiveMarcaId } = useAppStore();
  const { accounts, isLoading, refetch } = useSocialAccounts(active?.id);
  const { connect, isConnecting } = useConnectMeta();

  const openConnect = () => {
    if (!active?.id) {
      toast.error("Selecione uma marca primeiro");
      return;
    }
    connect(active.id, "instagram");
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm("Desconectar esta conta?")) return;
    try {
      await disconnectSocialAccount(id);
      toast.success("Conta desconectada");
      refetch();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao desconectar");
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="bg-gradient-primary bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Conexões
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Conecte suas redes sociais para publicar direto do SocialGen
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <div className="h-2 w-2 rounded-full bg-gradient-primary" />
                <span className="max-w-[140px] truncate">{active?.nome ?? "Sem marca"}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-1">
              {marcas.map((m: any) => (
                <button
                  key={m.id}
                  onClick={() => setActiveMarcaId(m.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent"
                >
                  <div className="h-5 w-5 rounded-md" style={{ background: `linear-gradient(135deg, ${m.color_primary ?? "#6b46ff"}, ${m.color_secondary ?? "#ec4899"})` }} />
                  <span className="truncate">{m.nome}</span>
                </button>
              ))}
            </PopoverContent>
          </Popover>
          <Button onClick={openConnect} disabled={isConnecting} className="gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90">
            {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Conectar Instagram
          </Button>
        </div>
      </div>

      {/* Conteúdo */}
      <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <Plug className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Contas conectadas</h2>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Carregando…</div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/60 bg-gradient-soft/40 px-6 py-16 text-center">
            <div className="rounded-2xl bg-gradient-primary p-4 shadow-lg">
              <Instagram className="h-10 w-10 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Nenhuma conta conectada ainda</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Conecte sua conta Instagram Business para agendar e publicar posts diretamente.
              </p>
            </div>
            <Button onClick={openConnect} disabled={isConnecting} className="gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90">
              {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Conectar Instagram
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {accounts.map((acc) => {
              const Icon = acc.provider === "instagram" ? Instagram : Facebook;
              return (
                <div
                  key={acc.id}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-4 backdrop-blur-sm transition-all hover:border-primary/40"
                >
                  <Avatar className="h-12 w-12 border border-border/60">
                    {acc.avatar_url ? <AvatarImage src={acc.avatar_url} /> : null}
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate font-medium">@{acc.username ?? acc.display_name ?? acc.external_id}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {statusBadge(acc)}
                      {acc.last_refreshed_at && (
                        <span className="text-xs text-muted-foreground">
                          atualizado {formatDistanceToNow(new Date(acc.last_refreshed_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>
                  {acc.status !== "revoked" && (
                    <Button variant="ghost" size="sm" onClick={() => handleDisconnect(acc.id)}>
                      Desconectar
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

    </div>
  );
}
