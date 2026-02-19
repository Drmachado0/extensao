import React, { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAccounts } from "@/hooks/useAccounts";
import {
  ScrollText, ChevronLeft, ChevronRight, Download, Users, UserMinus,
  Heart, MessageCircle, SkipForward, AlertTriangle, Zap, Clock,
  ShieldAlert, TrendingUp, ChevronDown, ExternalLink,
} from "lucide-react";

const PAGE_SIZE = 50;

type ActionFilter = "all" | "follow" | "unfollow" | "like" | "skip" | "error";
type StatusFilter = "all" | "success" | "failed" | "skipped" | "rate_limited";
type PeriodFilter = "today" | "yesterday" | "7d" | "30d" | "all";

const actionIcons: Record<string, { icon: React.ElementType; color: string }> = {
  follow: { icon: Users, color: "text-primary" },
  unfollow: { icon: UserMinus, color: "text-destructive" },
  like: { icon: Heart, color: "text-primary" },
  comment: { icon: MessageCircle, color: "text-accent-foreground" },
  skip: { icon: SkipForward, color: "text-warning" },
  filter: { icon: SkipForward, color: "text-warning" },
  rate_limit: { icon: ShieldAlert, color: "text-warning" },
  error: { icon: AlertTriangle, color: "text-destructive" },
};

