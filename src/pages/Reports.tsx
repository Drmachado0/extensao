import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveAccount } from "@/hooks/useActiveAccount";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  FileText, Download, TrendingUp, TrendingDown, Shield, ShieldCheck,
  ShieldAlert, ShieldX, MessageSquare, UserPlus,
  Zap, Clock, AlertTriangle, Activity, CheckCircle2,
  BarChart3, PieChart as PieChartIcon,
} from "lucide-react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { CountUp } from "@/components/CountUp";

// ─── Types ───
interface ActionRow {
  action_type: string;
  status: string;
  executed_at: string;
  target_username: string | null;
  details?: any;
}

interface DailySummary {
  day: string;
  action_type: string;
  success_count: number;
  failed_count: number;
  total_count: number;
}

interface SessionRow {
  id: string;
  follows_count: number;
  unfollows_count: number;
  likes_count: number;
  comments_count: number;
  blocks_count: number;
  skips_count: number;
  errors_count: number;
  session_start: string;
  session_end: string;
}

// ─── Constants ───
const CHART_TOOLTIP = {
  fontFamily: "'JetBrains Mono', monospace",
  background: "hsl(240, 10%, 8%)",
  border: "1px solid hsl(240, 8%, 16%)",
  borderRadius: "10px",
  color: "hsl(220, 14%, 90%)",
  fontSize: "12px",
  boxShadow: "0 8px 32px -8px hsl(0 0% 0% / 0.5)",
};

const ACTION_COLORS: Record<string, string> = {
  follow: "hsl(152, 72%, 48%)",
  unfollow: "hsl(0, 72%, 55%)",
  like: "hsl(330, 70%, 55%)",
  comment: "hsl(252, 62%, 60%)",
  skip: "hsl(42, 96%, 56%)",
  block: "hsl(0, 84%, 60%)",
  watch_reel: "hsl(215, 70%, 60%)",
  error: "hsl(0, 50%, 40%)",
};

const ACTION_LABELS: Record<string, string> = {
  follow: "Follows",
  unfollow: "Unfollows",
  like: "Curtidas",
  comment: "Comentários",
  skip: "Skips",
  block: "Bloqueios",
  watch_reel: "Reels",
  error: "Erros",
  rate_limit: "Rate Limits",
};

const PERIOD_OPTIONS = [
  { label: "7 dias", value: 7 },
  { label: "14 dias", value: 14 },
  { label: "30 dias", value: 30 },
  { label: "90 dias", value: 90 },
];

