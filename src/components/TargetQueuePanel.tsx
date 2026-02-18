import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Copy,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Loader2,
  Braces,
  FileText,
  FileSpreadsheet,
  Search,
  SlidersHorizontal,
  Clock,
  CheckCircle2,
  XCircle,
  SkipForward,
  Syringe,
  X,
  Star,
  CalendarDays,
  AtSign,
  Database,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ────────── Filter types ────────── */

export interface QueueFilters {
  statuses: string[];
  sources: string[];
  sourceContains: string;
  usernameContains: string;
  usernameNotContains: string;
  createdFrom: string;
  createdTo: string;
  processedFrom: string;
  processedTo: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  priorities: number[];
}

export const DEFAULT_QUEUE_FILTERS: QueueFilters = {
  statuses: [],
  sources: [],
  sourceContains: "",
  usernameContains: "",
  usernameNotContains: "",
  createdFrom: "",
  createdTo: "",
  processedFrom: "",
  processedTo: "",
  sortBy: "created_at",
  sortOrder: "desc",
  priorities: [],
};

export function getActiveFilterCount(filters: QueueFilters): number {
  let count = 0;
  if (filters.statuses.length > 0) count++;
  if (filters.sources.length > 0) count++;
  if (filters.sourceContains.trim()) count++;
  if (filters.usernameContains.trim()) count++;
  if (filters.usernameNotContains.trim()) count++;
  if (filters.createdFrom) count++;
  if (filters.createdTo) count++;
  if (filters.processedFrom) count++;
  if (filters.processedTo) count++;
  if (filters.priorities && filters.priorities.length > 0) count++;
  if (filters.sortBy !== "created_at" || filters.sortOrder !== "desc") count++;
  return count;
}

/* ────────── Constants ────────── */

const ALL_STATUSES = [
  { value: "pending", label: "Pendente", color: "text-amber-400", bg: "bg-amber-400/10", ring: "ring-amber-400/25", icon: Clock },
  { value: "injected", label: "Injetado", color: "text-blue-400", bg: "bg-blue-400/10", ring: "ring-blue-400/25", icon: Syringe },
  { value: "processing", label: "Processando", color: "text-cyan-400", bg: "bg-cyan-400/10", ring: "ring-cyan-400/25", icon: Loader2 },
  { value: "processed", label: "Processado", color: "text-emerald-400", bg: "bg-emerald-400/10", ring: "ring-emerald-400/25", icon: CheckCircle2 },
  { value: "failed", label: "Falhou", color: "text-red-400", bg: "bg-red-400/10", ring: "ring-red-400/25", icon: XCircle },
  { value: "skipped", label: "Pulado", color: "text-zinc-400", bg: "bg-zinc-400/10", ring: "ring-zinc-400/25", icon: SkipForward },
];

const PRIORITY_OPTIONS = [
  { value: 2, label: "Urgente", color: "text-red-400", bg: "bg-red-400/10" },
  { value: 1, label: "Alta", color: "text-amber-400", bg: "bg-amber-400/10" },
  { value: 0, label: "Normal", color: "text-zinc-400", bg: "bg-zinc-400/10" },
  { value: -1, label: "Baixa", color: "text-zinc-500", bg: "bg-zinc-500/10" },
];

const SORT_OPTIONS = [
  { value: "created_at", label: "Data criação", icon: CalendarDays },
  { value: "username", label: "Username", icon: AtSign },
  { value: "source", label: "Fonte", icon: Database },
  { value: "status", label: "Status", icon: CheckCircle2 },
  { value: "processed_at", label: "Data processamento", icon: CalendarDays },
  { value: "priority", label: "Prioridade", icon: Star },
];

const CLEAR_LABELS: Record<string, string> = {
  all: "Todos",
  pending: "Pendentes",
  processed: "Processados",
  failed: "Falhos",
  skipped: "Pulados",
  duplicates: "Duplicatas",
};

