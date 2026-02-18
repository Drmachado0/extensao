import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAccounts } from "@/hooks/useAccounts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { MessageSquare, Plus, MoreHorizontal, Trash2, Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CommentTemplate {
  id: string;
  user_id: string;
  ig_account_id: string | null;
  body: string;
  is_active: boolean;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
}

export default function CommentTemplates() {
  const { user } = useAuth();
  const { accounts, selectedAccountId, setSelectedAccountId } = useAccounts();
  const [templates, setTemplates] = useState<CommentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<CommentTemplate | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<CommentTemplate | null>(null);
  const [newBody, setNewBody] = useState("");
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let q = supabase
      .from("comment_templates")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (selectedAccountId) {
      q = q.or(`ig_account_id.eq.${selectedAccountId},ig_account_id.is.null`);
    }
    const { data, error } = await q;
    if (error) {
      toast.error("Erro ao carregar templates");
      setTemplates([]);
    } else {
      setTemplates((data as CommentTemplate[]) ?? []);
    }
    setLoading(false);
  }, [user, selectedAccountId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("comment_templates-rt")
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "comment_templates", filter: `user_id=eq.${user.id}` },
        () => fetchTemplates()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, fetchTemplates]);

  const handleAdd = async () => {
    if (!user || !newBody.trim()) return;
    setSaving(true);
    const { data: existing } = await supabase
      .from("comment_templates")
      .select("sort_order")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextOrder = (existing?.sort_order ?? -1) + 1;
    const { error } = await supabase.from("comment_templates").insert({
      user_id: user.id,
      ig_account_id: selectedAccountId || null,
      body: newBody.trim(),
      is_active: true,
      sort_order: nextOrder,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Template adicionado");
    setNewBody("");
    setAddOpen(false);
    fetchTemplates();
  };

  const handleEdit = async () => {
    if (!editTemplate) return;
    setSaving(true);
    const { error } = await supabase
      .from("comment_templates")
      .update({ body: editBody.trim(), updated_at: new Date().toISOString() })
      .eq("id", editTemplate.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Template atualizado");
    setEditTemplate(null);
    fetchTemplates();
  };

  const handleToggleActive = async (t: CommentTemplate) => {
    const { error } = await supabase
      .from("comment_templates")
      .update({ is_active: !t.is_active, updated_at: new Date().toISOString() })
      .eq("id", t.id);
    if (error) toast.error(error.message);
    else toast.success(t.is_active ? "Template desativado" : "Template ativado");
    fetchTemplates();
  };

  const handleDelete = async () => {
    if (!deleteTemplate) return;
    const { error } = await supabase.from("comment_templates").delete().eq("id", deleteTemplate.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Template removido");
    setDeleteTemplate(null);
    fetchTemplates();
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Templates de comentários
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Textos que a extensão Bridge pode usar ao comentar em publicações. Use um por vez ou deixe o bot escolher aleatoriamente entre os ativos.
        </p>
      </div>

      <Card className="border-border/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base">Filtro por conta</CardTitle>
            <CardDescription>Mostrar templates globais ou de uma conta</CardDescription>
          </div>
          <Select value={selectedAccountId || "all"} onValueChange={(v) => setSelectedAccountId(v === "all" ? null : v)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Todas / globais" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas / globais</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  @{a.ig_username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>

      <Card className="border-border/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Lista ({templates.length})</CardTitle>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Novo template
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">
              Nenhum template. Adicione frases para a extensão usar nos comentários.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Comentário</TableHead>
                  <TableHead className="w-24">Ativo</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-sm max-w-md truncate" title={t.body}>
                      {t.body}
                    </TableCell>
                    <TableCell>
                      <Switch checked={t.is_active} onCheckedChange={() => handleToggleActive(t)} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditTemplate(t); setEditBody(t.body); }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteTemplate(t)}
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo template de comentário</DialogTitle>
            <DialogDescription>
              A extensão usará este texto ao comentar. Máx. 300 caracteres no Instagram.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label>Texto</Label>
            <Input
              placeholder="Ex: Muito bom! 👏"
              value={newBody}
              onChange={(e) => setNewBody(e.target.value.slice(0, 300))}
              maxLength={300}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">{newBody.length}/300</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={saving || !newBody.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTemplate} onOpenChange={(o) => !o && setEditTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar template</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label>Texto</Label>
            <Input
              value={editBody}
              onChange={(e) => setEditBody(e.target.value.slice(0, 300))}
              maxLength={300}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">{editBody.length}/300</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTemplate(null)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTemplate} onOpenChange={(o) => !o && setDeleteTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover template?</AlertDialogTitle>
            <AlertDialogDescription>
              O comentário será excluído permanentemente.
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
