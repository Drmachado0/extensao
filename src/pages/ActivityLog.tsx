import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveAccount } from "@/hooks/useActiveAccount";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  UserPlus, UserMinus, Heart, MessageSquare, Ban, SkipForward, Eye, AlertTriangle,
  Download, Search, ChevronLeft, ChevronRight, ExternalLink,
} from "lucide-react";
import { format, startOfDay, endOfDay, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// --- Types ---
interface ActionLogRow {
  id: string;
  action_type: string;
  target_username: string | null;
  target_url: string | null;
  status: string;
  executed_at: string;
  details: any;
}

const PAGE_SIZE = 50;

const ACTION_META: Record<string, { icon: React.ElementType; dot: string; iconColor: string; label: string; chipActive: string }> = {
  follow:     { icon: UserPlus,      dot: "bg-emerald-400", iconColor: "text-emerald-400", label: "Follow",   chipActive: "bg-emerald-400/15 text-emerald-400 border-emerald-400/40" },
  unfollow:   { icon: UserMinus,     dot: "bg-red-400",     iconColor: "text-red-400",     label: "Unfollow", chipActive: "bg-red-400/15 text-red-400 border-red-400/40" },
  like:       { icon: Heart,         dot: "bg-pink-400",    iconColor: "text-pink-400",    label: "Like",     chipActive: "bg-pink-400/15 text-pink-400 border-pink-400/40" },
  comment:    { icon: MessageSquare, dot: "bg-primary",     iconColor: "text-primary",     label: "Comment",  chipActive: "bg-primary/15 text-primary border-primary/40" },
  skip:       { icon: SkipForward,   dot: "bg-amber-400",   iconColor: "text-amber-400",   label: "Skip",     chipActive: "bg-amber-400/15 text-amber-400 border-amber-400/40" },
  block:      { icon: Ban,           dot: "bg-red-500",     iconColor: "text-red-500",     label: "Block",    chipActive: "bg-red-500/15 text-red-500 border-red-500/40" },
  watch_reel: { icon: Eye,           dot: "bg-muted-foreground", iconColor: "text-muted-foreground", label: "Watch Reel", chipActive: "bg-secondary text-foreground border-border" },
  error:      { icon: AlertTriangle, dot: "bg-red-700",     iconColor: "text-red-400",     label: "Erro",     chipActive: "bg-red-700/15 text-red-400 border-red-700/40" },
  rate_limit: { icon: AlertTriangle, dot: "bg-orange-500",  iconColor: "text-orange-400",  label: "Rate Limit", chipActive: "bg-orange-500/15 text-orange-400 border-orange-500/40" },
};

const CHIP_TYPES = ["follow", "unfollow", "like", "comment", "skip", "block"];

const ActivityLog = () => {
  const { user } = useAuth();
  const { activeAccountId } = useActiveAccount();

  // Filters
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const searchDebounced = useDebounce(search, 400);

  // Data
  const [logs, setLogs] = useState<ActionLogRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [counters, setCounters] = useState<Record<string, number>>({});
  const [page, setPage] = useState(0);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const toggleType = (type: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const fetchLogs = useCallback(async () => {
    if (!user || !activeAccountId) return;

    let query = supabase
      .from("action_log")
      .select("*", { count: "exact" })
      .eq("ig_account_id", activeAccountId)
      .order("executed_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (activeTypes.size === 1) {
      query = query.eq("action_type", Array.from(activeTypes)[0]);
    } else if (activeTypes.size > 1) {
      query = query.in("action_type", Array.from(activeTypes));
    }
    if (searchDebounced) query = query.ilike("target_username", `%${searchDebounced}%`);
    if (dateFrom) query = query.gte("executed_at", startOfDay(new Date(dateFrom)).toISOString());
    if (dateTo) query = query.lte("executed_at", endOfDay(new Date(dateTo)).toISOString());

    const { data, count } = await query;
    setLogs(data ?? []);
    setTotalCount(count ?? 0);
    setLoading(false);
  }, [user, activeAccountId, activeTypes, searchDebounced, dateFrom, dateTo, page]);

  const fetchCounters = useCallback(async () => {
    if (!user || !activeAccountId) return;
    const todayStart = startOfDay(new Date()).toISOString();
    const { data } = await supabase
      .from("action_log")
      .select("action_type, status")
      .eq("ig_account_id", activeAccountId)
      .gte("executed_at", todayStart);
    if (data) {
      const c: Record<string, number> = {};
      data.forEach((r) => {
        if (r.status === "success") c[r.action_type] = (c[r.action_type] || 0) + 1;
        if (r.status === "failed") c["errors"] = (c["errors"] || 0) + 1;
      });
      setCounters(c);
    }
  }, [user, activeAccountId]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { fetchCounters(); }, [fetchCounters]);

  // Realtime
  useEffect(() => {
    if (!user || !activeAccountId) return;
    const channel = supabase
      .channel(`activity-log-realtime-${activeAccountId}`)
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "action_log", filter: `ig_account_id=eq.${activeAccountId}` },
        (payload: any) => {
          const newRow = payload.new as ActionLogRow;
          setNewIds((prev) => new Set(prev).add(newRow.id));
          if (page === 0) {
            setLogs((prev) => [newRow, ...prev.slice(0, PAGE_SIZE - 1)]);
            setTotalCount((c) => c + 1);
          } else {
            fetchLogs();
          }
          fetchCounters();
          setTimeout(() => setNewIds((prev) => { const s = new Set(prev); s.delete(newRow.id); return s; }), 2000);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, activeAccountId, page, fetchLogs, fetchCounters]);

  // Reset page on filter change
  useEffect(() => { setPage(0); }, [activeTypes, searchDebounced, dateFrom, dateTo]);

  // CSV Export (full — up to 10k rows)
  const [exportingCsv, setExportingCsv] = useState(false);
  const exportCSV = async () => {
    if (!activeAccountId) return;
    setExportingCsv(true);
    try {
      const { data } = await supabase
        .from("action_log")
        .select("action_type, target_username, status, executed_at")
        .eq("ig_account_id", activeAccountId)
        .order("executed_at", { ascending: false })
        .limit(10000);

      if (!data?.length) { toast.error("Nada para exportar"); setExportingCsv(false); return; }

      const header = "action_type,target_username,status,executed_at\n";
      const csvRows = data.map(r =>
        `${r.action_type},${r.target_username || ""},${r.status},${r.executed_at || ""}`
      ).join("\n");

      const blob = new Blob([header + csvRows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `atividades-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${data.length} atividades exportadas!`);
    } catch (e: any) {
      toast.error("Erro ao exportar", { description: e.message });
    } finally {
      setExportingCsv(false);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Log de Atividades</h1>
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={exportingCsv} className="gap-1.5">
          {exportingCsv ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Exportar CSV
        </Button>
      </div>

      {/* Filter chips */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {CHIP_TYPES.map((type) => {
            const meta = ACTION_META[type];
            const Icon = meta.icon;
            const isActive = activeTypes.has(type);
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  isActive
                    ? meta.chipActive
                    : "border-border/50 bg-secondary/40 text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icon className="h-3 w-3" />
                {meta.label}
              </button>
            );
          })}
        </div>

        {/* Date range + search */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 w-[140px] text-xs"
            />
            <span className="text-xs text-muted-foreground">até</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 w-[140px] text-xs"
            />
          </div>
          <div className="relative sm:ml-auto">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar @username"
              className="pl-9 h-9 w-full sm:w-52"
            />
          </div>
        </div>
      </div>

      {/* Counters */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">{totalCount}</span> ações
        </span>
        <span className="text-border">|</span>
        <span>Follows: <span className="font-medium text-emerald-400">{counters.follow ?? 0}</span></span>
        <span>Likes: <span className="font-medium text-pink-400">{counters.like ?? 0}</span></span>
        <span>Erros: <span className="font-medium text-red-400">{counters.errors ?? 0}</span></span>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="w-16 h-4 rounded bg-secondary/60 animate-pulse" />
              <div className="h-4 w-4 rounded-full bg-secondary/60 animate-pulse" />
              <div className="flex-1 h-16 rounded-lg bg-secondary/40 animate-pulse" />
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <Card className="border-border/40">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-3">
              <Search className="h-7 w-7 text-primary/60" />
            </div>
            <p className="text-sm font-medium">Nenhuma atividade encontrada</p>
            <p className="text-xs text-muted-foreground mt-1">Ajuste os filtros ou aguarde novas ações.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative pl-8">
          {/* Vertical line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border/50" />

          <div className="space-y-1">
            {logs.map((log) => {
              const meta = ACTION_META[log.action_type] || ACTION_META.error;
              const Icon = meta.icon;
              const isNew = newIds.has(log.id);

              return (
                <div
                  key={log.id}
                  className={cn(
                    "relative flex items-start gap-4 py-2 transition-all duration-500",
                    isNew && "animate-in fade-in-0 slide-in-from-top-1"
                  )}
                >
                  {/* Time */}
                  <div className="absolute -left-8 top-2.5 w-[52px] text-right">
                    <span className="text-[11px] text-muted-foreground mono">
                      {log.executed_at ? format(new Date(log.executed_at), "HH:mm") : "—"}
                    </span>
                  </div>

                  {/* Dot on the line */}
                  <div className="absolute left-[11px] top-3 z-10">
                    <div className={cn("h-[10px] w-[10px] rounded-full ring-2 ring-background", meta.dot)} />
                  </div>

                  {/* Card */}
                  <Card className={cn(
                    "flex-1 ml-4 border-border/40 card-hover",
                    isNew && "bg-primary/5"
                  )}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <Icon className={cn("h-4 w-4 shrink-0", meta.iconColor)} />
                          <span className="text-sm font-medium">{meta.label}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              log.status === "success" && "bg-emerald-400/10 text-emerald-400 border-emerald-400/30",
                              log.status === "failed" && "bg-red-400/10 text-red-400 border-red-400/30",
                              log.status === "skipped" && "bg-amber-400/10 text-amber-400 border-amber-400/30"
                            )}
                          >
                            {log.status === "success" ? "OK" : log.status === "failed" ? "Falha" : "Skip"}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {log.executed_at ? formatDistanceToNow(new Date(log.executed_at), { addSuffix: true, locale: ptBR }) : ""}
                        </span>
                      </div>
                      {log.target_username && (
                        <a
                          href={`https://instagram.com/${log.target_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                        >
                          @{log.target_username}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                      {log.executed_at && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 mono">
                          {format(new Date(log.executed_at), "dd/MM/yyyy")}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página <span className="font-medium text-foreground">{page + 1}</span> de{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
          </span>
          <Button variant="ghost" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}>
            Próxima <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

// --- Hook ---
function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default ActivityLog;
