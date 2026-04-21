import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fabric } from "fabric";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Send,
  Sparkles,
  Type,
  Image as ImageIcon,
  Square,
  Circle as CircleIcon,
  Triangle as TriangleIcon,
  Minus,
  Star,
  Download,
  CalendarPlus,
  Layers,
  Loader2,
  RefreshCw,
  Undo2,
  Redo2,
  Copy,
  Trash2,
  ZoomIn,
  ZoomOut,
  Check,
  CloudUpload,
  CheckCircle2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Heading1,
  Heading2,
  Pilcrow,
  Wand2,
  Palette,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  Sliders,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { getFormat } from "@/lib/formats";
import { toast } from "sonner";
import { useMarcas } from "@/hooks/useMarcas";
import { useInvalidateCredits } from "@/hooks/useCredits";
import { useAwardXp } from "@/hooks/useGamification";
import { UserImagesPanel } from "@/components/UserImagesPanel";

type ChatMsg = { role: "user" | "assistant"; content: string };
type GenStatus = {
  status: "queued" | "running" | "completed" | "failed" | string;
  progress: number;
  currentSlide: number;
  totalSlides: number;
  phase?: string | null;
  slides: { index: number; imageUrl: string | null }[];
  error?: string | null;
};
type SlideData = { idx?: number; index?: number; content?: string; fabricJSON?: any };