// ─── Component ───
const Reports = () => {
  const { user } = useAuth();
  const { activeAccountId } = useActiveAccount();
  const [period, setPeriod] = useState(7);
  const [loading, setLoading] = useState(true);

  // Data
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [prevPeriodActions, setPrevPeriodActions] = useState(0);

  const fetchData = useCallback(async () => {
    if (!user || !activeAccountId) return;
    setLoading(true);

    const since = subDays(new Date(), period).toISOString();
    const prevSince = subDays(new Date(), period * 2).toISOString();

    const [actionsRes, dailyRes, sessionsRes, prevRes] = await Promise.all([
      supabase
        .from("action_log")
        .select("action_type, status, executed_at, target_username, details")
        .eq("ig_account_id", activeAccountId)
        .gte("executed_at", since)
        .order("executed_at", { ascending: true }),
      supabase
        .from("daily_action_summary")
        .select("day, action_type, success_count, failed_count, total_count")
        .eq("ig_account_id", activeAccountId)
        .gte("day", since.slice(0, 10)),
      supabase
        .from("session_stats")
        .select("*")
        .eq("ig_account_id", activeAccountId)
        .gte("session_end", since)
        .order("session_end", { ascending: false })
        .limit(20),
      supabase
        .from("action_log")
        .select("id", { count: "exact", head: true })
        .eq("ig_account_id", activeAccountId)
        .eq("status", "success")
        .gte("executed_at", prevSince)
        .lt("executed_at", since),
    ]);

    setActions(actionsRes.data ?? []);
    setDailySummaries(dailyRes.data ?? []);
    setSessions(sessionsRes.data ?? []);
    setPrevPeriodActions(prevRes.count ?? 0);
    setLoading(false);
  }, [user, activeAccountId, period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Derived Analytics ───
  const analytics = useMemo(() => {
    const successActions = actions.filter(a => a.status === "success");
    const failedActions = actions.filter(a => a.status === "failed");

    // By type
    const byType: Record<string, number> = {};
    successActions.forEach(a => {
      byType[a.action_type] = (byType[a.action_type] || 0) + 1;
    });

    // Pie chart data
    const pieData = Object.entries(byType)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({
        name: ACTION_LABELS[key] || key,
        value,
        color: ACTION_COLORS[key] || "hsl(220, 10%, 40%)",
      }))
      .sort((a, b) => b.value - a.value);

    // Hourly heatmap
    const hourlyMap = new Map<number, number>();
    successActions.forEach(a => {
      const hour = new Date(a.executed_at).getHours();
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
    });
    const hourlyData = Array.from({ length: 24 }, (_, h) => ({
      hour: `${String(h).padStart(2, "0")}h`,
      count: hourlyMap.get(h) || 0,
    }));

    // Daily trend
    const dailyMap = new Map<string, Record<string, number>>();
    const sinceDate = subDays(new Date(), period);
    const allDays = eachDayOfInterval({ start: sinceDate, end: new Date() });
    allDays.forEach(d => {
      dailyMap.set(format(d, "dd/MM"), { follow: 0, unfollow: 0, like: 0, comment: 0, skip: 0, watch_reel: 0 });
    });
    dailySummaries.forEach(s => {
      const key = format(new Date(s.day + "T12:00:00"), "dd/MM");
      const entry = dailyMap.get(key);
      if (entry) entry[s.action_type] = Number(s.success_count) || 0;
    });
    const dailyTrend = Array.from(dailyMap.entries()).map(([date, vals]) => ({
      date,
      ...vals,
      total: Object.values(vals).reduce((sum, v) => sum + v, 0),
    }));

    // Success rate
    const totalActions = actions.length;
    const successRate = totalActions > 0 ? Math.round((successActions.length / totalActions) * 100) : 100;

    // Error breakdown
    const errorTypes: Record<string, number> = {};
    failedActions.forEach(a => {
      const detail = typeof a.details === "string" ? a.details : JSON.stringify(a.details || "");
      const type = detail.includes("rate_limit") || detail.includes("429") ? "Rate Limit"
        : detail.includes("400") || detail.includes("blocked") ? "Blocked"
        : detail.includes("403") ? "Forbidden"
        : "Other";
      errorTypes[type] = (errorTypes[type] || 0) + 1;
    });

    // Safety score (0-100)
    const errorRate = totalActions > 0 ? failedActions.length / totalActions : 0;
    const blockCount = (errorTypes["Blocked"] || 0) + (errorTypes["Rate Limit"] || 0);
    const safetyScore = Math.max(0, Math.min(100, Math.round(
      100 - (errorRate * 200) - (blockCount * 10)
    )));

    // Top commented accounts
    const commentedAccounts: Record<string, number> = {};
    successActions
      .filter(a => a.action_type === "comment" && a.target_username)
      .forEach(a => {
        commentedAccounts[a.target_username!] = (commentedAccounts[a.target_username!] || 0) + 1;
      });

    // Change vs previous period
    const currentTotal = successActions.length;
    const changePct = prevPeriodActions > 0
      ? Math.round(((currentTotal - prevPeriodActions) / prevPeriodActions) * 100)
      : currentTotal > 0 ? 100 : 0;

    // Average per day
    const activeDays = new Set(successActions.map(a => format(new Date(a.executed_at), "yyyy-MM-dd"))).size;
    const avgPerDay = activeDays > 0 ? Math.round(currentTotal / activeDays) : 0;

    // Best day
    let bestDay = "—";
    let bestDayCount = 0;
    dailyTrend.forEach(d => {
      if (d.total > bestDayCount) {
        bestDayCount = d.total;
        bestDay = d.date;
      }
    });

    // Peak hour
    let peakHour = "—";
    let peakHourCount = 0;
    hourlyData.forEach(h => {
      if (h.count > peakHourCount) {
        peakHourCount = h.count;
        peakHour = h.hour;
      }
    });

    return {
      totalActions: currentTotal,
      totalFailed: failedActions.length,
      byType,
      pieData,
      hourlyData,
      dailyTrend,
      successRate,
      errorTypes,
      safetyScore,
      commentedAccounts,
      changePct,
      avgPerDay,
      bestDay: bestDayCount > 0 ? `${bestDay} (${bestDayCount})` : "—",
      peakHour: peakHourCount > 0 ? `${peakHour} (${peakHourCount})` : "—",
      activeDays,
    };
  }, [actions, dailySummaries, prevPeriodActions, period]);

  // ─── Export ───
  const exportReport = async () => {
    const lines = [
      `ORGANIC REPORT — Last ${period} days`,
      `Generated: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
      "",
      "=== SUMMARY ===",
      `Total actions: ${analytics.totalActions}`,
      `Success rate: ${analytics.successRate}%`,
      `Safety score: ${analytics.safetyScore}/100`,
      `Average/day: ${analytics.avgPerDay}`,
      `Best day: ${analytics.bestDay}`,
      `Peak hour: ${analytics.peakHour}`,
      `Active days: ${analytics.activeDays}`,
      `Change vs prev period: ${analytics.changePct > 0 ? "+" : ""}${analytics.changePct}%`,
      "",
      "=== BY TYPE ===",
      ...Object.entries(analytics.byType).map(([k, v]) => `${ACTION_LABELS[k] || k}: ${v}`),
      "",
      "=== ERRORS ===",
      `Total: ${analytics.totalFailed}`,
      ...Object.entries(analytics.errorTypes).map(([k, v]) => `${k}: ${v}`),
      "",
      "=== SESSIONS ===",
      ...sessions.map(s => {
        const total = s.follows_count + s.likes_count + s.comments_count + s.unfollows_count;
        return `${format(new Date(s.session_start), "dd/MM HH:mm")} - ${format(new Date(s.session_end), "HH:mm")} | ${total} actions | ${s.errors_count} errors`;
      }),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `organic-report-${period}d-${format(new Date(), "yyyy-MM-dd")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado!");
  };

  // ─── Safety Score Color ───
  const safetyColor = analytics.safetyScore >= 80 ? "text-emerald-400" : analytics.safetyScore >= 50 ? "text-amber-400" : "text-red-400";
  const safetyBg = analytics.safetyScore >= 80 ? "bg-emerald-400" : analytics.safetyScore >= 50 ? "bg-amber-400" : "bg-red-400";
  const safetyIcon = analytics.safetyScore >= 80 ? ShieldCheck : analytics.safetyScore >= 50 ? ShieldAlert : ShieldX;
  const SafetyIcon = safetyIcon;
  const safetyLabel = analytics.safetyScore >= 80 ? "Excelente" : analytics.safetyScore >= 50 ? "Moderado" : "Crítico";

  if (loading) {
    return (
      <div className="space-y-6 page-enter">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 rounded-lg bg-secondary animate-pulse" />
          <div className="h-8 w-32 rounded-lg bg-secondary animate-pulse" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-28 animate-pulse bg-secondary/30" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="h-72 animate-pulse bg-secondary/30" />
          <Card className="h-72 animate-pulse bg-secondary/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-sm text-muted-foreground/70 mt-0.5">
            Análise detalhada do período • {analytics.activeDays} dias ativos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-lg bg-secondary/60 p-1 ring-1 ring-border/50">
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === p.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={exportReport} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Exportar
          </Button>
        </div>
      </div>

      {/* ─── Summary Cards ─── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Actions */}
        <Card className="card-hover fade-up fade-up-1 relative overflow-hidden">
          <div className="metric-glow bg-primary/8" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Total Ações</p>
                <CountUp value={analytics.totalActions} className="text-2xl font-bold mono" />
                {analytics.changePct !== 0 && (
                  <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${
                    analytics.changePct > 0 ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {analytics.changePct > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span className="mono">{analytics.changePct > 0 ? "+" : ""}{analytics.changePct}%</span>
                    <span className="text-muted-foreground/50">vs anterior</span>
                  </div>
                )}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 ring-1 ring-primary/10">
                <Zap className="h-[18px] w-[18px] text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Safety Score */}
        <Card className="card-hover fade-up fade-up-2 relative overflow-hidden">
          <div className={`metric-glow ${safetyBg}/8`} />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Safety Score</p>
                <p className={`text-2xl font-bold mono ${safetyColor}`}>{analytics.safetyScore}</p>
                <p className={`text-xs font-medium mt-1 ${safetyColor}`}>{safetyLabel}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${safetyBg}/8 ring-1 ${safetyBg}/10`}>
                <SafetyIcon className={`h-[18px] w-[18px] ${safetyColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card className="card-hover fade-up fade-up-3 relative overflow-hidden">
          <div className="metric-glow bg-emerald-400/8" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Taxa de Sucesso</p>
                <p className="text-2xl font-bold mono">{analytics.successRate}%</p>
                <p className="text-xs text-muted-foreground/50 mt-1 mono">
                  {analytics.totalFailed} falhas
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/8 ring-1 ring-emerald-400/10">
                <CheckCircle2 className="h-[18px] w-[18px] text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg per day */}
        <Card className="card-hover fade-up fade-up-4 relative overflow-hidden">
          <div className="metric-glow bg-amber-400/8" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Média / Dia</p>
                <p className="text-2xl font-bold mono">{analytics.avgPerDay}</p>
                <p className="text-xs text-muted-foreground/50 mt-1">
                  Pico: {analytics.peakHour}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/8 ring-1 ring-amber-400/10">
                <BarChart3 className="h-[18px] w-[18px] text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Charts Row 1: Daily Trend + Action Breakdown ─── */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Daily Stacked Area */}
        <Card className="card-hover fade-up fade-up-5 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary/60" />
              Ações por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {analytics.dailyTrend.length === 0 ? (
                <EmptyState icon={Activity} message="Nenhuma ação no período" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.dailyTrend}>
                    <defs>
                      <linearGradient id="rptFollow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ACTION_COLORS.follow} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={ACTION_COLORS.follow} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="rptLike" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ACTION_COLORS.like} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={ACTION_COLORS.like} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="rptComment" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ACTION_COLORS.comment} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={ACTION_COLORS.comment} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="hsl(240, 8%, 12%)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" stroke="hsl(220, 10%, 35%)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(220, 10%, 35%)" fontSize={10} tickLine={false} axisLine={false} width={35} />
                    <Tooltip contentStyle={CHART_TOOLTIP} />
                    <Area type="monotone" dataKey="follow" stackId="1" stroke={ACTION_COLORS.follow} fill="url(#rptFollow)" strokeWidth={1.5} name="Follows" />
                    <Area type="monotone" dataKey="like" stackId="1" stroke={ACTION_COLORS.like} fill="url(#rptLike)" strokeWidth={1.5} name="Curtidas" />
                    <Area type="monotone" dataKey="comment" stackId="1" stroke={ACTION_COLORS.comment} fill="url(#rptComment)" strokeWidth={1.5} name="Comentários" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Breakdown Pie */}
        <Card className="card-hover fade-up fade-up-5 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary/60" />
              Distribuição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              {analytics.pieData.length === 0 ? (
                <EmptyState icon={PieChartIcon} message="Sem dados" />
              ) : (
                <div className="flex items-center gap-4 w-full">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie
                        data={analytics.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="hsl(240, 14%, 4%)"
                        strokeWidth={2}
                      >
                        {analytics.pieData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={CHART_TOOLTIP} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {analytics.pieData.slice(0, 6).map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="font-semibold mono">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Charts Row 2: Hourly Pattern + Error Analysis ─── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Hourly Activity Pattern */}
        <Card className="card-hover fade-up fade-up-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary/60" />
              Padrão por Hora
              <span className="text-[10px] text-muted-foreground/50 font-normal ml-auto">Ações acumuladas por hora</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.hourlyData}>
                  <CartesianGrid stroke="hsl(240, 8%, 12%)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    stroke="hsl(220, 10%, 35%)"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    interval={2}
                  />
                  <YAxis stroke="hsl(220, 10%, 35%)" fontSize={10} tickLine={false} axisLine={false} width={30} />
                  <Tooltip contentStyle={CHART_TOOLTIP} />
                  <Bar dataKey="count" fill="hsl(252, 62%, 60%)" radius={[3, 3, 0, 0]} name="Ações" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Safety & Error Analysis */}
        <Card className="card-hover fade-up fade-up-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary/60" />
              Análise de Segurança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Safety Score Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Safety Score</span>
                  <span className={`text-sm font-bold mono ${safetyColor}`}>
                    {analytics.safetyScore}/100
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-secondary/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${safetyBg}`}
                    style={{ width: `${analytics.safetyScore}%`, opacity: 0.7 }}
                  />
                </div>
              </div>

              {/* Error Breakdown */}
              {Object.keys(analytics.errorTypes).length > 0 ? (
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground font-medium">Erros por tipo</span>
                  {Object.entries(analytics.errorTypes).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          type === "Rate Limit" ? "bg-amber-400" :
                          type === "Blocked" ? "bg-red-400" : "bg-zinc-400"
                        }`} />
                        <span className="text-xs text-muted-foreground">{type}</span>
                      </div>
                      <span className="text-xs font-semibold mono">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <ShieldCheck className="h-8 w-8 text-emerald-400/30 mx-auto mb-2" />
                  <p className="text-xs text-emerald-400">Nenhum erro no período!</p>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/30">
                <div className="text-center">
                  <p className="text-lg font-bold mono">{analytics.successRate}%</p>
                  <p className="text-[10px] text-muted-foreground">Sucesso</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold mono">{analytics.totalFailed}</p>
                  <p className="text-[10px] text-muted-foreground">Falhas</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold mono">{analytics.activeDays}</p>
                  <p className="text-[10px] text-muted-foreground">Dias ativos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Session History ─── */}
      <Card className="card-hover fade-up">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary/60" />
            Histórico de Sessões
            <Badge variant="secondary" className="ml-auto text-[10px]">{sessions.length} sessões</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <EmptyState icon={FileText} message="Nenhuma sessão registrada no período" />
          ) : (
            <div className="space-y-2">
              {sessions.slice(0, 10).map((session) => {
                const total = session.follows_count + session.unfollows_count + session.likes_count + session.comments_count;
                const duration = session.session_start && session.session_end
                  ? Math.round((new Date(session.session_end).getTime() - new Date(session.session_start).getTime()) / 60000)
                  : 0;
                const hasErrors = session.errors_count > 0;

                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-lg bg-secondary/30 hover:bg-secondary/50 px-4 py-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        hasErrors ? "bg-red-400/10" : "bg-emerald-400/10"
                      }`}>
                        {hasErrors ? (
                          <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {total} ações
                          {duration > 0 && (
                            <span className="text-muted-foreground/50 font-normal ml-2">
                              {duration}min
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {session.follows_count > 0 && (
                            <span className="text-[10px] text-emerald-400 font-medium">{session.follows_count}f</span>
                          )}
                          {session.likes_count > 0 && (
                            <span className="text-[10px] text-pink-400 font-medium">{session.likes_count}l</span>
                          )}
                          {session.comments_count > 0 && (
                            <span className="text-[10px] text-primary font-medium">{session.comments_count}c</span>
                          )}
                          {session.unfollows_count > 0 && (
                            <span className="text-[10px] text-red-400 font-medium">{session.unfollows_count}u</span>
                          )}
                          {session.errors_count > 0 && (
                            <span className="text-[10px] text-red-400 font-medium">{session.errors_count}err</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] mono text-muted-foreground/60">
                        {format(new Date(session.session_end), "dd/MM")}
                      </p>
                      <p className="text-[10px] mono text-muted-foreground/40">
                        {format(new Date(session.session_start), "HH:mm")} — {format(new Date(session.session_end), "HH:mm")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Comment Analytics ─── */}
      {(analytics.byType.comment || 0) > 0 && (
        <Card className="card-hover fade-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary/60" />
              Análise de Comentários
              <Badge variant="outline" className="ml-auto text-[10px] bg-primary/10 text-primary border-primary/20">
                {analytics.byType.comment || 0} enviados
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center rounded-xl bg-secondary/30 py-4 ring-1 ring-border/30">
                <MessageSquare className="h-5 w-5 text-primary/40 mx-auto mb-2" />
                <p className="text-2xl font-bold mono">{analytics.byType.comment || 0}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">Total comentários</p>
              </div>
              <div className="text-center rounded-xl bg-secondary/30 py-4 ring-1 ring-border/30">
                <Activity className="h-5 w-5 text-emerald-400/40 mx-auto mb-2" />
                <p className="text-2xl font-bold mono">
                  {analytics.activeDays > 0 ? Math.round((analytics.byType.comment || 0) / analytics.activeDays) : 0}
                </p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">Média / dia</p>
              </div>
              <div className="text-center rounded-xl bg-secondary/30 py-4 ring-1 ring-border/30">
                <UserPlus className="h-5 w-5 text-blue-400/40 mx-auto mb-2" />
                <p className="text-2xl font-bold mono">
                  {Object.keys(analytics.commentedAccounts).length}
                </p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">Contas únicas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ─── Shared Empty State ───
function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center py-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/8">
        <Icon className="h-6 w-6 text-primary/40" />
      </div>
      <p className="text-xs text-muted-foreground/60">{message}</p>
    </div>
  );
}

export default Reports;
