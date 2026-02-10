import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Instagram,
  Plus,
  Pause,
  Play,
  Trash2,
  Eye,
  Copy,
  Check,
  Chrome,
  ArrowUpRight,
  Users,
  UserMinus,
  Clock,
  Zap,
  Key,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive"; className: string }
> = {
  active: { label: "Ativa", variant: "default", className: "bg-green-500/15 text-green-400 border-green-500/30" },
  paused: {
    label: "Pausada",
    variant: "secondary",
    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  },
  rate_limited: {
    label: "Rate Limited",
    variant: "secondary",
    className: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  },
  blocked: { label: "Bloqueada", variant: "destructive", className: "bg-red-500/15 text-red-400 border-red-500/30" },
};

export default function AccountsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectOpen, setConnectOpen] = useState(false);
  const [connectionKey, setConnectionKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [detailAccount, setDetailAccount] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [planLimits, setPlanLimits] = useState({ used: 0, max: 999 });
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [keyAccountId, setKeyAccountId] = useState<string | null>(null);
  const [showKeyFor, setShowKeyFor] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    const [accountsRes, subRes] = await Promise.all([
      supabase.from("instagram_accounts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("subscriptions").select("max_accounts").eq("user_id", user.id).maybeSingle(),
    ]);
    const accs = accountsRes.data || [];
    setAccounts(accs);
    setPlanLimits({ used: accs.length, max: subRes.data?.max_accounts ?? 999 });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Realtime subscription for account updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("accounts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "instagram_accounts", filter: `user_id=eq.${user.id}` },
        () => {
          fetchAccounts();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchAccounts]);

  const togglePause = async (acc: any) => {
    try {
      const newStatus = acc.status === "paused" ? "active" : "paused";
      const newActive = newStatus === "active";
      const { error } = await supabase.from("instagram_accounts").update({ status: newStatus, is_active: newActive }).eq("id", acc.id);
      if (error) throw error;
      toast({ title: newStatus === "paused" ? "Conta pausada" : "Conta retomada" });
      fetchAccounts();
    } catch (err: any) {
      toast({ title: "Erro ao alterar status", description: err.message, variant: "destructive" });
    }
  };

  const removeAccount = async (id: string) => {
    try {
      await supabase.from("target_queue").delete().eq("account_id", id);
      await supabase.from("action_logs").delete().eq("account_id", id);
      await supabase.from("action_settings").delete().eq("account_id", id);
      await supabase.from("action_filters").delete().eq("account_id", id);
      const { error } = await supabase.from("instagram_accounts").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Conta removida" });
      fetchAccounts();
      if (detailAccount?.id === id) {
        setDrawerOpen(false);
        setDetailAccount(null);
      }
    } catch (err: any) {
      toast({ title: "Erro ao remover conta", description: err.message, variant: "destructive" });
    }
  };

  // ============================================================
  // FIX CRÍTICO: Gerar chave E inserir na tabela instagram_accounts
  // A extensão vai buscar por connection_key e encontrar esta conta
  // com o user_id já associado
  // ============================================================
  const openConnectModal = async () => {
    if (!user) return;
    setIsCreatingKey(true);
    const key = crypto.randomUUID();

    // Inserir conta placeholder com connection_key E user_id
    const { data, error } = await supabase
      .from("instagram_accounts")
      .insert({
        user_id: user.id,
        connection_key: key,
        ig_username: "(aguardando conexão)",
        is_connected: false,
        is_active: false,
        status: "paused",
        followers_count: 0,
        following_count: 0,
        daily_actions_count: 0,
      })
      .select("id")
      .single();

    if (error) {
      toast({ title: "Erro ao gerar chave", description: error.message, variant: "destructive" });
      setIsCreatingKey(false);
      return;
    }

    setConnectionKey(key);
    setKeyAccountId(data?.id || null);
    setCopied(false);
    setIsCreatingKey(false);
    setConnectOpen(true);
    fetchAccounts();
  };

  // Mostrar chave existente de uma conta
  const showExistingKey = (acc: any) => {
    if (acc.connection_key) {
      setConnectionKey(acc.connection_key);
      setKeyAccountId(acc.id);
      setCopied(false);
      setShowKeyFor(acc.id);
    } else {
      toast({ title: "Esta conta não tem chave de conexão" });
    }
  };

  // Gerar nova chave para conta existente
  const regenerateKey = async (accountId: string) => {
    const newKey = crypto.randomUUID();
    await supabase
      .from("instagram_accounts")
      .update({
        connection_key: newKey,
        is_connected: false,
      })
      .eq("id", accountId);
    setConnectionKey(newKey);
    setCopied(false);
    toast({ title: "Nova chave gerada!" });
    fetchAccounts();
  };

  const copyKey = async () => {
    await navigator.clipboard.writeText(connectionKey);
    setCopied(true);
    toast({ title: "Chave copiada!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const openDetails = (acc: any) => {
    setDetailAccount(acc);
    setDrawerOpen(true);
  };

  const atLimit = planLimits.used >= planLimits.max;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Contas Instagram</h1>
          <p className="text-muted-foreground">Gerencie suas contas conectadas</p>
        </div>
        <Button
          className="gradient-primary glow-primary"
          onClick={openConnectModal}
          disabled={isCreatingKey || atLimit}
        >
          <Plus className="mr-2 h-4 w-4" /> Conectar Nova Conta
        </Button>
      </div>

      {/* Plan Limits Card */}
      <Card className="glass-card">
        <CardContent className="flex items-center justify-between py-4 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {planLimits.used} de {planLimits.max} contas usadas
              </p>
              <Progress value={(planLimits.used / planLimits.max) * 100} className="h-2 w-40 mt-1" />
            </div>
          </div>
          {atLimit && (
            <Button variant="outline" size="sm" className="gap-1 border-primary/40 text-primary hover:bg-primary/10">
              <ArrowUpRight className="h-4 w-4" /> Fazer Upgrade
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center py-16">
            <Instagram className="h-14 w-14 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1">Nenhuma conta conectada</p>
            <p className="text-sm text-muted-foreground mb-4">Conecte sua primeira conta Instagram para começar.</p>
            <Button className="gradient-primary" onClick={openConnectModal}>
              <Plus className="mr-2 h-4 w-4" /> Conectar Conta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const st = statusConfig[acc.status] || statusConfig.active;
            const isPending = !acc.is_connected && acc.ig_username === "(aguardando conexão)";
            return (
              <Card
                key={acc.id}
                className={`glass-card transition-all hover:border-primary/30 ${isPending ? "border-yellow-500/30 border-dashed" : acc.is_active ? "border-primary/20" : ""}`}
              >
                <CardHeader className="flex flex-row items-center gap-3 pb-3">
                  <Avatar className="h-12 w-12 border-2 border-border">
                    <AvatarImage src={acc.profile_pic_url || undefined} alt={acc.ig_username} />
                    <AvatarFallback
                      className={`${isPending ? "bg-yellow-500/20 text-yellow-400" : "gradient-primary text-primary-foreground"} text-sm font-bold`}
                    >
                      {isPending ? "?" : acc.ig_username?.slice(0, 2)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {isPending ? "Aguardando conexão..." : `@${acc.ig_username}`}
                    </CardTitle>
                    <Badge
                      variant={isPending ? "secondary" : st.variant}
                      className={`text-xs mt-1 ${isPending ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" : st.className}`}
                    >
                      {isPending ? "Pendente" : st.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isPending ? (
                    <div className="text-center space-y-3">
                      <p className="text-xs text-muted-foreground">Cole a chave na extensão Chrome para conectar</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5"
                        onClick={() => showExistingKey(acc)}
                      >
                        <Key className="h-3.5 w-3.5" /> Ver Chave
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">Seguidores</span>
                        </div>
                        <span className="font-medium text-right">
                          {acc.followers_count?.toLocaleString("pt-BR") ?? "—"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <UserMinus className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">Seguindo</span>
                        </div>
                        <span className="font-medium text-right">
                          {acc.following_count?.toLocaleString("pt-BR") ?? "—"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">Última sync</span>
                        </div>
                        <span className="font-medium text-right text-xs">
                          {acc.last_synced_at ? new Date(acc.last_synced_at).toLocaleDateString("pt-BR") : "—"}
                        </span>
                      </div>
                      <Separator />
                    </>
                  )}

                  <div className="flex gap-2">
                    {!isPending && (
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => togglePause(acc)}>
                        {acc.status === "paused" ? (
                          <Play className="h-3.5 w-3.5 mr-1" />
                        ) : (
                          <Pause className="h-3.5 w-3.5 mr-1" />
                        )}
                        {acc.status === "paused" ? "Retomar" : "Pausar"}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => openDetails(acc)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteConfirmId(acc.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Connect Modal */}
      <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Chrome className="h-5 w-5 text-primary" />
              Conectar Conta Instagram
            </DialogTitle>
            <DialogDescription>Siga os passos abaixo para conectar sua conta via extensão Chrome.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-3">
              {[
                { step: 1, text: "Instale a extensão GrowBot Pro no Chrome" },
                { step: 2, text: "Faça login na conta Instagram desejada" },
                { step: 3, text: "Clique no ícone da extensão e cole a chave abaixo" },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
                    {step}
                  </div>
                  <p className="text-sm mt-0.5">{text}</p>
                </div>
              ))}
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-2">Sua Chave de Conexão:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-secondary rounded-lg px-3 py-2 text-xs font-mono truncate select-all">
                  {connectionKey}
                </code>
                <Button variant="outline" size="sm" onClick={copyKey} className="shrink-0 gap-1.5">
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copiado" : "Copiar"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Cada chave conecta uma conta Instagram. Para conectar outra conta, gere uma nova chave.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show Key Modal (for pending accounts) */}
      <Dialog open={!!showKeyFor} onOpenChange={() => setShowKeyFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Chave de Conexão
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-secondary rounded-lg px-3 py-2 text-xs font-mono truncate select-all">
                {connectionKey}
              </code>
              <Button variant="outline" size="sm" onClick={copyKey} className="shrink-0 gap-1.5">
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5"
              onClick={() => showKeyFor && regenerateKey(showKeyFor)}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Gerar Nova Chave
            </Button>
            <p className="text-xs text-muted-foreground">Cole esta chave na extensão GrowBot no Chrome.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowKeyFor(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {detailAccount && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14 border-2 border-border">
                    <AvatarImage src={detailAccount.profile_pic_url || undefined} />
                    <AvatarFallback className="gradient-primary text-primary-foreground font-bold">
                      {detailAccount.ig_username?.slice(0, 2)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle>@{detailAccount.ig_username}</SheetTitle>
                    <SheetDescription>
                      <Badge
                        variant="secondary"
                        className={`text-xs mt-1 ${(statusConfig[detailAccount.status] || statusConfig.active).className}`}
                      >
                        {(statusConfig[detailAccount.status] || statusConfig.active).label}
                      </Badge>
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Seguidores" value={detailAccount.followers_count} icon={Users} />
                  <StatCard label="Seguindo" value={detailAccount.following_count} icon={UserMinus} />
                  <StatCard label="Ações Hoje" value={detailAccount.daily_actions_count ?? 0} icon={Zap} />
                  <StatCard
                    label="Status"
                    value={(statusConfig[detailAccount.status] || statusConfig.active).label}
                    icon={Instagram}
                  />
                </div>

                <Separator />

                {/* Connection Key */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Chave de Conexão</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-secondary rounded-lg px-2 py-1.5 text-xs font-mono truncate select-all">
                      {detailAccount.connection_key || "—"}
                    </code>
                    {detailAccount.connection_key && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(detailAccount.connection_key);
                          toast({ title: "Chave copiada!" });
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5"
                    onClick={() => regenerateKey(detailAccount.id)}
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Gerar Nova Chave
                  </Button>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <DetailRow label="Instagram User ID" value={detailAccount.instagram_user_id || "—"} />
                  <DetailRow label="Conectada" value={detailAccount.is_connected ? "Sim ✅" : "Não ❌"} />
                  <DetailRow
                    label="Última Sincronização"
                    value={
                      detailAccount.last_synced_at
                        ? new Date(detailAccount.last_synced_at).toLocaleString("pt-BR")
                        : "—"
                    }
                  />
                  <DetailRow
                    label="Conectada em"
                    value={new Date(detailAccount.created_at).toLocaleDateString("pt-BR")}
                  />
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => togglePause(detailAccount)}>
                    {detailAccount.status === "paused" ? (
                      <Play className="h-4 w-4 mr-2" />
                    ) : (
                      <Pause className="h-4 w-4 mr-2" />
                    )}
                    {detailAccount.status === "paused" ? "Retomar" : "Pausar"}
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => setDeleteConfirmId(detailAccount.id)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Remover
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todos os dados relacionados (fila, logs, filtros e configurações) desta conta serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirmId) removeAccount(deleteConfirmId);
                setDeleteConfirmId(null);
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: any; icon: React.ElementType }) {
  return (
    <div className="bg-secondary/50 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-lg font-bold">{typeof value === "number" ? value.toLocaleString("pt-BR") : value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
