import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, MoreHorizontal, Key, Trash2, Edit, Copy, Check, Instagram,
  Users, UserPlus, Grid3X3, ExternalLink, Wifi, WifiOff, RefreshCw,
} from "lucide-react";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface IgAccount {
  id: string;
  ig_username: string;
  profile_pic_url: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  bot_online: boolean;
  bot_status: string | null;
  last_heartbeat: string | null;
}

function isBotOnline(acc: IgAccount): boolean {
  if (!acc.bot_online || !acc.last_heartbeat) return false;
  return differenceInMinutes(new Date(), new Date(acc.last_heartbeat)) <= 5;
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; ring: string }> = {
  running: {
    label: "Processing",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    ring: "ring-blue-400/20",
  },
  paused: {
    label: "Pausado",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    ring: "ring-amber-400/20",
  },
  rate_limited: {
    label: "Rate Limited",
    color: "text-red-400",
    bg: "bg-red-400/10",
    ring: "ring-red-400/20",
  },
  offline: {
    label: "Offline",
    color: "text-zinc-400",
    bg: "bg-zinc-400/10",
    ring: "ring-zinc-400/20",
  },
};

const Accounts = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<IgAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<IgAccount | null>(null);
  const [deleteAccount, setDeleteAccount] = useState<IgAccount | null>(null);
  const [tokenModal, setTokenModal] = useState<{ account: IgAccount; token: string | null; loading: boolean } | null>(null);
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("ig_accounts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setAccounts(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("accounts-rt").on("postgres_changes" as any, { event: "*", schema: "public", table: "ig_accounts", filter: `user_id=eq.${user.id}` }, () => fetchAccounts()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetchAccounts]);

  const handleAdd = async () => {
    if (!user || !username.trim()) return;
    setSaving(true);
    const clean = username.trim().replace(/^@/, "");
    const { error } = await supabase.from("ig_accounts").insert({ user_id: user.id, ig_username: clean });
    setSaving(false);
    if (error) { toast.error("Erro ao adicionar conta"); return; }
    toast.success(`@${clean} adicionada!`);
    setUsername(""); setAddOpen(false); fetchAccounts();
  };

  const handleEdit = async () => {
    if (!editAccount || !username.trim()) return;
    setSaving(true);
    const clean = username.trim().replace(/^@/, "");
    const { error } = await supabase.from("ig_accounts").update({ ig_username: clean }).eq("id", editAccount.id);
    setSaving(false);
    if (error) { toast.error("Erro ao atualizar"); return; }
    toast.success("Conta atualizada!"); setUsername(""); setEditAccount(null); fetchAccounts();
  };

  const handleDelete = async () => {
    if (!deleteAccount) return;
    const { error } = await supabase.from("ig_accounts").delete().eq("id", deleteAccount.id);
    if (error) { toast.error("Erro ao remover"); return; }
    toast.success("Conta removida!"); setDeleteAccount(null); fetchAccounts();
  };

  const handleGenerateToken = async (account: IgAccount) => {
    setTokenModal({ account, token: null, loading: true });
    const { data, error } = await supabase.rpc("generate_bridge_token", { p_ig_account_id: account.id });
    if (error || !data) { toast.error("Erro ao gerar token"); setTokenModal(null); return; }
    setTokenModal({ account, token: data, loading: false });
  };

  const copyToken = () => {
    if (!tokenModal?.token) return;
    navigator.clipboard.writeText(tokenModal.token);
    setCopied(true); toast.success("Token copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6 page-enter">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Contas Instagram</h1>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="border-border/40 overflow-hidden">
              <CardContent className="p-0">
                <div className="h-20 bg-secondary/30 animate-pulse" />
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3 -mt-10">
                    <div className="h-16 w-16 rounded-full animate-pulse bg-muted ring-4 ring-background" />
                    <div className="space-y-2 pt-6 flex-1">
                      <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="h-10 w-20 animate-pulse rounded bg-muted" />
                    <div className="h-10 w-20 animate-pulse rounded bg-muted" />
                    <div className="h-10 w-20 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contas Instagram</h1>
          <p className="text-sm text-muted-foreground/60 mt-0.5">Gerencie suas contas conectadas</p>
        </div>
        <Button onClick={() => { setUsername(""); setAddOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card className="border-border/40 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8 mb-4">
              <Instagram className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Nenhuma conta conectada</h3>
            <p className="text-sm text-muted-foreground/60 mb-5 max-w-xs">Adicione sua conta do Instagram para começar a monitorar o crescimento e automatizar ações.</p>
            <Button onClick={() => { setUsername(""); setAddOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" /> Adicionar Conta Instagram
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => {
            const online = isBotOnline(acc);
            const statusKey = online ? (acc.bot_status || "running") : "offline";
            const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.offline;
            const initials = acc.ig_username.slice(0, 2).toUpperCase();

            return (
              <Card key={acc.id} className="card-hover overflow-hidden group">
                <CardContent className="p-0">
                  {/* ─── Header gradient bar ─── */}
                  <div className={cn(
                    "h-16 relative overflow-hidden",
                    online
                      ? "bg-gradient-to-r from-primary/15 via-primary/8 to-emerald-500/10"
                      : "bg-gradient-to-r from-secondary/80 via-secondary/60 to-secondary/40"
                  )}>
                    {/* Subtle pattern */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{
                      backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
                      backgroundSize: "16px 16px",
                    }} />
                    {/* Actions menu */}
                    <div className="absolute top-2.5 right-2.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-background/40 backdrop-blur-sm hover:bg-background/60 rounded-lg"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => { setUsername(acc.ig_username); setEditAccount(acc); }}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleGenerateToken(acc)}>
                            <Key className="mr-2 h-4 w-4" /> Gerar Token
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => window.open(`https://instagram.com/${acc.ig_username}`, "_blank")}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" /> Ver no Instagram
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteAccount(acc)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* ─── Profile Section ─── */}
                  <div className="px-5 pb-5">
                    {/* Avatar overlapping header */}
                    <div className="flex items-end gap-3.5 -mt-8">
                      <div className="relative shrink-0">
                        {acc.profile_pic_url ? (
                          <img
                            src={acc.profile_pic_url}
                            alt={acc.ig_username}
                            className="h-16 w-16 rounded-full object-cover ring-[3px] ring-background shadow-lg"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-[3px] ring-background shadow-lg text-base font-bold text-primary">
                            {initials}
                          </div>
                        )}
                        {/* Online indicator on avatar */}
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-4.5 w-4.5 rounded-full ring-[2.5px] ring-background flex items-center justify-center",
                          online ? "bg-emerald-400" : "bg-zinc-500"
                        )}>
                          <div className="h-[14px] w-[14px] rounded-full flex items-center justify-center">
                            {online ? (
                              <Wifi className="h-2 w-2 text-white" />
                            ) : (
                              <WifiOff className="h-2 w-2 text-white" />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 pb-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[15px] font-bold truncate">@{acc.ig_username}</h3>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn("text-xs font-medium", online ? "text-emerald-400" : "text-zinc-400")}>
                            {online ? "Online" : "Offline"}
                          </span>
                          {online && (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ─── Stats Grid ─── */}
                    <div className="grid grid-cols-3 gap-3 mt-5">
                      <div className="text-center rounded-xl bg-secondary/30 py-3 px-2 ring-1 ring-border/30">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Users className="h-3 w-3 text-primary/50" />
                        </div>
                        <p className="text-lg font-bold mono leading-none">
                          {formatCount(acc.followers_count ?? 0)}
                        </p>
                        <p className="text-[10px] text-muted-foreground/50 font-medium mt-1">seguidores</p>
                      </div>
                      <div className="text-center rounded-xl bg-secondary/30 py-3 px-2 ring-1 ring-border/30">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <UserPlus className="h-3 w-3 text-blue-400/50" />
                        </div>
                        <p className="text-lg font-bold mono leading-none">
                          {formatCount(acc.following_count ?? 0)}
                        </p>
                        <p className="text-[10px] text-muted-foreground/50 font-medium mt-1">seguindo</p>
                      </div>
                      <div className="text-center rounded-xl bg-secondary/30 py-3 px-2 ring-1 ring-border/30">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Grid3X3 className="h-3 w-3 text-amber-400/50" />
                        </div>
                        <p className="text-lg font-bold mono leading-none">
                          {formatCount(acc.posts_count ?? 0)}
                        </p>
                        <p className="text-[10px] text-muted-foreground/50 font-medium mt-1">posts</p>
                      </div>
                    </div>

                    {/* ─── Status Footer ─── */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-semibold capitalize px-2.5 py-0.5 ring-1",
                          statusCfg.color, statusCfg.bg, statusCfg.ring, "border-0"
                        )}
                      >
                        {statusCfg.label}
                      </Badge>
                      {acc.last_heartbeat && (
                        <span className="text-[10px] text-muted-foreground/40 mono">
                          {formatDistanceToNow(new Date(acc.last_heartbeat), { addSuffix: true, locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Add account card */}
          <Card
            className="border-dashed border-border/30 hover:border-primary/20 transition-all cursor-pointer group"
            onClick={() => { setUsername(""); setAddOpen(true); }}
          >
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[280px] text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/6 ring-1 ring-primary/10 group-hover:bg-primary/10 transition-colors mb-3">
                <Plus className="h-5 w-5 text-primary/60 group-hover:text-primary transition-colors" />
              </div>
              <p className="text-sm font-medium text-muted-foreground/60 group-hover:text-foreground/80 transition-colors">
                Adicionar conta
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ADD */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Conta Instagram</DialogTitle>
            <DialogDescription>Insira o nome de usuário da conta que deseja conectar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="ig-u">@username</Label>
            <Input id="ig-u" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={saving || !username.trim()}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT */}
      <Dialog open={!!editAccount} onOpenChange={(o) => !o && setEditAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Conta</DialogTitle>
            <DialogDescription>Atualize o nome de usuário.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="edit-u">@username</Label>
            <Input id="edit-u" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleEdit()} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAccount(null)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={saving || !username.trim()}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TOKEN */}
      <Dialog open={!!tokenModal} onOpenChange={(o) => { if (!o) { setTokenModal(null); setCopied(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Token de Conexão</DialogTitle>
            <DialogDescription>Cole este token no popup da extensão Organic Bridge para conectar @{tokenModal?.account.ig_username}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {tokenModal?.loading ? (
              <p className="text-sm text-muted-foreground">Gerando token...</p>
            ) : tokenModal?.token ? (
              <>
                <div className="flex gap-2">
                  <Input readOnly value={tokenModal.token} className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={copyToken} className="shrink-0">
                    {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-warning flex items-center gap-1.5">⚠️ Este token só será mostrado uma vez. Copie-o agora.</p>
              </>
            ) : null}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => { setTokenModal(null); setCopied(false); }}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE */}
      <AlertDialog open={!!deleteAccount} onOpenChange={(o) => !o && setDeleteAccount(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover @{deleteAccount?.ig_username}?</AlertDialogTitle>
            <AlertDialogDescription>Todos os dados, logs e tokens associados serão removidos permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Accounts;
