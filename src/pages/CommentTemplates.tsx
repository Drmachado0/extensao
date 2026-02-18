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
import { MessageSquare, Plus, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { commentSchema } from "@/lib/validations";
import { showError } from "@/lib/errorHandler";
import { logger } from "@/lib/logger";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface CommentTemplate {
  id: string;
  body: string;
  is_active: boolean;
  sort_order: number;
  ig_account_id: string | null;
  created_at: string | null;
}

/**
 * Templates de comentário são armazenados em user_settings.settings_json.comment_templates
 * já que a tabela comment_templates não existe no schema atual.
 */
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
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("settings_json")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      const settingsJson = data?.settings_json as Record<string, unknown> | null;
      const all: CommentTemplate[] = (settingsJson?.comment_templates as CommentTemplate[] | undefined) ?? [];
      const filtered = selectedAccountId
        ? all.filter(t => !t.ig_account_id || t.ig_account_id === selectedAccountId)
        : all;
      filtered.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      setTemplates(filtered);
    } catch (error) {
      logger.error("Erro ao buscar templates", error as Error, { userId: user.id });
      showError(error, "Erro ao carregar templates");
    } finally {
      setLoading(false);
    }
  }, [user, selectedAccountId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const saveAll = async (updated: CommentTemplate[]) => {
    if (!user) return;
    try {
      const { data: existing, error: fetchError } = await supabase
        .from("user_settings")
        .select("settings_json")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      const curr = (existing?.settings_json as Record<string, unknown>) || {};
      // Merge: preserve templates from other accounts
      const allTemplates: CommentTemplate[] = (curr.comment_templates as CommentTemplate[] | undefined) ?? [];
      const otherTemplates = selectedAccountId
        ? allTemplates.filter(t => t.ig_account_id && t.ig_account_id !== selectedAccountId)
        : [];
      const merged = [...otherTemplates, ...updated];
      
      const { error: updateError } = await supabase
        .from("user_settings")
        .update({ settings_json: { ...curr, comment_templates: merged } })
        .eq("user_id", user.id);
      
      if (updateError) throw updateError;
    } catch (error) {
      logger.error("Erro ao salvar templates", error as Error, { userId: user.id });
      throw error;
    }
  };

  const handleAdd = async () => {
    if (!user || !newBody.trim()) return;
    
    // Validar comentário
    const validation = commentSchema.safeParse(newBody.trim());
    if (!validation.success) {
      toast.error("Erro de validação", { 
        description: validation.error.errors[0]?.message || "Comentário inválido" 
      });
      return;
    }
    
    setSaving(true);
    try {
      logger.info("Adicionando template de comentário", { 
        accountId: selectedAccountId,
        bodyLength: newBody.trim().length 
      });
      
      const nextOrder = templates.length > 0 ? Math.max(...templates.map(t => t.sort_order)) + 1 : 0;
      const newTemplate: CommentTemplate = {
        id: crypto.randomUUID(),
        body: validation.data,
        is_active: true,
        sort_order: nextOrder,
        ig_account_id: selectedAccountId || null,
        created_at: new Date().toISOString(),
      };
      await saveAll([...templates, newTemplate]);
      toast.success("Template adicionado");
      setNewBody("");
      setAddOpen(false);
      fetchTemplates();
    } catch (error) {
      showError(error, "Erro ao adicionar template");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editTemplate) return;
    
    // Validar comentário
    const validation = commentSchema.safeParse(editBody.trim());
    if (!validation.success) {
      toast.error("Erro de validação", { 
        description: validation.error.errors[0]?.message || "Comentário inválido" 
      });
      return;
    }
    
    setSaving(true);
    try {
      logger.info("Editando template de comentário", { templateId: editTemplate.id });
      const updated = templates.map(t => t.id === editTemplate.id ? { ...t, body: validation.data } : t);
      await saveAll(updated);
      toast.success("Template atualizado");
      setEditTemplate(null);
      fetchTemplates();
    } catch (error) {
      showError(error, "Erro ao editar template");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (t: CommentTemplate) => {
    try {
      logger.info("Alternando status de template", { templateId: t.id, newStatus: !t.is_active });
      const updated = templates.map(x => x.id === t.id ? { ...x, is_active: !x.is_active } : x);
      await saveAll(updated);
      toast.success(t.is_active ? "Template desativado" : "Template ativado");
      fetchTemplates();
    } catch (error) {
      showError(error, "Erro ao atualizar template");
    }
  };

  const handleDelete = async () => {
    if (!deleteTemplate) return;
    try {
      logger.info("Removendo template", { templateId: deleteTemplate.id });
      const updated = templates.filter(t => t.id !== deleteTemplate.id);
      await saveAll(updated);
      toast.success("Template removido");
      setDeleteTemplate(null);
      fetchTemplates();
    } catch (error) {
      showError(error, "Erro ao remover template");
    }
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
          <Select value={selectedAccountId || "all"} onValueChange={(v) => setSelectedAccountId(v === "all" ? "" : v)}>
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
            <LoadingSpinner size="lg" text="Carregando templates..." />
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
              {saving ? <LoadingSpinner size="sm" className="mr-2" /> : null}
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
              {saving ? <LoadingSpinner size="sm" className="mr-2" /> : null}
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