export default function Editor() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const postId = params.get("post");
  const jobId = params.get("job");
  const { active: activeBrand } = useMarcas();

  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeSlide, setActiveSlide] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chat, setChat] = useState<ChatMsg[]>([
    { role: "assistant", content: "Oi! 👋 Posso reescrever copy, sugerir hooks ou trocar o estilo visual. O que vamos ajustar?" },
  ]);
  const [gen, setGen] = useState<GenStatus | null>(null);
  const [generatedImages, setGeneratedImages] = useState<(string | null)[]>([]);
  const [leftTab, setLeftTab] = useState<"texto" | "elementos" | "imagens" | "camadas">("texto");
  const invalidateCredits = useInvalidateCredits();
  const awardXp = useAwardXp();
  const [selectedObj, setSelectedObj] = useState<fabric.Object | null>(null);
  const [, selTick] = useState(0);
  const refreshSel = () => selTick((n) => n + 1);

  // Histórico Undo/Redo (snapshots por slide ativo)
  const historyRef = useRef<{ stack: string[]; index: number; suspended: boolean }>({
    stack: [],
    index: -1,
    suspended: false,
  });
  const [, forceTick] = useState(0);
  const refreshHistoryUI = () => forceTick((n) => n + 1);

  const { data: post, refetch: refetchPost } = useQuery({
    queryKey: ["post", postId],
    enabled: !!postId,
    queryFn: async () => {
      const { data, error } = await supabase.from("sg_posts").select("*").eq("id", postId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const format = post ? getFormat(post.formato_id) : null;
  const slidesFromPost = (post?.slides as SlideData[]) ?? [];
  const slideImagesFromPost = (post?.slide_images as any[]) ?? [];
  const totalSlides = Math.max(slidesFromPost.length, slideImagesFromPost.length, gen?.totalSlides ?? 1);
  const slidesArr = useMemo(
    () => Array.from({ length: totalSlides }, (_, i) => ({ idx: i })),
    [totalSlides],
  );

  // Sincroniza imagens vindas do post (storage) com o estado local.
  // Dep key é estável por valor (URLs concatenadas) para evitar re-fire
  // quando o array é um novo ref com mesmo conteúdo.
  const slideImagesKey = useMemo(
    () =>
      slideImagesFromPost
        .map((s: any) => `${s.idx ?? s.index ?? 0}:${s.url ?? s.imageUrl ?? ""}`)
        .join("|"),
    [slideImagesFromPost],
  );
  useEffect(() => {
    if (!slideImagesFromPost.length) return;
    setGeneratedImages((prev) => {
      const next = [...prev];
      for (const s of slideImagesFromPost) {
        const idx = s.idx ?? s.index ?? 0;
        next[idx] = s.url ?? s.imageUrl ?? null;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideImagesKey]);

  // Polling do job com backoff exponencial, teto de tentativas e parada em 401/403
  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    let timer: number | undefined;
    let errors = 0;
    const MAX_ERRORS = 10;
    const BASE_DELAY = 2000;
    const MAX_DELAY = 30000;

    async function tick() {
      if (cancelled) return;
      try {
        const { data, error } = await supabase.functions.invoke("check-generation-status", { body: { jobId } });
        if (cancelled) return;
        if (error) {
          const status = (error as any)?.context?.status;
          if (status === 401 || status === 403) {
            cancelled = true;
            toast.error("Sessão expirada — faça login novamente.");
            return;
          }
          throw error;
        }
        errors = 0;
        const s = data as GenStatus;
        setGen(s);

        if (s.slides?.length) {
          setGeneratedImages((prev) => {
            const next = [...prev];
            for (const sl of s.slides) if (sl.imageUrl) next[sl.index] = sl.imageUrl;
            return next;
          });
        }

        if (s.status === "completed") {
          await refetchPost();
          toast.success("Geração concluída!");
          return;
        }
        if (s.status === "failed") {
          toast.error(s.error || "Falha ao gerar");
          return;
        }
        timer = window.setTimeout(tick, BASE_DELAY);
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        errors += 1;
        if (errors >= MAX_ERRORS) {
          cancelled = true;
          toast.error("Perdemos contato com o servidor. Recarregue a página.");
          return;
        }
        const delay = Math.min(MAX_DELAY, BASE_DELAY * Math.pow(1.5, errors));
        timer = window.setTimeout(tick, delay);
      }
    }
    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [jobId, refetchPost]);

  // ============ Canvas: cria UMA vez por mudança de formato/slide ============
  useEffect(() => {
    if (!canvasElRef.current || !format) return;
    const ratio = format.width / format.height;
    const maxH = 600;
    const h = maxH;
    const w = Math.round(h * ratio);

    const c = new fabric.Canvas(canvasElRef.current, {
      width: w,
      height: h,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
    });
    fabricRef.current = c;

    // Reset histórico para este slide
    historyRef.current = { stack: [], index: -1, suspended: true };

    // Carrega fabricJSON se existir, senão imagem como background, senão placeholder
    const slideData = slidesFromPost[activeSlide];
    const imgUrl = generatedImages[activeSlide];

    const finishLoad = () => {
      // Snapshot inicial pro undo
      historyRef.current.suspended = false;
      pushHistory();
      refreshHistoryUI();
    };

    if (slideData?.fabricJSON && Object.keys(slideData.fabricJSON).length > 0) {
      c.loadFromJSON(slideData.fabricJSON, () => {
        c.renderAll();
        finishLoad();
      });
    } else if (imgUrl) {
      fabric.Image.fromURL(
        imgUrl,
        (img) => {
          if (!img) {
            finishLoad();
            return;
          }
          img.set({
            left: 0,
            top: 0,
            selectable: false,
            evented: false,
            scaleX: w / (img.width || w),
            scaleY: h / (img.height || h),
          });
          (img as any).isBackground = true;
          c.add(img);
          c.sendToBack(img);
          c.renderAll();
          finishLoad();
        },
        { crossOrigin: "anonymous" },
      );
    } else {
      const grad = new fabric.Rect({
        left: 0,
        top: 0,
        width: w,
        height: h,
        selectable: false,
        evented: false,
        fill: new fabric.Gradient({
          type: "linear",
          coords: { x1: 0, y1: 0, x2: w, y2: h },
          colorStops: [
            { offset: 0, color: "#6b46ff" },
            { offset: 1, color: "#ec4899" },
          ],
        }),
      });
      (grad as any).isBackground = true;
      c.add(grad);
      const title = new fabric.Textbox(`Slide ${activeSlide + 1}`, {
        left: 40,
        top: h / 2 - 60,
        width: w - 80,
        fontSize: 56,
        fontFamily: "Inter",
        fontWeight: "700",
        fill: "#ffffff",
        textAlign: "left",
      });
      c.add(title);
      finishLoad();
    }

    // Listeners para histórico e auto-save
    const onChange = () => {
      if (historyRef.current.suspended) return;
      pushHistory();
      refreshHistoryUI();
      scheduleSave();
    };
    c.on("object:added", onChange);
    c.on("object:modified", onChange);
    c.on("object:removed", onChange);

    const onSel = () => {
      setSelectedObj(c.getActiveObject() ?? null);
      refreshSel();
    };
    const onClr = () => {
      setSelectedObj(null);
      refreshSel();
    };
    c.on("selection:created", onSel);
    c.on("selection:updated", onSel);
    c.on("selection:cleared", onClr);
    c.on("object:modified", refreshSel);

    return () => {
      try {
        (c as any).__disposed = true;
        c.off();
        c.dispose();
      } catch (err) {
        console.warn("[canvas dispose]", err);
      }
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format?.id, activeSlide, generatedImages[activeSlide], slidesFromPost.length]);

  // Aplica zoom no canvas (escalonando elemento DOM, mantém qualidade vetorial)
  useEffect(() => {
    const c = fabricRef.current;
    if (!c) return;
    const upper = (c as any).upperCanvasEl as HTMLCanvasElement | undefined;
    const lower = (c as any).lowerCanvasEl as HTMLCanvasElement | undefined;
    const wrapper = (c as any).wrapperEl as HTMLDivElement | undefined;
    if (wrapper) {
      wrapper.style.transform = `scale(${zoom})`;
      wrapper.style.transformOrigin = "center center";
    }
    void upper;
    void lower;
  }, [zoom]);

  // Zoom via Ctrl+scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom((z) => Math.min(3, Math.max(0.25, +(z + (e.deltaY < 0 ? 0.1 : -0.1)).toFixed(2))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // ============ Histórico Undo/Redo ============
  function pushHistory() {
    const c = fabricRef.current;
    if (!c || (c as any).__disposed) return;
    try {
      const snap = JSON.stringify(c.toJSON(["isBackground"]));
      const h = historyRef.current;
      h.stack = h.stack.slice(0, h.index + 1);
      h.stack.push(snap);
      if (h.stack.length > 50) h.stack.shift();
      h.index = h.stack.length - 1;
    } catch (err) {
      console.warn("[pushHistory] canvas indisponível", err);
    }
  }
  function undo() {
    const c = fabricRef.current;
    const h = historyRef.current;
    if (!c || (c as any).__disposed || h.index <= 0) return;
    h.index -= 1;
    h.suspended = true;
    c.loadFromJSON(h.stack[h.index], () => {
      if (!fabricRef.current || (fabricRef.current as any).__disposed) return;
      c.renderAll();
      h.suspended = false;
      refreshHistoryUI();
      scheduleSave();
    });
  }
  function redo() {
    const c = fabricRef.current;
    const h = historyRef.current;
    if (!c || (c as any).__disposed || h.index >= h.stack.length - 1) return;
    h.index += 1;
    h.suspended = true;
    c.loadFromJSON(h.stack[h.index], () => {
      if (!fabricRef.current || (fabricRef.current as any).__disposed) return;
      c.renderAll();
      h.suspended = false;
      refreshHistoryUI();
      scheduleSave();
    });
  }
  const canUndo = historyRef.current.index > 0;
  const canRedo = historyRef.current.index < historyRef.current.stack.length - 1;

  // ============ Auto-save (debounced 2s) ============
  const saveTimerRef = useRef<number | undefined>(undefined);
  const scheduleSave = useCallback(() => {
    if (!postId) return;
    setSaveState("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(async () => {
      const c = fabricRef.current;
      if (!c) return;
      const json = c.toJSON(["isBackground"]);

      // Mescla no array slides existente
      const baseSlides: SlideData[] = ((post?.slides as SlideData[]) ?? []).slice();
      while (baseSlides.length <= activeSlide) baseSlides.push({ idx: baseSlides.length, content: "" });
      baseSlides[activeSlide] = {
        ...(baseSlides[activeSlide] ?? {}),
        idx: activeSlide,
        fabricJSON: json,
      };

      const { error } = await supabase
        .from("sg_posts")
        .update({ slides: baseSlides as any, updated_at: new Date().toISOString() })
        .eq("id", postId);
      if (error) {
        console.error(error);
        setSaveState("idle");
        toast.error("Falha ao salvar");
        return;
      }
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1500);
    }, 2000);
  }, [postId, post?.slides, activeSlide]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // ============ Toolbar actions ============
  function addText(
    preset: "title" | "subtitle" | "body" | "custom" = "custom",
    customText?: string,
  ) {
    const c = fabricRef.current;
    if (!c) return;
    const presets = {
      title: { text: "Adicionar título", fontSize: 48, fontWeight: "700" },
      subtitle: { text: "Adicionar subtítulo", fontSize: 32, fontWeight: "600" },
      body: { text: "Adicionar corpo de texto", fontSize: 20, fontWeight: "400" },
      custom: { text: customText ?? "Novo texto", fontSize: 32, fontWeight: "600" },
    } as const;
    const p = presets[preset];
    const tb = new fabric.Textbox(p.text, {
      left: 80,
      top: 80,
      width: 400,
      fontSize: p.fontSize,
      fill: "#ffffff",
      fontFamily: "Inter",
      fontWeight: p.fontWeight,
      textAlign: "left",
    });
    c.add(tb);
    c.setActiveObject(tb);
    c.requestRenderAll();
  }

  function updateSelected(props: Record<string, any>) {
    const c = fabricRef.current;
    const obj = c?.getActiveObject();
    if (!c || !obj) return;
    Object.entries(props).forEach(([k, v]) => obj.set(k as any, v));
    obj.setCoords();
    c.requestRenderAll();
    refreshSel();
    pushHistory();
    refreshHistoryUI();
    scheduleSave();
  }
  function addShape(kind: "rect" | "circle" | "triangle" | "line" | "star") {
    const c = fabricRef.current;
    if (!c) return;
    let obj: fabric.Object;
    const baseProps = { left: 120, top: 120, fill: "#ffffff", opacity: 0.95 };
    if (kind === "rect") {
      obj = new fabric.Rect({ ...baseProps, width: 160, height: 160, rx: 12, ry: 12 });
    } else if (kind === "circle") {
      obj = new fabric.Circle({ ...baseProps, radius: 80 });
    } else if (kind === "triangle") {
      obj = new fabric.Triangle({ ...baseProps, width: 160, height: 160 });
    } else if (kind === "line") {
      obj = new fabric.Line([0, 0, 240, 0], {
        left: 120,
        top: 200,
        stroke: "#ffffff",
        strokeWidth: 6,
      });
    } else {
      // estrela 5 pontas
      const pts = makeStarPoints(5, 80, 36);
      obj = new fabric.Polygon(pts, { ...baseProps, left: 140, top: 140 });
    }
    c.add(obj);
    c.setActiveObject(obj);
    c.requestRenderAll();
  }
  function addImageFromUrl(url: string) {
    const c = fabricRef.current;
    if (!c) return;
    fabric.Image.fromURL(
      url,
      (img) => {
        if (!img) {
          toast.error("Não foi possível carregar a imagem");
          return;
        }
        const cw = c.getWidth();
        const ch = c.getHeight();
        const iw = img.width || 1;
        const ih = img.height || 1;
        // Escala pra caber em 60% do canvas
        const scale = Math.min((cw * 0.6) / iw, (ch * 0.6) / ih, 1);
        img.set({
          left: (cw - iw * scale) / 2,
          top: (ch - ih * scale) / 2,
          scaleX: scale,
          scaleY: scale,
        });
        c.add(img);
        c.setActiveObject(img);
        c.requestRenderAll();
        pushHistory();
        refreshHistoryUI();
        scheduleSave();
      },
      { crossOrigin: "anonymous" },
    );
  }
  function makeStarPoints(spikes: number, outerR: number, innerR: number) {
    const step = Math.PI / spikes;
    const pts: { x: number; y: number }[] = [];
    let rot = (Math.PI / 2) * 3;
    for (let i = 0; i < spikes; i++) {
      pts.push({ x: outerR + Math.cos(rot) * outerR, y: outerR + Math.sin(rot) * outerR });
      rot += step;
      pts.push({ x: outerR + Math.cos(rot) * innerR, y: outerR + Math.sin(rot) * innerR });
      rot += step;
    }
    return pts;
  }

  function alignSelected(dir: "left" | "centerH" | "right" | "top" | "centerV" | "bottom") {
    const c = fabricRef.current;
    const obj = c?.getActiveObject();
    if (!c || !obj) return;
    const W = c.getWidth();
    const H = c.getHeight();
    const w = (obj.width ?? 0) * (obj.scaleX ?? 1);
    const h = (obj.height ?? 0) * (obj.scaleY ?? 1);
    obj.set({ originX: "left", originY: "top" });
    if (dir === "left") obj.set({ left: 0 });
    if (dir === "centerH") obj.set({ left: (W - w) / 2 });
    if (dir === "right") obj.set({ left: W - w });
    if (dir === "top") obj.set({ top: 0 });
    if (dir === "centerV") obj.set({ top: (H - h) / 2 });
    if (dir === "bottom") obj.set({ top: H - h });
    obj.setCoords();
    c.requestRenderAll();
    pushHistory();
    refreshHistoryUI();
    scheduleSave();
  }

  // ============ Camadas ============
  function listLayers() {
    const c = fabricRef.current;
    if (!c) return [];
    return c.getObjects().map((o, i) => ({
      idx: i,
      type: o.type ?? "object",
      isBg: !!(o as any).isBackground,
      visible: o.visible !== false,
      locked: !!o.lockMovementX,
      label:
        (o as any).text?.slice(0, 24) ||
        ({
          rect: "Retângulo",
          circle: "Círculo",
          triangle: "Triângulo",
          line: "Linha",
          polygon: "Estrela",
          image: "Imagem",
          textbox: "Texto",
          "i-text": "Texto",
        } as Record<string, string>)[o.type ?? ""] ||
        "Objeto",
      ref: o,
    }));
  }
  function moveLayer(obj: fabric.Object, dir: "up" | "down") {
    const c = fabricRef.current;
    if (!c) return;
    if (dir === "up") c.bringForward(obj);
    else c.sendBackwards(obj);
    c.requestRenderAll();
    pushHistory();
    refreshHistoryUI();
    scheduleSave();
    refreshSel();
  }
  function toggleLayerVisible(obj: fabric.Object) {
    obj.visible = !(obj.visible !== false);
    fabricRef.current?.requestRenderAll();
    scheduleSave();
    refreshSel();
  }
  function toggleLayerLock(obj: fabric.Object) {
    const locked = !obj.lockMovementX;
    obj.set({
      lockMovementX: locked,
      lockMovementY: locked,
      lockScalingX: locked,
      lockScalingY: locked,
      lockRotation: locked,
      selectable: !locked,
      evented: !locked,
    });
    fabricRef.current?.requestRenderAll();
    scheduleSave();
    refreshSel();
  }

  // ============ Quick Actions IA ============
  const [quickLoading, setQuickLoading] = useState<null | "regen" | "layout" | "color" | "bg">(null);
  async function quickRegenerateSlide() {
    if (!postId) return;
    setQuickLoading("regen");
    try {
      const { data, error } = await supabase.functions.invoke("regenerate-slide", {
        body: { postId, slideIndex: activeSlide },
      });
      // supabase-js trata respostas não-2xx como erro: extrai body se possível
      if (error) {
        const ctx = (error as any)?.context;
        let body: any = null;
        try {
          body = await ctx?.json?.();
        } catch {
          /* noop */
        }
        if (body?.error === "INSUFFICIENT_CREDITS") {
          toast.error(
            `Créditos insuficientes. Necessário: ${body.required ?? 15}, disponível: ${body.available ?? 0}.`,
          );
          return;
        }
        throw new Error(body?.error || error.message || "Falha ao regenerar");
      }
      if ((data as any)?.error === "INSUFFICIENT_CREDITS") {
        toast.error(
          `Créditos insuficientes. Necessário: ${(data as any).required ?? 15}, disponível: ${(data as any).available ?? 0}.`,
        );
        return;
      }
      if ((data as any)?.imageUrl) {
        // Atualiza imagem local e força recarregar canvas (cache-bust já no URL)
        setGeneratedImages((prev) => {
          const next = [...prev];
          next[activeSlide] = (data as any).imageUrl;
          return next;
        });
        await refetchPost();
        invalidateCredits();
        awardXp(5, "slide_regenerated", { postId, slideIndex: activeSlide }, { silent: true });
        toast.success("Slide regenerado!");
      } else {
        throw new Error((data as any)?.error || "Falha ao regenerar");
      }
    } catch (e: any) {
      const msg = e?.message || "Erro";
      if (msg.includes("INSUFFICIENT_CREDITS")) toast.error("Créditos insuficientes (15 por slide).");
      else toast.error(msg);
    } finally {
      setQuickLoading(null);
    }
  }
  async function quickImproveLayout() {
    const c = fabricRef.current;
    if (!c || !postId) return;
    setQuickLoading("layout");
    try {
      const currentFabricJSON = c.toJSON(["isBackground"]);
      const { data, error } = await supabase.functions.invoke("improve-layout", {
        body: { postId, slideIndex: activeSlide, currentFabricJSON },
      });
      if (error) throw error;
      const newJSON = (data as any)?.fabricJSON;
      if (!newJSON) throw new Error((data as any)?.error || "Sem resposta");
      historyRef.current.suspended = true;
      c.loadFromJSON(newJSON, () => {
        c.renderAll();
        historyRef.current.suspended = false;
        pushHistory();
        refreshHistoryUI();
        scheduleSave();
      });
      invalidateCredits();
      toast.success((data as any)?.summary || "Layout melhorado!");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao melhorar layout");
    } finally {
      setQuickLoading(null);
    }
  }
  function quickChangeBgColor(hex: string) {
    const c = fabricRef.current;
    if (!c) return;
    // Remove background image flat se existir e injeta retângulo de fundo
    const objs = c.getObjects();
    const bg = objs.find((o) => (o as any).isBackground);
    if (bg) {
      if (bg.type === "rect") {
        (bg as fabric.Rect).set({ fill: hex });
      } else {
        c.remove(bg);
        const r = new fabric.Rect({
          left: 0,
          top: 0,
          width: c.getWidth(),
          height: c.getHeight(),
          fill: hex,
          selectable: false,
          evented: false,
        });
        (r as any).isBackground = true;
        c.add(r);
        c.sendToBack(r);
      }
    } else {
      const r = new fabric.Rect({
        left: 0,
        top: 0,
        width: c.getWidth(),
        height: c.getHeight(),
        fill: hex,
        selectable: false,
        evented: false,
      });
      (r as any).isBackground = true;
      c.add(r);
      c.sendToBack(r);
    }
    c.requestRenderAll();
    pushHistory();
    refreshHistoryUI();
    scheduleSave();
  }

  function copySelected() {
    const c = fabricRef.current;
    const obj = c?.getActiveObject();
    if (!c || !obj) return;
    obj.clone((cloned: fabric.Object) => {
      cloned.set({ left: (obj.left ?? 0) + 16, top: (obj.top ?? 0) + 16 });
      c.add(cloned);
      c.setActiveObject(cloned);
      c.requestRenderAll();
    });
  }
  function deleteSelected() {
    const c = fabricRef.current;
    if (!c) return;
    c.getActiveObjects().forEach((o) => {
      if (!(o as any).isBackground) c.remove(o);
    });
    c.discardActiveObject();
    c.requestRenderAll();
  }
  function exportPng() {
    const c = fabricRef.current;
    if (!c) return;
    const url = c.toDataURL({ format: "png", multiplier: 2 });
    const a = document.createElement("a");
    a.href = url;
    a.download = `${post?.titulo || "slide"}-${activeSlide + 1}.png`;
    a.click();
    awardXp(30, "post_exported", { postId, slideIndex: activeSlide }, { dedupeKey: `${postId}:${activeSlide}` });
  }
  async function finalizar() {
    if (!postId) return;
    const { error } = await supabase
      .from("sg_posts")
      .update({ status: "draft", updated_at: new Date().toISOString() })
      .eq("id", postId);
    if (error) toast.error(error.message);
    else toast.success("Post finalizado e movido para Rascunhos!");
  }

  function applyCanvasCommand(cmd: any) {
    const c = fabricRef.current;
    if (!c || !cmd?.action) return;
    if (cmd.action === "change_background" && cmd.params?.color) {
      c.setBackgroundColor(cmd.params.color, () => c.renderAll());
    } else if (cmd.action === "add_text" && cmd.params?.text) {
      c.add(
        new fabric.Textbox(cmd.params.text, {
          left: 80,
          top: 80,
          fontSize: cmd.params.size ?? 32,
          fill: "#fff",
          fontFamily: "Inter",
          fontWeight: "600",
        }),
      );
    } else if (cmd.action === "update_text" && cmd.params?.newText) {
      const target = c.getObjects().find((o) => o.type === "textbox") as fabric.Textbox | undefined;
      if (target) {
        target.set("text", cmd.params.newText);
        c.renderAll();
      }
    }
  }

  async function sendChat() {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChat((c) => [...c, { role: "user", content: text }]);
    setChatInput("");
    setChatLoading(true);
    try {
      // Extrai copy do slide ativo (se tiver textbox)
      const c = fabricRef.current;
      const slideCopy = c
        ?.getObjects()
        .filter((o) => o.type === "textbox" || o.type === "i-text")
        .map((o: any) => o.text)
        .filter(Boolean)
        .join(" | ");

      const { data, error } = await supabase.functions.invoke("editor-chat", {
        body: {
          message: text,
          postId,
          currentSlideIndex: activeSlide,
          enhancedPrompt: post?.enhanced_prompt ?? null,
          slideCopy: slideCopy || null,
          brandContext: activeBrand
            ? {
                name: (activeBrand as any).nome,
                tone: (activeBrand as any).tom_voz,
                colors: {
                  primaria: (activeBrand as any).color_primary,
                  secundaria: (activeBrand as any).color_secondary,
                },
              }
            : null,
        },
      });
      if (error) throw error;
      if (data?.type === "command" && data.command) {
        applyCanvasCommand(data.command);
      }
      const reply = data?.response || (data?.type === "command" ? "Aplicado no canvas." : "Sem resposta.");
      setChat((c) => [...c, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setChat((c) => [...c, { role: "assistant", content: `❌ ${e?.message || "Erro ao consultar a IA"}` }]);
    } finally {
      setChatLoading(false);
    }
  }

  async function retryGeneration() {
    if (!postId) return;
    toast.info("Reabrindo wizard de criação...");
    navigate("/criacao");
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/biblioteca")}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Biblioteca
          </Button>
          <div className="h-5 w-px bg-border" />
          <div>
            <div className="text-sm font-semibold">{post?.titulo ?? "Sem título"}</div>
            <div className="text-xs text-muted-foreground">
              {format?.name} · {format?.width}×{format?.height}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} title="Desfazer (Ctrl+Z)">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} title="Refazer">
            <Redo2 className="h-4 w-4" />
          </Button>
          <div className="mx-1 h-5 w-px bg-border" />
          <Button variant="ghost" size="icon" onClick={copySelected} title="Duplicar">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={deleteSelected} title="Excluir">
            <Trash2 className="h-4 w-4" />
          </Button>
          <div className="mx-1 h-5 w-px bg-border" />
          {([
            { d: "left", icon: AlignStartHorizontal, t: "Alinhar à esquerda" },
            { d: "centerH", icon: AlignCenterHorizontal, t: "Centralizar horizontal" },
            { d: "right", icon: AlignEndHorizontal, t: "Alinhar à direita" },
            { d: "top", icon: AlignStartVertical, t: "Alinhar ao topo" },
            { d: "centerV", icon: AlignCenterVertical, t: "Centralizar vertical" },
            { d: "bottom", icon: AlignEndVertical, t: "Alinhar à base" },
          ] as const).map((a) => (
            <Button
              key={a.d}
              variant="ghost"
              size="icon"
              onClick={() => alignSelected(a.d)}
              disabled={!selectedObj || (selectedObj as any)?.isBackground}
              title={a.t}
            >
              <a.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {saveState === "saving" && (
              <>
                <CloudUpload className="h-3.5 w-3.5 animate-pulse" /> Salvando...
              </>
            )}
            {saveState === "saved" && (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Salvo
              </>
            )}
          </span>
          <Button variant="outline" size="sm" onClick={exportPng}>
            <Download className="mr-1 h-4 w-4" /> PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate("/calendario", {
                state: {
                  openCreate: true,
                  title: post?.titulo ?? "",
                  format: (post as any)?.formato ?? (post as any)?.formato_id ?? null,
                  cover_url: (post as any)?.cover_url ?? null,
                  post_id: postId,
                  scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                },
              })
            }
          >
            <CalendarPlus className="mr-1 h-4 w-4" /> Agendar
          </Button>
          <Button size="sm" onClick={finalizar} className="bg-gradient-primary shadow-glow">
            <Check className="mr-1 h-4 w-4" /> Finalizar
          </Button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-[56px_280px_1fr_360px] overflow-hidden">
        {/* Left rail (tab switch) */}
        <div className="flex flex-col items-center gap-1 border-r border-border/60 bg-sidebar p-2">
          {([
            { id: "texto", icon: Type, label: "Texto" },
            { id: "elementos", icon: Square, label: "Elementos" },
            { id: "camadas", icon: Layers, label: "Camadas" },
          ] as const).map((t) => (
            <Button
              key={t.id}
              variant={leftTab === t.id ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setLeftTab(t.id)}
              title={t.label}
              className="h-11 w-11 rounded-lg"
            >
              <t.icon className="h-4 w-4" />
            </Button>
          ))}
          <Button
            variant={leftTab === "imagens" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setLeftTab("imagens")}
            title="Imagens"
            className="h-11 w-11 rounded-lg"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Left panel content */}
        <div className="flex flex-col gap-3 overflow-y-auto border-r border-border/60 bg-sidebar/40 p-4">
          {leftTab === "texto" && (
            <TextPanel
              addText={addText}
              selected={selectedObj}
              updateSelected={updateSelected}
            />
          )}
          {leftTab === "elementos" && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Formas
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { k: "rect", icon: Square, label: "Retângulo" },
                  { k: "circle", icon: CircleIcon, label: "Círculo" },
                  { k: "triangle", icon: TriangleIcon, label: "Triângulo" },
                  { k: "line", icon: Minus, label: "Linha" },
                  { k: "star", icon: Star, label: "Estrela" },
                ] as const).map((s) => (
                  <Button
                    key={s.k}
                    variant="outline"
                    className="h-20 flex-col gap-1.5"
                    onClick={() => addShape(s.k)}
                  >
                    <s.icon className="h-5 w-5" />
                    <span className="text-[11px]">{s.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
          {leftTab === "imagens" && <UserImagesPanel onPick={addImageFromUrl} />}
          {leftTab === "camadas" && (
            <LayersPanel
              layers={listLayers()}
              onSelect={(o) => {
                fabricRef.current?.setActiveObject(o);
                fabricRef.current?.requestRenderAll();
                setSelectedObj(o);
                refreshSel();
              }}
              activeObj={selectedObj}
              onMove={moveLayer}
              onToggleVisible={toggleLayerVisible}
              onToggleLock={toggleLayerLock}
              onDelete={(o) => {
                const c = fabricRef.current;
                if (!c || (o as any).isBackground) return;
                c.remove(o);
                c.discardActiveObject();
                c.requestRenderAll();
              }}
            />
          )}
        </div>

        {/* Canvas area */}
        <div className="relative flex flex-col bg-gradient-mesh">
          <div ref={containerRef} className="flex flex-1 items-center justify-center overflow-auto p-6">
            <Card className="overflow-hidden p-2 shadow-card">
              <canvas ref={canvasElRef} />
            </Card>
          </div>

          {/* Zoom controls */}
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border/60 bg-background/95 px-1 py-1 shadow-card backdrop-blur">
            <Button
              size="icon"
              variant="ghost"
              className="pointer-events-auto h-7 w-7 rounded-full"
              onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.1).toFixed(2)))}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <button
              className="pointer-events-auto min-w-[48px] text-center text-xs font-semibold"
              onClick={() => setZoom(1)}
              title="Resetar zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <Button
              size="icon"
              variant="ghost"
              className="pointer-events-auto h-7 w-7 rounded-full"
              onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Overlay de geração */}
          {gen && (gen.status === "queued" || gen.status === "running") && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <Card className="w-[320px] p-6 shadow-glow">
                <div className="mb-3 flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div className="text-sm font-semibold">
                    Gerando slide {Math.max(1, gen.currentSlide)} de {gen.totalSlides}...
                  </div>
                </div>
                <Progress value={gen.progress} className="h-2" />
                <p className="mt-2 text-xs text-muted-foreground">{gen.phase ?? "Preparando IA..."}</p>
              </Card>
            </div>
          )}

          {gen?.status === "failed" && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <Card className="w-[340px] p-6 text-center shadow-card">
                <div className="mb-2 text-sm font-semibold text-destructive">Falha na geração</div>
                <p className="mb-4 text-xs text-muted-foreground">{gen.error ?? "Erro desconhecido"}</p>
                <Button onClick={retryGeneration} className="w-full bg-gradient-primary shadow-glow">
                  <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
                </Button>
              </Card>
            </div>
          )}

          {/* Slide thumbnails (carrossel) */}
          {slidesArr.length > 1 && (
            <div className="border-t border-border/60 bg-background/80 p-3 backdrop-blur">
              <div className="flex gap-2 overflow-x-auto">
                {slidesArr.map((_, i) => {
                  const thumb = generatedImages[i];
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveSlide(i)}
                      className={`relative aspect-[4/5] h-16 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                        i === activeSlide ? "border-primary shadow-glow" : "border-border hover:border-primary/40"
                      }`}
                    >
                      {thumb ? (
                        <img src={thumb} alt={`Slide ${i + 1}`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gradient-primary" />
                      )}
                      <span className="absolute bottom-0.5 right-1 text-[10px] font-bold text-white drop-shadow">
                        {i + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right panel: Quick Actions + Properties + AI Chat */}
        <div className="flex flex-col border-l border-border/60 bg-background">
          {/* Quick Actions */}
          <div className="border-b border-border/60 p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Wand2 className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ações rápidas
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={quickRegenerateSlide}
                disabled={quickLoading === "regen"}
                className="h-8 text-xs"
              >
                {quickLoading === "regen" ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1 h-3 w-3" />
                )}
                Refazer slide
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={quickImproveLayout}
                disabled={quickLoading === "layout"}
                className="h-8 text-xs"
              >
                {quickLoading === "layout" ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Sliders className="mr-1 h-3 w-3" />
                )}
                Melhorar layout
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Palette className="mr-1 h-3 w-3" /> Mudar fundo
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3">
                  <Label className="text-xs">Cor de fundo</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="color"
                      defaultValue="#6b46ff"
                      onChange={(e) => quickChangeBgColor(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent p-0.5"
                    />
                    <span className="text-xs text-muted-foreground">
                      Substitui o fundo do slide
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-6 gap-1.5">
                    {[
                      "#6b46ff",
                      "#ec4899",
                      "#0ea5e9",
                      "#10b981",
                      "#f59e0b",
                      "#000000",
                      "#ffffff",
                      "#f3f4f6",
                      "#1f2937",
                      "#fef3c7",
                      "#fce7f3",
                      "#dbeafe",
                    ].map((c) => (
                      <button
                        key={c}
                        onClick={() => quickChangeBgColor(c)}
                        className="h-6 w-6 rounded border border-border/60 transition-transform hover:scale-110"
                        style={{ background: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLeftTab("elementos")}
                className="h-8 text-xs"
              >
                <Square className="mr-1 h-3 w-3" /> Adicionar elemento
              </Button>
            </div>
          </div>

          {/* Properties panel quando objeto selecionado */}
          {selectedObj && !(selectedObj as any).isBackground && (
            <PropertiesPanel obj={selectedObj} updateSelected={updateSelected} />
          )}

          {/* AI Chat */}
          <div className="flex items-center gap-2 border-b border-t border-border/60 px-4 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-primary shadow-md">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div>
              <div className="text-sm font-semibold">Assistente IA</div>
              <div className="text-xs text-muted-foreground">Sempre na sua marca</div>
            </div>
            <Badge className="ml-auto border-0 bg-gradient-soft text-[10px] text-foreground">BETA</Badge>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {chat.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                    m.role === "user" ? "bg-gradient-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendChat();
            }}
            className="border-t border-border/60 p-3"
          >
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={chatLoading ? "IA pensando..." : "Peça à IA..."}
                disabled={chatLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                disabled={chatLoading || !chatInput.trim()}
                className="bg-gradient-primary shadow-glow"
              >
                {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const FONT_FAMILIES = ["Inter", "Poppins", "Playfair Display", "Montserrat"];
const FONT_WEIGHTS = [
  { label: "Regular", value: "400" },
  { label: "Semibold", value: "600" },
  { label: "Bold", value: "700" },
  { label: "Black", value: "900" },
];

function TextPanel({
  addText,
  selected,
  updateSelected,
}: {
  addText: (preset: "title" | "subtitle" | "body" | "custom") => void;
  selected: fabric.Object | null;
  updateSelected: (props: Record<string, any>) => void;
}) {
  const isText =
    !!selected && (selected.type === "textbox" || selected.type === "i-text" || selected.type === "text");
  const t = isText ? (selected as any) : null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Adicionar texto
        </h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start font-bold"
            onClick={() => addText("title")}
          >
            <Heading1 className="mr-2 h-4 w-4" />
            <span className="text-base">Adicionar título</span>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start font-semibold"
            onClick={() => addText("subtitle")}
          >
            <Heading2 className="mr-2 h-4 w-4" />
            <span className="text-sm">Adicionar subtítulo</span>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start font-normal"
            onClick={() => addText("body")}
          >
            <Pilcrow className="mr-2 h-4 w-4" />
            <span className="text-xs">Adicionar corpo</span>
          </Button>
        </div>
      </div>

      {isText && t && (
        <div className="space-y-3 rounded-lg border border-border/60 bg-background/40 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Formatar texto
          </h3>

          <div className="space-y-1.5">
            <Label className="text-xs">Fonte</Label>
            <Select
              value={t.fontFamily ?? "Inter"}
              onValueChange={(v) => updateSelected({ fontFamily: v })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map((f) => (
                  <SelectItem key={f} value={f} style={{ fontFamily: f }}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Tamanho</Label>
              <span className="text-xs text-muted-foreground">{Math.round(t.fontSize ?? 32)}px</span>
            </div>
            <Slider
              min={12}
              max={120}
              step={1}
              value={[t.fontSize ?? 32]}
              onValueChange={([v]) => updateSelected({ fontSize: v })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Peso</Label>
            <Select
              value={String(t.fontWeight ?? "400")}
              onValueChange={(v) => updateSelected({ fontWeight: v })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_WEIGHTS.map((w) => (
                  <SelectItem key={w.value} value={w.value}>
                    {w.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Cor</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={typeof t.fill === "string" ? t.fill : "#ffffff"}
                onChange={(e) => updateSelected({ fill: e.target.value })}
                className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
              />
              <Input
                value={typeof t.fill === "string" ? t.fill : "#ffffff"}
                onChange={(e) => updateSelected({ fill: e.target.value })}
                className="h-8 flex-1 font-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Alinhamento</Label>
            <div className="flex gap-1">
              {([
                { v: "left", icon: AlignLeft },
                { v: "center", icon: AlignCenter },
                { v: "right", icon: AlignRight },
              ] as const).map((a) => (
                <Button
                  key={a.v}
                  variant={t.textAlign === a.v ? "secondary" : "outline"}
                  size="icon"
                  className="h-8 flex-1"
                  onClick={() => updateSelected({ textAlign: a.v })}
                >
                  <a.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Opacidade</Label>
              <span className="text-xs text-muted-foreground">
                {Math.round((t.opacity ?? 1) * 100)}%
              </span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={[t.opacity ?? 1]}
              onValueChange={([v]) => updateSelected({ opacity: v })}
            />
          </div>
        </div>
      )}

      {!isText && (
        <p className="rounded-md border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
          Selecione um texto no canvas para editar fonte, tamanho, peso, cor, alinhamento e opacidade.
        </p>
      )}
    </div>
  );
}

function LayersPanel({
  layers,
  activeObj,
  onSelect,
  onMove,
  onToggleVisible,
  onToggleLock,
  onDelete,
}: {
  layers: ReturnType<any>;
  activeObj: fabric.Object | null;
  onSelect: (o: fabric.Object) => void;
  onMove: (o: fabric.Object, dir: "up" | "down") => void;
  onToggleVisible: (o: fabric.Object) => void;
  onToggleLock: (o: fabric.Object) => void;
  onDelete: (o: fabric.Object) => void;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Camadas
      </h3>
      {layers.length === 0 && (
        <p className="text-xs text-muted-foreground">Sem objetos no canvas.</p>
      )}
      <div className="space-y-1">
        {[...layers].reverse().map((l: any) => {
          const isActive = activeObj === l.ref;
          return (
            <div
              key={l.idx}
              className={`flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs transition-colors ${
                isActive ? "border-primary bg-primary/10" : "border-border/60 hover:bg-accent/50"
              }`}
            >
              <button
                className="flex-1 truncate text-left"
                onClick={() => onSelect(l.ref)}
                disabled={l.isBg}
              >
                <span className="font-medium">{l.label}</span>
                {l.isBg && <span className="ml-1 text-[10px] text-muted-foreground">(fundo)</span>}
              </button>
              {!l.isBg && (
                <>
                  <button
                    className="rounded p-1 hover:bg-accent"
                    onClick={() => onMove(l.ref, "up")}
                    title="Trazer à frente"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    className="rounded p-1 hover:bg-accent"
                    onClick={() => onMove(l.ref, "down")}
                    title="Enviar para trás"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <button
                    className="rounded p-1 hover:bg-accent"
                    onClick={() => onToggleVisible(l.ref)}
                    title={l.visible ? "Ocultar" : "Mostrar"}
                  >
                    {l.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </button>
                  <button
                    className="rounded p-1 hover:bg-accent"
                    onClick={() => onToggleLock(l.ref)}
                    title={l.locked ? "Destravar" : "Travar"}
                  >
                    {l.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  </button>
                  <button
                    className="rounded p-1 text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(l.ref)}
                    title="Excluir"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PropertiesPanel({
  obj,
  updateSelected,
}: {
  obj: fabric.Object;
  updateSelected: (props: Record<string, any>) => void;
}) {
  const o = obj as any;
  const w = Math.round((o.width ?? 0) * (o.scaleX ?? 1));
  const h = Math.round((o.height ?? 0) * (o.scaleY ?? 1));
  return (
    <div className="space-y-3 border-b border-border/60 p-3">
      <div className="flex items-center gap-1.5">
        <Sliders className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Propriedades
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px]">X</Label>
          <Input
            type="number"
            value={Math.round(o.left ?? 0)}
            onChange={(e) => updateSelected({ left: Number(e.target.value) })}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px]">Y</Label>
          <Input
            type="number"
            value={Math.round(o.top ?? 0)}
            onChange={(e) => updateSelected({ top: Number(e.target.value) })}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px]">L</Label>
          <Input
            type="number"
            value={w}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (o.width) updateSelected({ scaleX: v / o.width });
            }}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px]">A</Label>
          <Input
            type="number"
            value={h}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (o.height) updateSelected({ scaleY: v / o.height });
            }}
            className="h-7 text-xs"
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-[10px]">Rotação</Label>
          <span className="text-[10px] text-muted-foreground">{Math.round(o.angle ?? 0)}°</span>
        </div>
        <Slider
          min={0}
          max={360}
          step={1}
          value={[o.angle ?? 0]}
          onValueChange={([v]) => updateSelected({ angle: v })}
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-[10px]">Opacidade</Label>
          <span className="text-[10px] text-muted-foreground">
            {Math.round((o.opacity ?? 1) * 100)}%
          </span>
        </div>
        <Slider
          min={0}
          max={1}
          step={0.05}
          value={[o.opacity ?? 1]}
          onValueChange={([v]) => updateSelected({ opacity: v })}
        />
      </div>
      {typeof o.fill === "string" && (
        <div>
          <Label className="text-[10px]">Cor</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={o.fill}
              onChange={(e) => updateSelected({ fill: e.target.value })}
              className="h-7 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
            />
            <Input
              value={o.fill}
              onChange={(e) => updateSelected({ fill: e.target.value })}
              className="h-7 flex-1 font-mono text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}
