import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMarcas } from "@/hooks/useMarcas";
import { toast } from "sonner";
import { Palette, Loader2, Check, Upload, X, Type, MessageSquareQuote, Ban } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useQueryClient } from "@tanstack/react-query";
import { useAwardXp } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter (moderna, neutra)" },
  { value: "Poppins", label: "Poppins (geométrica, amigável)" },
  { value: "Roboto", label: "Roboto (limpa, técnica)" },
  { value: "Montserrat", label: "Montserrat (forte, marketing)" },
  { value: "Playfair Display", label: "Playfair Display (elegante, serifada)" },
  { value: "DM Sans", label: "DM Sans (minimal, atual)" },
];

const FIELDS: { key: string; label: string; type?: "text" | "textarea"; placeholder?: string; group: string }[] = [
  { group: "Identidade", key: "nome", label: "Nome da marca", placeholder: "Ex.: Café Aurora" },
  { group: "Identidade", key: "segmento", label: "Segmento", placeholder: "Ex.: Alimentação" },
  { group: "Identidade", key: "nicho", label: "Nicho", placeholder: "Ex.: Cafeteria especial" },
  { group: "Identidade", key: "proposta_valor", label: "Proposta de valor", type: "textarea" },

  { group: "Público", key: "publico_alvo", label: "Público-alvo", type: "textarea" },
  { group: "Público", key: "faixa_etaria", label: "Faixa etária", placeholder: "25-45" },
  { group: "Público", key: "dores_publico", label: "Dores", type: "textarea" },
  { group: "Público", key: "desejos_publico", label: "Desejos", type: "textarea" },

  { group: "Contato", key: "instagram_handle", label: "@ do Instagram" },
  { group: "Contato", key: "whatsapp", label: "WhatsApp" },
  { group: "Contato", key: "link_bio", label: "Link na bio" },
  { group: "Contato", key: "cidade", label: "Cidade" },
];