/* ────────── Props ────────── */

interface Props {
  activeAccountId: string | null;
  totalCount: number;
  stats: { pending: number; total: number; failed: number };
  statusCounts?: Record<string, number>;
  filters: QueueFilters;
  onFiltersChange: (filters: QueueFilters) => void;
  availableSources: string[];
  onRefresh: () => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
}

/* ────────── Component ────────── */

export default function TargetQueuePanel({
  activeAccountId,
  totalCount,
  stats,
  statusCounts,
  filters,
  onFiltersChange,
  availableSources,
  onRefresh,
  searchTerm,
  onSearchChange,
}: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearStatus, setClearStatus] = useState("all");
  const [clearing, setClearing] = useState(false);
  const [removingDups, setRemovingDups] = useState(false);
  const [dupCount, setDupCount] = useState<number | null>(null);

  const activeCount = getActiveFilterCount(filters);

  // Instant filter update helper
  const updateFilter = useCallback(<K extends keyof QueueFilters>(key: K, value: QueueFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  }, [filters, onFiltersChange]);

  const toggleStatus = useCallback((status: string) => {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ ...filters, statuses: next });
  }, [filters, onFiltersChange]);

  const toggleSource = useCallback((source: string) => {
    const next = filters.sources.includes(source)
      ? filters.sources.filter((s) => s !== source)
      : [...filters.sources, source];
    onFiltersChange({ ...filters, sources: next });
  }, [filters, onFiltersChange]);

  const togglePriority = useCallback((priority: number) => {
    const current = filters.priorities || [];
    const next = current.includes(priority)
      ? current.filter((p) => p !== priority)
      : [...current, priority];
    onFiltersChange({ ...filters, priorities: next });
  }, [filters, onFiltersChange]);

  const handleReset = useCallback(() => {
    onFiltersChange({ ...DEFAULT_QUEUE_FILTERS });
  }, [onFiltersChange]);

  // Quick status filter (single status or all)
  const handleQuickStatus = useCallback((status: string) => {
    if (status === "all") {
      onFiltersChange({ ...filters, statuses: [] });
    } else if (filters.statuses.length === 1 && filters.statuses[0] === status) {
      onFiltersChange({ ...filters, statuses: [] });
    } else {
      onFiltersChange({ ...filters, statuses: [status] });
    }
  }, [filters, onFiltersChange]);

  // Debounced text filter updates
  const [localUsernameContains, setLocalUsernameContains] = useState(filters.usernameContains);
  const [localUsernameNotContains, setLocalUsernameNotContains] = useState(filters.usernameNotContains);
  const [localSourceContains, setLocalSourceContains] = useState(filters.sourceContains);

  useEffect(() => {
    const t = setTimeout(() => updateFilter("usernameContains", localUsernameContains), 400);
    return () => clearTimeout(t);
  }, [localUsernameContains]);

  useEffect(() => {
    const t = setTimeout(() => updateFilter("usernameNotContains", localUsernameNotContains), 400);
    return () => clearTimeout(t);
  }, [localUsernameNotContains]);

  useEffect(() => {
    const t = setTimeout(() => updateFilter("sourceContains", localSourceContains), 400);
    return () => clearTimeout(t);
  }, [localSourceContains]);

  // Sync local state when filters change externally (e.g. reset)
  useEffect(() => { setLocalUsernameContains(filters.usernameContains); }, [filters.usernameContains]);
  useEffect(() => { setLocalUsernameNotContains(filters.usernameNotContains); }, [filters.usernameNotContains]);
  useEffect(() => { setLocalSourceContains(filters.sourceContains); }, [filters.sourceContains]);

  // Determine quick filter state
  const quickFilter = filters.statuses.length === 0 ? "all" : filters.statuses.length === 1 ? filters.statuses[0] : "multi";

  /* ── Export ── */
  const doExport = async (format: "csv" | "json" | "txt") => {
    if (!activeAccountId) return;
    setExporting(true);
    try {
      let query = supabase
        .from("target_queue")
        .select("username, source, status, priority, created_at, processed_at, details")
        .eq("ig_account_id", activeAccountId)
        .order("created_at", { ascending: false })
        .limit(50000);

      if (filters.statuses.length > 0) query = query.in("status", filters.statuses);
      if (filters.usernameContains.trim()) query = query.ilike("username", `%${filters.usernameContains.trim()}%`);

      const { data } = await query;
      if (!data?.length) { toast.error("Nada para exportar"); setExporting(false); return; }

      let blob: Blob;
      let ext: string;

      if (format === "json") {
        blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        ext = "json";
      } else if (format === "txt") {
        blob = new Blob([data.map((r) => r.username).join("\n")], { type: "text/plain" });
        ext = "txt";
      } else {
        const header = "username,source,status,priority,created_at,processed_at\n";
        const rows = data.map((r) => `${r.username},${r.source || ""},${r.status},${r.priority ?? 0},${r.created_at || ""},${r.processed_at || ""}`).join("\n");
        blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
        ext = "csv";
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `targets-${new Date().toISOString().split("T")[0]}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${data.length} targets exportados como .${ext}!`);
    } catch (e: any) {
      toast.error("Erro ao exportar", { description: e.message });
    } finally {
      setExporting(false);
    }
  };

  /* ── Clear queue ── */
  const handleClear = async () => {
    if (!activeAccountId) return;
    setClearing(true);
    try {
      if (clearStatus === "duplicates") {
        const { data, error } = await supabase.rpc("remove_duplicate_targets", { p_ig_account_id: activeAccountId } as any);
        if (error) throw error;
        toast.success(`${(data as number) ?? 0} duplicata(s) removida(s)!`);
      } else {
        const { data, error } = await supabase.rpc("clear_target_queue", { p_ig_account_id: activeAccountId, p_status: clearStatus } as any);
        if (error) throw error;
        toast.success(`${data as number} target(s) removido(s)!`);
      }
      onRefresh();
    } catch (e: any) {
      toast.error("Erro ao limpar fila", { description: e.message });
    } finally {
      setClearing(false);
      setClearDialogOpen(false);
    }
  };

  /* ── Detect duplicates ── */
  const detectDuplicates = async () => {
    if (!activeAccountId) return;
    setRemovingDups(true);
    try {
      const { data, error } = await supabase.from("target_queue").select("username").eq("ig_account_id", activeAccountId);
      if (error) throw error;
      const counts = new Map<string, number>();
      (data ?? []).forEach((r) => { const u = r.username.toLowerCase(); counts.set(u, (counts.get(u) || 0) + 1); });
      let dups = 0;
      counts.forEach((c) => { if (c > 1) dups += c - 1; });
      setDupCount(dups);
      if (dups === 0) toast.info("Nenhuma duplicata encontrada!");
    } catch {
      toast.error("Erro ao detectar duplicatas");
    } finally {
      setRemovingDups(false);
    }
  };

  const getPercent = (count: number) => totalCount === 0 ? "0.0" : ((count / totalCount) * 100).toFixed(1);

  const pendingCount = statusCounts?.pending ?? stats.pending;
  const processedCount = statusCounts?.processed ?? 0;
  const failedCount = statusCounts?.failed ?? stats.failed;
  const skippedCount = statusCounts?.skipped ?? 0;
  const injectedCount = statusCounts?.injected ?? 0;

  // Build active filter pills
  const activeFilterPills: { key: string; label: string; color: string; onRemove: () => void }[] = [];
  if (filters.statuses.length > 0 && filters.statuses.length < 6) {
    filters.statuses.forEach((s) => {
      const meta = ALL_STATUSES.find((a) => a.value === s);
      if (meta) activeFilterPills.push({
        key: `status-${s}`, label: meta.label, color: meta.color,
        onRemove: () => toggleStatus(s),
      });
    });
  }
  if (filters.sources.length > 0) {
    filters.sources.forEach((s) => activeFilterPills.push({
      key: `source-${s}`, label: `Fonte: ${s}`, color: "text-primary",
      onRemove: () => toggleSource(s),
    }));
  }
  if (filters.usernameContains.trim()) activeFilterPills.push({
    key: "uc", label: `Username: "${filters.usernameContains}"`, color: "text-primary",
    onRemove: () => { setLocalUsernameContains(""); updateFilter("usernameContains", ""); },
  });
  if (filters.usernameNotContains.trim()) activeFilterPills.push({
    key: "unc", label: `Excluir: "${filters.usernameNotContains}"`, color: "text-red-400",
    onRemove: () => { setLocalUsernameNotContains(""); updateFilter("usernameNotContains", ""); },
  });
  if (filters.createdFrom) activeFilterPills.push({
    key: "cf", label: `Desde: ${filters.createdFrom}`, color: "text-primary",
    onRemove: () => updateFilter("createdFrom", ""),
  });
  if (filters.createdTo) activeFilterPills.push({
    key: "ct", label: `Até: ${filters.createdTo}`, color: "text-primary",
    onRemove: () => updateFilter("createdTo", ""),
  });
  if (filters.priorities && filters.priorities.length > 0) {
    filters.priorities.forEach((p) => {
      const meta = PRIORITY_OPTIONS.find((a) => a.value === p);
      if (meta) activeFilterPills.push({
        key: `prio-${p}`, label: `Prioridade: ${meta.label}`, color: meta.color,
        onRemove: () => togglePriority(p),
      });
    });
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
      {/* ═══ Header: Counter ═══ */}
      <div className="p-4 pb-2">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-black tracking-tight tabular-nums text-foreground">
            {totalCount.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground font-medium">contas na fila</span>
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto text-muted-foreground" onClick={onRefresh} aria-label="Atualizar">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ═══ Stats chips (clickable to filter) ═══ */}
      <div className="px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatsChip icon={<Clock className="h-3 w-3" />} label="pendentes" count={pendingCount}
            percent={getPercent(pendingCount)} color="text-amber-400" bg="bg-amber-400/10"
            active={filters.statuses.includes("pending")} onClick={() => handleQuickStatus("pending")} />
          <StatsChip icon={<CheckCircle2 className="h-3 w-3" />} label="processados" count={processedCount}
            percent={getPercent(processedCount)} color="text-emerald-400" bg="bg-emerald-400/10"
            active={filters.statuses.includes("processed")} onClick={() => handleQuickStatus("processed")} />
          <StatsChip icon={<XCircle className="h-3 w-3" />} label="falhos" count={failedCount}
            percent={getPercent(failedCount)} color="text-red-400" bg="bg-red-400/10"
            active={filters.statuses.includes("failed")} onClick={() => handleQuickStatus("failed")} />
          {skippedCount > 0 && (
            <StatsChip icon={<SkipForward className="h-3 w-3" />} label="pulados" count={skippedCount}
              percent={getPercent(skippedCount)} color="text-zinc-400" bg="bg-zinc-400/10"
              active={filters.statuses.includes("skipped")} onClick={() => handleQuickStatus("skipped")} />
          )}
          {injectedCount > 0 && (
            <StatsChip icon={<Syringe className="h-3 w-3" />} label="injetados" count={injectedCount}
              percent={getPercent(injectedCount)} color="text-blue-400" bg="bg-blue-400/10"
              active={filters.statuses.includes("injected")} onClick={() => handleQuickStatus("injected")} />
          )}
        </div>
      </div>

      {/* ═══ Quick filter tabs ═══ */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <QuickTab label="Todos" active={quickFilter === "all"} onClick={() => handleQuickStatus("all")} count={totalCount} />
          {ALL_STATUSES.map((s) => {
            const count = statusCounts?.[s.value] ?? (s.value === "pending" ? stats.pending : s.value === "failed" ? stats.failed : 0);
            if (count === 0 && s.value !== "pending" && s.value !== "processed" && s.value !== "failed") return null;
            return (
              <QuickTab key={s.value} label={s.label} active={quickFilter === s.value}
                onClick={() => handleQuickStatus(s.value)} count={count} color={s.color} bg={s.bg} />
            );
          })}
        </div>
      </div>

      {/* ═══ Search + Sort ═══ */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar username ou fonte..." className="h-9 pl-8 text-xs bg-secondary/30 border-border/40"
              defaultValue={searchTerm} onChange={(e) => onSearchChange(e.target.value)} />
          </div>

          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs border-border/40 bg-secondary/30 whitespace-nowrap">
                <ArrowUpDown className="h-3 w-3" />
                <span className="hidden sm:inline">{SORT_OPTIONS.find((o) => o.value === filters.sortBy)?.label || "Ordenar"}</span>
                {filters.sortOrder === "asc" ? <ArrowUp className="h-3 w-3 opacity-50" /> : <ArrowDown className="h-3 w-3 opacity-50" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              {SORT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = filters.sortBy === opt.value;
                return (
                  <DropdownMenuItem key={opt.value} className={`text-xs gap-2 ${isActive ? "text-primary" : ""}`}
                    onClick={() => {
                      if (isActive) {
                        updateFilter("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        onFiltersChange({ ...filters, sortBy: opt.value, sortOrder: "desc" });
                      }
                    }}>
                    <Icon className="h-3 w-3" />
                    {opt.label}
                    {isActive && (filters.sortOrder === "asc" ? <ArrowUp className="h-3 w-3 ml-auto" /> : <ArrowDown className="h-3 w-3 ml-auto" />)}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status quick filter dropdown */}
          <Select value={quickFilter === "multi" ? "all" : quickFilter} onValueChange={handleQuickStatus}>
            <SelectTrigger className="h-9 w-[130px] text-xs border-border/40 bg-secondary/30">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todos</SelectItem>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs">
                  <span className={`flex items-center gap-1.5 ${s.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${s.bg.replace('/10', '')}`} />
                    {s.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ═══ Active filter pills ═══ */}
      {activeFilterPills.length > 0 && (
        <div className="px-4 py-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {activeFilterPills.map((pill) => (
              <span key={pill.key}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/50 text-[10px] font-medium ${pill.color} ring-1 ring-inset ring-current/10`}>
                {pill.label}
                <button onClick={pill.onRemove} className="hover:opacity-70 transition-opacity" aria-label="Remover filtro">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            <button onClick={handleReset} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 ml-1">
              <RotateCcw className="h-2.5 w-2.5" />
              Limpar todos
            </button>
          </div>
        </div>
      )}

      {/* ═══ Export + Actions ═══ */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">Exportar</span>
            <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] gap-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-400/10 hover:text-emerald-400"
              onClick={() => doExport("json")} disabled={exporting || totalCount === 0}>
              <Braces className="h-2.5 w-2.5" />JSON
            </Button>
            <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] gap-1 border-blue-500/30 text-blue-400 hover:bg-blue-400/10 hover:text-blue-400"
              onClick={() => doExport("csv")} disabled={exporting || totalCount === 0}>
              <FileSpreadsheet className="h-2.5 w-2.5" />CSV
            </Button>
            <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] gap-1 border-amber-500/30 text-amber-400 hover:bg-amber-400/10 hover:text-amber-400"
              onClick={() => doExport("txt")} disabled={exporting || totalCount === 0}>
              <FileText className="h-2.5 w-2.5" />TXT
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="h-6 gap-1 text-[10px] border-border/40" onClick={detectDuplicates}
              disabled={removingDups || totalCount === 0}>
              {removingDups ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Copy className="h-2.5 w-2.5" />}
              Duplicatas
              {dupCount !== null && dupCount > 0 && (
                <Badge className="bg-amber-400/15 text-amber-400 border-0 text-[8px] h-3.5 px-1">{dupCount}</Badge>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-6 gap-1 text-[10px] border-red-500/20 text-red-400 hover:bg-red-400/10 hover:text-red-400" disabled={totalCount === 0}>
                  <Trash2 className="h-2.5 w-2.5" />Limpar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px]">
                {Object.entries(CLEAR_LABELS).map(([key, label]) => (
                  <DropdownMenuItem key={key} onClick={() => { setClearStatus(key); setClearDialogOpen(true); }} className="text-xs">
                    {key === "duplicates" ? <Copy className="h-3 w-3 mr-2 text-amber-400" /> : <Trash2 className="h-3 w-3 mr-2 text-muted-foreground" />}
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* ═══ Advanced Filters (collapsible, instant apply) ═══ */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between px-4 py-2 border-t border-border/40 hover:bg-secondary/15 transition-colors">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium">Filtros Avançados</span>
              {activeCount > 0 && (
                <Badge className="bg-primary/15 text-primary border-0 text-[10px] h-4 min-w-4 px-1">{activeCount}</Badge>
              )}
            </div>
            {filtersOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 space-y-4 border-t border-border/20">
            {/* Status */}
            <FilterSection title="Status">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {ALL_STATUSES.map((s) => {
                  const Icon = s.icon;
                  const isActive = filters.statuses.includes(s.value);
                  const count = statusCounts?.[s.value] ?? 0;
                  return (
                    <label key={s.value}
                      className={`flex items-center gap-2 py-1.5 px-2.5 rounded-lg cursor-pointer transition-all ${
                        isActive ? `${s.bg} ring-1 ring-inset ${s.ring}` : "hover:bg-secondary/30"
                      }`}>
                      <Checkbox checked={isActive} onCheckedChange={() => toggleStatus(s.value)} className="h-3.5 w-3.5" />
                      <Icon className={`h-3 w-3 ${s.color}`} />
                      <span className={`text-[11px] font-medium flex-1 ${s.color}`}>{s.label}</span>
                      {count > 0 && <span className="text-[9px] tabular-nums text-muted-foreground">{count}</span>}
                    </label>
                  );
                })}
              </div>
            </FilterSection>

            <Separator className="bg-border/30" />

            {/* Priority */}
            <FilterSection title="Prioridade">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {PRIORITY_OPTIONS.map((p) => {
                  const isActive = (filters.priorities || []).includes(p.value);
                  return (
                    <label key={p.value}
                      className={`flex items-center gap-2 py-1.5 px-2.5 rounded-lg cursor-pointer transition-all ${
                        isActive ? `${p.bg} ring-1 ring-inset ring-current/15` : "hover:bg-secondary/30"
                      }`}>
                      <Checkbox checked={isActive} onCheckedChange={() => togglePriority(p.value)} className="h-3.5 w-3.5" />
                      <Star className={`h-3 w-3 ${p.color}`} />
                      <span className={`text-[11px] font-medium ${p.color}`}>{p.label}</span>
                    </label>
                  );
                })}
              </div>
            </FilterSection>

            <Separator className="bg-border/30" />

            {/* Source */}
            <FilterSection title="Fonte">
              {availableSources.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {availableSources.map((src) => {
                    const isActive = filters.sources.includes(src);
                    return (
                      <button key={src} onClick={() => toggleSource(src)}
                        className={`flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[11px] font-medium transition-all ${
                          isActive ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary/20" : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                        }`}>
                        <Database className="h-2.5 w-2.5" />
                        {src}
                        {isActive && <X className="h-2.5 w-2.5 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              )}
              <Input className="h-8 text-xs bg-secondary/20" placeholder="Fonte contém..."
                value={localSourceContains} onChange={(e) => setLocalSourceContains(e.target.value)} />
            </FilterSection>

            <Separator className="bg-border/30" />

            {/* Username */}
            <FilterSection title="Username">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground font-medium">Contém (manter apenas):</label>
                  <Input className="h-8 text-xs bg-secondary/20" placeholder="keyword1, keyword2..."
                    value={localUsernameContains} onChange={(e) => setLocalUsernameContains(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground font-medium">Não contém (remover):</label>
                  <Input className="h-8 text-xs bg-secondary/20" placeholder="bot, spam, shop..."
                    value={localUsernameNotContains} onChange={(e) => setLocalUsernameNotContains(e.target.value)} />
                </div>
              </div>
            </FilterSection>

            <Separator className="bg-border/30" />

            {/* Date filters */}
            <FilterSection title="Data de Criação">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground font-medium">De:</label>
                  <Input type="date" className="h-8 text-xs bg-secondary/20" value={filters.createdFrom}
                    onChange={(e) => updateFilter("createdFrom", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground font-medium">Até:</label>
                  <Input type="date" className="h-8 text-xs bg-secondary/20" value={filters.createdTo}
                    onChange={(e) => updateFilter("createdTo", e.target.value)} />
                </div>
              </div>
            </FilterSection>

            <FilterSection title="Data de Processamento">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground font-medium">De:</label>
                  <Input type="date" className="h-8 text-xs bg-secondary/20" value={filters.processedFrom}
                    onChange={(e) => updateFilter("processedFrom", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground font-medium">Até:</label>
                  <Input type="date" className="h-8 text-xs bg-secondary/20" value={filters.processedTo}
                    onChange={(e) => updateFilter("processedTo", e.target.value)} />
                </div>
              </div>
            </FilterSection>

            {/* Reset */}
            {activeCount > 0 && (
              <div className="flex justify-end pt-1">
                <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground" onClick={handleReset}>
                  <RotateCcw className="h-3 w-3" />
                  Resetar todos os filtros ({activeCount})
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* ═══ Clear dialog ═══ */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {clearStatus === "duplicates" ? "Remover duplicatas" : `Limpar ${CLEAR_LABELS[clearStatus]?.toLowerCase()}`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {clearStatus === "duplicates"
                ? "Isso removerá usernames duplicados da fila, mantendo a entrada mais antiga de cada um."
                : `Tem certeza que deseja remover ${CLEAR_LABELS[clearStatus]?.toLowerCase()} os targets? Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear} disabled={clearing} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {clearing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ────────── Subcomponents ────────── */

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
      {children}
    </div>
  );
}

function StatsChip({ icon, label, count, percent, color, bg, active, onClick }: {
  icon: React.ReactNode; label: string; count: number; percent: string; color: string; bg: string; active?: boolean; onClick?: () => void;
}) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all ${bg} ${
        active ? "ring-2 ring-inset ring-current/30 shadow-sm scale-[1.02]" : "hover:ring-1 hover:ring-inset hover:ring-current/15 opacity-80 hover:opacity-100"
      }`}>
      <span className={color}>{icon}</span>
      <span className={`text-xs font-bold tabular-nums ${color}`}>{count.toLocaleString()}</span>
      <span className={`text-[11px] ${color} opacity-80`}>{label}</span>
      <span className="text-[10px] text-muted-foreground tabular-nums">{percent}%</span>
    </button>
  );
}

function QuickTab({ label, active, onClick, count, color, bg }: {
  label: string; active: boolean; onClick: () => void; count: number; color?: string; bg?: string;
}) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
        active
          ? `${bg || "bg-primary/15"} ${color || "text-primary"} ring-1 ring-inset ring-current/20 shadow-sm`
          : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
      }`}>
      {label}
      {count > 0 && (
        <span className={`text-[10px] tabular-nums font-bold ${active ? "" : "opacity-50"}`}>
          {count > 999 ? `${(count / 1000).toFixed(1)}K` : count}
        </span>
      )}
    </button>
  );
}