const statusBadge: Record<string, string> = {
  success: "bg-success/15 text-success border-success/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  skipped: "bg-warning/15 text-warning border-warning/30",
  rate_limited: "bg-warning/15 text-warning border-warning/30",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

function getPeriodStart(period: PeriodFilter): string | null {
  if (period === "all") return null;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (period === "today") return d.toISOString();
  if (period === "yesterday") { d.setDate(d.getDate() - 1); return d.toISOString(); }
  if (period === "7d") { d.setDate(d.getDate() - 7); return d.toISOString(); }
  if (period === "30d") { d.setDate(d.getDate() - 30); return d.toISOString(); }
  return null;
}

export default function LogsPage() {
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedAccountId, setSelectedAccountId] = useState("all");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [period, setPeriod] = useState<PeriodFilter>("today");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ total: 0, successRate: 0, perHour: 0, rateLimits: 0 });
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const newIdsRef = useRef(newIds);
  newIdsRef.current = newIds;

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const periodStart = getPeriodStart(period);

    // action_log is the real table; uses ig_account_id + executed_at
    let query = (supabase as any)
      .from("action_log")
      .select("id, action_type, target_username, status, executed_at, details, ig_account_id", { count: "exact" })
      .order("executed_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (selectedAccountId !== "all") query = query.eq("ig_account_id", selectedAccountId);
    if (actionFilter !== "all") query = query.eq("action_type", actionFilter);
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (periodStart) query = query.gte("executed_at", periodStart);

    // Stats query
    let statsQuery = (supabase as any).from("action_log").select("status", { count: "exact" });
    if (selectedAccountId !== "all") statsQuery = statsQuery.eq("ig_account_id", selectedAccountId);
    if (periodStart) statsQuery = statsQuery.gte("executed_at", periodStart);

    let rateLimitQuery = (supabase as any).from("action_log").select("id", { count: "exact", head: true }).eq("status", "rate_limited");
    if (selectedAccountId !== "all") rateLimitQuery = rateLimitQuery.eq("ig_account_id", selectedAccountId);
    if (periodStart) rateLimitQuery = rateLimitQuery.gte("executed_at", periodStart);

    const [logsRes, statsRes, rlRes] = await Promise.all([query, statsQuery, rateLimitQuery]);

    setLogs(logsRes.data || []);
    setTotalCount(logsRes.count ?? 0);

    const allStats = statsRes.data || [];
    const total = statsRes.count ?? 0;
    const successes = allStats.filter(s => s.status === "success").length;
    const successRate = total > 0 ? Math.round((successes / total) * 100) : 0;

    // Avg per hour
    let perHour = 0;
    if (periodStart && total > 0) {
      const hours = Math.max((Date.now() - new Date(periodStart).getTime()) / 3600000, 1);
      perHour = Math.round(total / hours);
    }

    setStats({ total, successRate, perHour, rateLimits: rlRes.count ?? 0 });
    setLoading(false);
  }, [user, page, selectedAccountId, actionFilter, statusFilter, period]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(0); }, [selectedAccountId, actionFilter, statusFilter, period]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = (supabase as any)
      .channel("logs-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "action_log" }, (payload: any) => {
        const newLog = payload.new as any;
        setLogs(prev => [newLog, ...prev.slice(0, PAGE_SIZE - 1)]);
        setTotalCount(c => c + 1);
        setNewIds(prev => new Set([...prev, newLog.id]));
        setTimeout(() => {
          setNewIds(prev => { const next = new Set(prev); next.delete(newLog.id); return next; });
        }, 3000);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const exportCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Data", "Tipo", "Username", "Status", "Erro", "Detalhes"];
    const rows = logs.map(l => [
      new Date(l.created_at).toLocaleString("pt-BR"),
      l.action_type, l.target_username || "", l.status || "",
      l.error_message || "",
      l.details ? JSON.stringify(l.details) : "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Logs</h1>
        <p className="text-muted-foreground">Histórico completo de ações</p>
      </div>

      {/* Filters Bar */}
      <Card className="glass-card">
        <CardContent className="flex flex-wrap items-center gap-2 py-3">
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Conta" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              {accounts.map(a => <SelectItem key={a.id} value={a.id}>@{a.ig_username}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={v => setActionFilter(v as ActionFilter)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="follow">Follow</SelectItem>
              <SelectItem value="unfollow">Unfollow</SelectItem>
              <SelectItem value="like">Like</SelectItem>
              <SelectItem value="skip">Skip</SelectItem>
              <SelectItem value="error">Erro</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="skipped">Skipped</SelectItem>
              <SelectItem value="rate_limited">Rate Limited</SelectItem>
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={v => setPeriod(v as PeriodFilter)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="yesterday">Ontem</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="all">Todo período</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="py-4 flex items-center gap-3">
            <Zap className="h-8 w-8 text-primary" />
            <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total de ações</p></div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="py-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-success" />
            <div><p className="text-2xl font-bold">{stats.successRate}%</p><p className="text-xs text-muted-foreground">Taxa de sucesso</p></div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="py-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-primary" />
            <div><p className="text-2xl font-bold">{stats.perHour}</p><p className="text-xs text-muted-foreground">Ações/hora (média)</p></div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="py-4 flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-warning" />
            <div><p className="text-2xl font-bold">{stats.rateLimits}</p><p className="text-xs text-muted-foreground">Rate limits</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card className="glass-card">
        <CardContent className="pt-4 overflow-x-auto">
          {loading ? (
            <div className="space-y-2 py-4">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 rounded" />)}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <ScrollText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum log encontrado.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Alvo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => {
                    const ai = actionIcons[log.action_type] || actionIcons.error;
                    const Icon = ai.icon;
                    const isNew = newIds.has(log.id);
                    const isExpanded = expandedRows.has(log.id);
                    return (
                      <React.Fragment key={log.id}>
                        <TableRow key={log.id} className={`transition-colors ${isNew ? "bg-primary/10 animate-pulse" : ""}`}>
                          <TableCell className="text-sm">
                            <span className="text-muted-foreground" title={new Date(log.created_at).toLocaleString("pt-BR")}>{timeAgo(log.created_at)}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Icon className={`h-4 w-4 ${ai.color}`} />
                              <span className={`text-sm font-medium ${ai.color}`}>{log.action_type}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.target_username ? (
                              <a href={`https://instagram.com/${log.target_username}`} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-primary transition-colors flex items-center gap-1">
                                @{log.target_username}
                                <ExternalLink className="h-3 w-3 opacity-40" />
                              </a>
                            ) : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`text-xs ${statusBadge[log.status] || ""}`}>{log.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {(log.details || log.error_message) && (
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleExpand(log.id)}>
                                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow key={`${log.id}-detail`}>
                            <TableCell colSpan={5} className="bg-secondary/30 text-xs">
                              {log.error_message && <p className="text-destructive mb-1">Erro: {log.error_message}</p>}
                              {log.details && <pre className="whitespace-pre-wrap text-muted-foreground">{JSON.stringify(log.details, null, 2)}</pre>}
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                </Button>
                <span className="text-sm text-muted-foreground">Página {page + 1} de {totalPages || 1} ({totalCount} logs)</span>
                <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Próxima <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
