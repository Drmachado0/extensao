import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAccounts } from "@/hooks/useAccounts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Shield, Plus, MoreHorizontal, Trash2, Edit, Upload, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WhitelistEntry {
  id: string;
  user_id: string;
  ig_account_id: string | null;
  username: string;
  ig_user_id: string;
  full_name: string | null;
  profile_pic_url: string | null;
  reason: string | null;
  added_at: string | null;
}

export default function Whitelist() {
  const { user } = useAuth();
  const { accounts, selectedAccountId, setSelectedAccountId } = useAccounts();
  const [entries, setEntries] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<WhitelistEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<WhitelistEntry | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [newReason, setNewReason] = useState("");
  const [editReason, setEditReason] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const fetchWhitelist = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let q = supabase
      .from("whitelist")
      .select("*")
      .eq("user_id", user.id)
      .order("added_at", { ascending: false });
    if (selectedAccountId) q = q.eq("ig_account_id", selectedAccountId);
    const { data, error } = await q;
    if (error) {
      toast.error("Erro ao carregar whitelist");
      setEntries([]);
    } else {
      setEntries((data as WhitelistEntry[]) ?? []);
    }
    setLoading(false);
  }, [user, selectedAccountId]);

  useEffect(() => {
    fetchWhitelist();
  }, [fetchWhitelist]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("whitelist-rt")
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "whitelist", filter: `user_id=eq.${user.id}` },
        () => fetchWhitelist()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, fetchWhitelist]);

  const filteredEntries = search.trim()
    ? entries.filter(
        (e) =>
          e.username.toLowerCase().includes(search.toLowerCase()) ||
          (e.full_name?.toLowerCase().includes(search.toLowerCase()))
      )
    : entries;

  const handleAdd = async () => {
    if (!user || !newUsername.trim()) return;
    setSaving(true);
    const username = newUsername.trim().replace(/^@/, "");
    const { error } = await supabase.from("whitelist").insert({
      user_id: user.id,
      ig_account_id: selectedAccountId || null,
      username,
      ig_user_id: username,
      reason: newReason.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`@${username} adicionado à whitelist`);
    setNewUsername("");
    setNewReason("");
    setAddOpen(false);
    fetchWhitelist();
  };

  const handleEdit = async () => {
    if (!editEntry) return;
    setSaving(true);
    const { error } = await supabase
      .from("whitelist")
      .update({ reason: editReason.trim() || null })
      .eq("id", editEntry.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Motivo atualizado");
    setEditEntry(null);
    fetchWhitelist();
  };

  const handleDelete = async () => {
    if (!deleteEntry) return;
    const { error } = await supabase.from("whitelist").delete().eq("id", deleteEntry.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Removido da whitelist");
    setDeleteEntry(null);
    fetchWhitelist();
  };

  const handleImport = async () => {
    if (!user || !importText.trim()) return;
    const lines = importText
      .trim()
      .split(/\n/)
      .map((s) => s.trim().replace(/^@/, ""))
      .filter(Boolean);
    const seen = new Set<string>();
    const unique = lines.filter((u) => {
      const key = u.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (unique.length === 0) {
      toast.error("Nenhum usuário válido para importar");
      return;
    }
    setSaving(true);
    const rows = unique.map((username) => ({
      user_id: user.id,
      ig_account_id: selectedAccountId || null,
      username,
      ig_user_id: username,
    }));
    const { error } = await supabase.from("whitelist").insert(rows);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${rows.length} contas adicionadas à whitelist`);
    setImportText("");
    setImportOpen(false);
    fetchWhitelist();
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Whitelist de contas
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Contas nesta lista não serão seguidas, curtidas ou comentadas pelo bot.
        </p>
      </div>

      <Card className="border-border/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base">Filtros</CardTitle>
            <CardDescription>Conta Instagram e busca</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedAccountId || "all"} onValueChange={(v) => setSelectedAccountId(v === "all" ? null : v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todas as contas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as contas</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    @{a.ig_username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por @ ou nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-48"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-border/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Lista ({filteredEntries.length})</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4 mr-1.5" />
              Importar
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">
              Nenhuma conta na whitelist. Adicione ou importe para proteger contas.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Adicionado</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <span className="font-medium">@{e.username}</span>
                      {e.full_name && (
                        <span className="text-muted-foreground text-sm ml-2">({e.full_name})</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {e.reason || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {e.added_at
                        ? formatDistanceToNow(new Date(e.added_at), { addSuffix: true, locale: ptBR })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditEntry(e); setEditReason(e.reason || ""); }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar motivo
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteEntry(e)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar à whitelist</DialogTitle>
            <DialogDescription>O bot não irá seguir, curtir ou comentar nesta conta.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>@ do usuário</Label>
              <Input
                placeholder="usuario"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Input
                placeholder="Ex: amigo, parceiro..."
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={saving || !newUsername.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editEntry} onOpenChange={(o) => !o && setEditEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar motivo</DialogTitle>
            <DialogDescription>@{editEntry?.username}</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label>Motivo</Label>
            <Input
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="Ex: amigo, parceiro..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEntry(null)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar whitelist</DialogTitle>
            <DialogDescription>
              Um @ por linha. Linhas vazias serão ignoradas.
            </DialogDescription>
          </DialogHeader>
          <textarea
            className="w-full min-h-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="usuario1&#10;usuario2&#10;@usuario3"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancelar</Button>
            <Button onClick={handleImport} disabled={saving || !importText.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Importar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteEntry} onOpenChange={(o) => !o && setDeleteEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover da whitelist?</AlertDialogTitle>
            <AlertDialogDescription>
              @{deleteEntry?.username} deixará de estar protegido. O bot poderá interagir com esta conta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
