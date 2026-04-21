import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FORMATS } from "@/lib/formats";
import { ScheduledPost, ScheduledStatus, useBrandLibrary, useScheduledPosts } from "@/hooks/useScheduledPosts";
import { useAwardXp } from "@/hooks/useGamification";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId: string | null;
  editing?: ScheduledPost | null;
  defaults?: Partial<ScheduledPost>;
};

const STATUS_OPTIONS: { value: ScheduledStatus; label: string }[] = [
  { value: "draft", label: "Rascunho" },
  { value: "scheduled", label: "Agendado" },
  { value: "published", label: "Publicado" },
  { value: "failed", label: "Falhou" },
];

/**
 * Render an ISO timestamp as a `datetime-local` input value, using the
 * scheduler's original timezone when available so re-editing a post never
 * drifts even if the user is now in a different tz.
 */
function toLocalInput(iso: string, tz?: string | null) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (tz) {
    try {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hour12: false,
      }).formatToParts(d);
      const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
      return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
    } catch {
      // fall through to browser-local rendering
    }
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ScheduledPostDialog({ open, onOpenChange, brandId, editing, defaults }: Props) {
  const { create, update, remove } = useScheduledPosts(brandId);
  const lib = useBrandLibrary(brandId);
  const awardXp = useAwardXp();

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [when, setWhen] = useState(toLocalInput(new Date().toISOString()));
  const [format, setFormat] = useState<string>("");
  const [status, setStatus] = useState<ScheduledStatus>("draft");
  const [postId, setPostId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [coverUrl, setCoverUrl] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    const src = editing ?? defaults ?? {};
    setTitle((src as any).title ?? "");
    setCaption((src as any).caption ?? "");
    setWhen(toLocalInput((src as any).scheduled_at ?? new Date().toISOString(), (src as any).scheduled_at_tz));
    setFormat((src as any).format ?? "");
    setStatus(((src as any).status as ScheduledStatus) ?? "draft");
    setPostId((src as any).post_id ?? "");
    setNotes((src as any).notes ?? "");
    setCoverUrl((src as any).cover_url ?? "");
  }, [open, editing, defaults]);

  const isEdit = !!editing;
  const saving = create.isPending || update.isPending;

  async function handleSave() {
    const payload = {
      title: title.trim() || "Sem título",
      caption,
      scheduled_at: new Date(when).toISOString(),
      scheduled_at_tz:
        typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : null,
      format: format || null,
      status,
      post_id: postId || null,
      notes,
      cover_url: coverUrl || null,
      brand_id: brandId,
    };
    try {
      if (isEdit && editing) {
        await update.mutateAsync({ id: editing.id, patch: payload as any });
        // se mudou pra published, dispara XP
        if (status === "published" && editing.status !== "published") {
          awardXp(30, "post_created" as any, { scheduledId: editing.id, kind: "post_published" }, { dedupeKey: `pub:${editing.id}` });
        }
        toast.success("Agendamento atualizado");
      } else {
        const created = await create.mutateAsync(payload as any);
        awardXp(15, "post_created" as any, { scheduledId: created.id, kind: "post_scheduled" }, { dedupeKey: `sch:${created.id}` });
        toast.success("Agendamento criado");
      }
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao salvar");
    }
  }

  async function handleDelete() {
    if (!editing) return;
    if (!confirm("Excluir este agendamento?")) return;
    try {
      await remove.mutateAsync(editing.id);
      toast.success("Agendamento excluído");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao excluir");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="bg-gradient-primary bg-clip-text text-transparent">
            {isEdit ? "Editar agendamento" : "Novo agendamento"}
          </DialogTitle>
          <DialogDescription>Planeje e organize as publicações da sua marca.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Carrossel sobre produtividade" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} placeholder="Texto/legenda do post" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="when">Data e hora</Label>
              <Input id="when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ScheduledStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Formato</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  {FORMATS.filter(f => !f.isComingSoon).map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Post da biblioteca (opcional)</Label>
              <Select value={postId || "__none__"} onValueChange={(v) => {
                if (v === "__none__") { setPostId(""); return; }
                setPostId(v);
                const p = (lib.data ?? []).find((x: any) => x.id === v);
                if (p) {
                  if (!title) setTitle(p.title ?? "");
                  if (!format && p.format) setFormat(p.format);
                  if (!coverUrl && p.cover_url) setCoverUrl(p.cover_url);
                }
              }}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {(lib.data ?? []).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.title || "Sem título"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Observações internas" />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {isEdit && (
            <Button variant="destructive" onClick={handleDelete} disabled={remove.isPending} className="mr-auto">
              <Trash2 className="mr-1 h-4 w-4" /> Excluir
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-primary shadow-glow">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
