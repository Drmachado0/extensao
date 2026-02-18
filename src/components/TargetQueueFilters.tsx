import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, RotateCcw, SlidersHorizontal } from "lucide-react";

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

const ALL_STATUSES = [
  { value: "pending", label: "Pendente", color: "text-amber-400" },
  { value: "injected", label: "Injetado", color: "text-blue-400" },
  { value: "processing", label: "Processando", color: "text-blue-400" },
  { value: "processed", label: "Processado", color: "text-emerald-400" },
  { value: "failed", label: "Falhou", color: "text-red-400" },
  { value: "skipped", label: "Pulado", color: "text-zinc-400" },
];

const SORT_OPTIONS = [
  { value: "created_at", label: "Data criação" },
  { value: "username", label: "Username" },
  { value: "source", label: "Fonte" },
  { value: "status", label: "Status" },
  { value: "processed_at", label: "Data processamento" },
  { value: "priority", label: "Prioridade" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: QueueFilters;
  onFiltersChange: (filters: QueueFilters) => void;
  availableSources: string[];
}

export default function TargetQueueFilters({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  availableSources,
}: Props) {
  const [draft, setDraft] = useState<QueueFilters>(filters);

  // Sync draft when sheet opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) setDraft(filters);
    onOpenChange(isOpen);
  };

  const toggleStatus = (status: string) => {
    setDraft((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }));
  };

  const toggleSource = (source: string) => {
    setDraft((prev) => ({
      ...prev,
      sources: prev.sources.includes(source)
        ? prev.sources.filter((s) => s !== source)
        : [...prev.sources, source],
    }));
  };

  const handleApply = () => {
    onFiltersChange(draft);
    onOpenChange(false);
  };

  const handleReset = () => {
    const reset = { ...DEFAULT_QUEUE_FILTERS };
    setDraft(reset);
    onFiltersChange(reset);
    onOpenChange(false);
  };

  const activeCount = getActiveFilterCount(draft);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-[340px] sm:w-[380px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-sm">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            Filtros Avançados
            {activeCount > 0 && (
              <Badge className="bg-primary/15 text-primary border-0 text-[10px] h-5 px-1.5">
                {activeCount}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 py-4">
          {/* Status Filter */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              {ALL_STATUSES.map((s) => (
                <label
                  key={s.value}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-secondary/30 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={draft.statuses.includes(s.value)}
                    onCheckedChange={() => toggleStatus(s.value)}
                    className="h-3.5 w-3.5"
                  />
                  <span className={`text-[11px] ${s.color}`}>{s.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Separator className="bg-border/40" />

          {/* Source Filter */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Fonte
            </h4>
            {availableSources.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {availableSources.map((src) => (
                  <label
                    key={src}
                    className="flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-secondary/30 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={draft.sources.includes(src)}
                      onCheckedChange={() => toggleSource(src)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-[11px]">{src}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Fonte contém:</label>
              <Input
                className="h-7 text-[11px]"
                placeholder="scrape, manual..."
                value={draft.sourceContains}
                onChange={(e) => setDraft((p) => ({ ...p, sourceContains: e.target.value }))}
              />
            </div>
          </div>

          <Separator className="bg-border/40" />

          {/* Username Filters */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Username
            </h4>
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Contém:</label>
                <Input
                  className="h-7 text-[11px]"
                  placeholder="keyword..."
                  value={draft.usernameContains}
                  onChange={(e) => setDraft((p) => ({ ...p, usernameContains: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Não contém:</label>
                <Input
                  className="h-7 text-[11px]"
                  placeholder="bot, spam..."
                  value={draft.usernameNotContains}
                  onChange={(e) => setDraft((p) => ({ ...p, usernameNotContains: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Separator className="bg-border/40" />

          {/* Date Filters */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Data de Criação
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">De:</label>
                <Input
                  type="date"
                  className="h-7 text-[11px]"
                  value={draft.createdFrom}
                  onChange={(e) => setDraft((p) => ({ ...p, createdFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Até:</label>
                <Input
                  type="date"
                  className="h-7 text-[11px]"
                  value={draft.createdTo}
                  onChange={(e) => setDraft((p) => ({ ...p, createdTo: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Data de Processamento
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">De:</label>
                <Input
                  type="date"
                  className="h-7 text-[11px]"
                  value={draft.processedFrom}
                  onChange={(e) => setDraft((p) => ({ ...p, processedFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Até:</label>
                <Input
                  type="date"
                  className="h-7 text-[11px]"
                  value={draft.processedTo}
                  onChange={(e) => setDraft((p) => ({ ...p, processedTo: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Separator className="bg-border/40" />

          {/* Sort Options */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ArrowUpDown className="h-3 w-3" />
              Ordenação
            </h4>
            <div className="flex gap-2">
              <Select
                value={draft.sortBy}
                onValueChange={(v) => setDraft((p) => ({ ...p, sortBy: v }))}
              >
                <SelectTrigger className="h-7 text-[11px] flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-[11px]">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[11px] gap-1"
                onClick={() =>
                  setDraft((p) => ({
                    ...p,
                    sortOrder: p.sortOrder === "asc" ? "desc" : "asc",
                  }))
                }
              >
                {draft.sortOrder === "asc" ? "A→Z" : "Z→A"}
              </Button>
            </div>
          </div>
        </div>

        <SheetFooter className="flex gap-2 pt-2">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleReset}>
            <RotateCcw className="h-3 w-3" />
            Resetar
          </Button>
          <Button size="sm" className="flex-1 text-xs" onClick={handleApply}>
            Aplicar Filtros
            {activeCount > 0 && ` (${activeCount})`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

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
  if (filters.sortBy !== "created_at" || filters.sortOrder !== "desc") count++;
  return count;
}