export default function Marca() {
  const { user } = useAuth();
  const { marcas, active } = useMarcas();
  const { setActiveMarcaId } = useAppStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const awardXp = useAwardXp();
  const isFirst = marcas.length === 0;
  const editing = active;

  const [form, setForm] = useState<Record<string, any>>({
    color_primary: "#6b46ff",
    color_secondary: "#ec4899",
    color_accent: "#0ea5e9",
    font_heading: "Inter",
    font_body: "Inter",
    forbidden_words: [],
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setForm({
        ...editing,
        forbidden_words: (editing as any).forbidden_words ?? [],
      });
    }
  }, [editing?.id]);

  const groups = Array.from(new Set(FIELDS.map((f) => f.group)));

  const completionFields = ["logo_url", "color_primary", "color_secondary", "color_accent", "font_heading", "font_body", "voice_tone"];
  const isComplete = useMemo(
    () => completionFields.every((k) => form[k] && String(form[k]).trim() !== ""),
    [form],
  );

  async function handleLogoUpload(file: File) {
    if (!user) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Logo deve ter até 4MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("brand-assets").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("brand-assets").getPublicUrl(path);
      setForm((prev) => ({ ...prev, logo_url: data.publicUrl }));
      toast.success("Logo enviado!");
    } catch (err: any) {
      toast.error(err.message ?? "Falha ao enviar logo");
    } finally {
      setUploading(false);
    }
  }

  function addTag() {
    const v = tagInput.trim();
    if (!v) return;
    const list: string[] = Array.isArray(form.forbidden_words) ? form.forbidden_words : [];
    if (list.includes(v)) return;
    setForm({ ...form, forbidden_words: [...list, v] });
    setTagInput("");
  }
  function removeTag(t: string) {
    const list: string[] = Array.isArray(form.forbidden_words) ? form.forbidden_words : [];
    setForm({ ...form, forbidden_words: list.filter((x) => x !== t) });
  }

  async function save() {
    if (!user) return;
    if (!form.nome) { toast.error("Dê um nome para a marca"); return; }
    setSaving(true);
    try {
      // Sanitiza apenas campos conhecidos para evitar erro de coluna
      const payload = { ...form };
      if (editing) {
        const { error } = await (supabase.from("sg_marcas") as any).update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Marca atualizada");
      } else {
        const { data, error } = await (supabase.from("sg_marcas") as any).insert({ ...payload, is_default: true }).select().single();
        if (error) throw error;
        setActiveMarcaId(data.id);
        toast.success("Marca criada!");
      }

      if (isComplete) {
        awardXp(100, "brand_completed", { marca_id: editing?.id ?? "new" }, { dedupeKey: `brand:${user.id}` });
      }

      await qc.invalidateQueries({ queryKey: ["marcas"] });
      if (isFirst) navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally { setSaving(false); }
  }

  const forbiddenList: string[] = Array.isArray(form.forbidden_words) ? form.forbidden_words : [];

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 md:p-10">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
          <Palette className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{isFirst ? "Configure sua marca" : "Editar marca"}</h1>
          <p className="mt-1 text-muted-foreground">
            Quanto mais detalhe, mais personalizado fica o conteúdo gerado pela IA.
          </p>
          {isComplete && (
            <Badge className="mt-3 border-0 bg-gradient-primary text-primary-foreground">
              <Check className="mr-1 h-3 w-3" /> Marca completa · +100 XP ao salvar
            </Badge>
          )}
        </div>
      </div>

      {/* Identidade visual */}
      <Card className="p-6 shadow-card">
        <div className="mb-5 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-gradient-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Identidade visual</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-[160px_1fr]">
          {/* Logo */}
          <div>
            <Label className="mb-2 block text-xs font-medium">Logo da marca</Label>
            <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border/60 bg-gradient-soft">
              {form.logo_url ? (
                <img src={form.logo_url} alt="Logo" className="h-full w-full object-contain p-2" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
            />
            <div className="mt-2 flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : form.logo_url ? "Trocar" : "Enviar"}
              </Button>
              {form.logo_url && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, logo_url: null })}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Paleta de cores */}
          <div>
            <Label className="mb-2 block text-xs font-medium">Paleta de cores</Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: "color_primary", label: "Primária" },
                { key: "color_secondary", label: "Secundária" },
                { key: "color_accent", label: "Acento" },
              ].map((c) => (
                <div key={c.key}>
                  <div
                    className="mb-2 h-16 w-full rounded-lg border border-border/60 shadow-sm"
                    style={{ background: form[c.key] || "#e5e7eb" }}
                  />
                  <div className="flex gap-1">
                    <input
                      type="color"
                      value={form[c.key] ?? "#000000"}
                      onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
                      className="h-8 w-10 cursor-pointer rounded-md border border-input bg-transparent"
                    />
                    <Input
                      value={form[c.key] ?? ""}
                      onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
                      className="flex-1 font-mono text-xs"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">{c.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Tipografia */}
      <Card className="p-6 shadow-card">
        <div className="mb-5 flex items-center gap-2">
          <Type className="h-3.5 w-3.5 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Tipografia</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { key: "font_heading", label: "Fonte de títulos", preview: "Aa Título" },
            { key: "font_body", label: "Fonte de corpo", preview: "Aa Corpo do texto" },
          ].map((f) => (
            <div key={f.key}>
              <Label className="mb-1.5 block text-xs font-medium">{f.label}</Label>
              <Select value={form[f.key] ?? ""} onValueChange={(v) => setForm({ ...form, [f.key]: v })}>
                <SelectTrigger><SelectValue placeholder="Escolha uma fonte" /></SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} style={{ fontFamily: o.value }}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div
                className="mt-2 rounded-md border border-border/40 bg-gradient-soft p-3 text-xl"
                style={{ fontFamily: form[f.key] || "inherit" }}
              >
                {f.preview}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tom de voz */}
      <Card className="p-6 shadow-card">
        <div className="mb-5 flex items-center gap-2">
          <MessageSquareQuote className="h-3.5 w-3.5 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Tom de voz</h2>
        </div>
        <Label className="mb-1.5 block text-xs font-medium">Como sua marca conversa?</Label>
        <Textarea
          value={form.voice_tone ?? ""}
          onChange={(e) => setForm({ ...form, voice_tone: e.target.value })}
          placeholder="Ex.: descontraído e inspirador, profissional e direto, próximo e acolhedor..."
          rows={3}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Descreva em poucas palavras. A IA usa esse tom para escrever copy, títulos e CTAs.
        </p>
      </Card>

      {/* Palavras proibidas */}
      <Card className="p-6 shadow-card">
        <div className="mb-5 flex items-center gap-2">
          <Ban className="h-3.5 w-3.5 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Palavras a evitar</h2>
        </div>
        <Label className="mb-1.5 block text-xs font-medium">Palavras-chave proibidas</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder="Digite uma palavra e pressione Enter"
          />
          <Button type="button" variant="outline" onClick={addTag}>Adicionar</Button>
        </div>
        {forbiddenList.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {forbiddenList.map((t) => (
              <Badge key={t} variant="secondary" className="gap-1">
                {t}
                <button onClick={() => removeTag(t)} className="ml-0.5 rounded hover:bg-background/50">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {/* Resto dos campos básicos agrupados */}
      {groups.map((g) => (
        <Card key={g} className="p-6 shadow-card">
          <div className="mb-5 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-gradient-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{g}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {FIELDS.filter((f) => f.group === g).map((f) => (
              <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
                <Label className="mb-1.5 block text-xs font-medium">{f.label}</Label>
                {f.type === "textarea" ? (
                  <Textarea value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} rows={3} />
                ) : (
                  <Input value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} />
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}

      <div className={cn("sticky bottom-4 z-10 flex justify-end")}>
        <Button size="lg" onClick={save} disabled={saving} className="bg-gradient-primary shadow-glow hover:opacity-95">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-1.5 h-4 w-4" /> Salvar marca</>}
        </Button>
      </div>
    </div>
  );
}
