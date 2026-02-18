import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveAccount } from "@/hooks/useActiveAccount";
import { useRealtimeActions } from "@/hooks/useRealtimeActions";
import { useBotStatus } from "@/hooks/useBotStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CountUp } from "@/components/CountUp";
import { MetricCardSkeleton, ChartSkeleton, RecentActionsSkeleton, SummarySkeleton } from "@/components/DashboardSkeletons";
import Sparkline from "@/components/Sparkline";
import OnboardingWizard from "@/components/OnboardingWizard";
import BotRemoteControl from "@/components/BotRemoteControl";
import { Users, UserPlus, Zap, Heart, UserMinus, SkipForward, Ban, Eye, MessageSquare, Plug, TrendingUp, TrendingDown, Activity, Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, formatDistanceToNow, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// --- Types ---
interface IgAccount {
  id: string;
  followers_count: number;
  following_count: number;
  bot_online: boolean;
  bot_status: string;
  last_heartbeat: string | null;
}

interface ActionLog {
  id: string;
  action_type: string;
  target_username: string | null;
  status: string;
  executed_at: string;
}

interface GrowthPoint {
  date: string;
  followers: number;
}

interface DaySummary {
  follow: number;
  unfollow: number;
  like: number;
  skip: number;
  comment: number;
  block: number;
  watch_reel: number;
}

// --- Helpers ---
const ACTION_ICONS: Record<string, React.ElementType> = {
  follow: UserPlus,
  unfollow: UserMinus,
  like: Heart,
  comment: MessageSquare,
  block: Ban,
  skip: SkipForward,
  watch_reel: Eye,
  error: Ban,
  rate_limit: Ban,
};

const ACTION_BADGE_CLASS: Record<string, string> = {
  follow: "badge-follow",
  unfollow: "badge-unfollow",
  like: "badge-like",
  comment: "badge-comment",
  skip: "badge-skip",
  block: "badge-block",
  watch_reel: "badge-like",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function formatK(v: number) {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(v);
}

// --- Component ---
const Index = () => {
  const { user } = useAuth();
  const { activeAccountId } = useActiveAccount();
  const { todayCount: rtTodayCount, refreshKey } = useRealtimeActions();
  const botStatusHook = useBotStatus(activeAccountId);
  const [account, setAccount] = useState<IgAccount | null>(null);
  const [noAccount, setNoAccount] = useState(false);
  const [yesterdayFollowers, setYesterdayFollowers] = useState<number | null>(null);
  const [actionsToday, setActionsToday] = useState(0);
  const [recentActions, setRecentActions] = useState<ActionLog[]>([]);
  const [growthData, setGrowthData] = useState<GrowthPoint[]>([]);
  const [daySummary, setDaySummary] = useState<DaySummary>({
    follow: 0, unfollow: 0, like: 0, skip: 0, comment: 0, block: 0, watch_reel: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorCount, setErrorCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  // Sparkline data
  const [sparkFollowers, setSparkFollowers] = useState<number[]>([]);
  const [sparkFollowing, setSparkFollowing] = useState<number[]>([]);
  const [sparkActions, setSparkActions] = useState<number[]>([]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const fetchAll = useCallback(async () => {
    if (!user || !activeAccountId) return;

    const { data: acc } = await supabase
      .from("ig_accounts")
      .select("id, followers_count, following_count, bot_online, bot_status, last_heartbeat")
      .eq("id", activeAccountId)
      .maybeSingle();
    setAccount(acc);

    if (!acc) {
      setNoAccount(true);
      setLoading(false);
      return;
    }

    setNoAccount(false);
    const yesterday = subDays(new Date(), 1).toISOString();
    const since7d = subDays(new Date(), 7).toISOString();
    const since30d = subDays(new Date(), 30).toISOString();

    const [yesterdayRes, todayActionsRes, recentRes, growthRes, spark7dRes, sparkActionsRes] = await Promise.all([
      supabase
        .from("growth_stats")
        .select("followers_count")
        .eq("ig_account_id", acc.id)
        .lte("recorded_at", yesterday)
        .order("recorded_at", { ascending: false })
        .limit(1),
      supabase
        .from("action_log")
        .select("action_type, status")
        .eq("ig_account_id", acc.id)
        .gte("executed_at", todayStart.toISOString()),
      supabase
        .from("action_log")
        .select("id, action_type, target_username, status, executed_at")
        .eq("ig_account_id", acc.id)
        .order("executed_at", { ascending: false })
        .limit(10),
      supabase
        .from("growth_stats")
        .select("followers_count, recorded_at")
        .eq("ig_account_id", acc.id)
        .gte("recorded_at", since30d)
        .order("recorded_at", { ascending: true }),
      supabase
        .from("growth_stats")
        .select("followers_count, following_count, recorded_at")
        .eq("ig_account_id", acc.id)
        .gte("recorded_at", since7d)
        .order("recorded_at", { ascending: true }),
      supabase
        .from("daily_action_summary")
        .select("day, success_count")
        .eq("ig_account_id", acc.id)
        .gte("day", since7d.slice(0, 10)),
    ]);

    setYesterdayFollowers(yesterdayRes.data?.[0]?.followers_count ?? null);

    if (todayActionsRes.data) {
      setActionsToday(todayActionsRes.data.filter((a) => a.status === "success").length);
      setErrorCount(todayActionsRes.data.filter((a) => a.status === "failed").length);
      const summary: DaySummary = { follow: 0, unfollow: 0, like: 0, skip: 0, comment: 0, block: 0, watch_reel: 0 };
      todayActionsRes.data.forEach((a) => {
        if (a.status === "success" && a.action_type in summary) {
          summary[a.action_type as keyof DaySummary]++;
        }
      });
      setDaySummary(summary);
      setCommentCount(summary.comment);
    }

    setRecentActions(recentRes.data ?? []);

    if (growthRes.data && growthRes.data.length > 0) {
      const byDay = new Map<string, number>();
      growthRes.data.forEach((g) => {
        const day = format(new Date(g.recorded_at!), "dd/MM");
        byDay.set(day, g.followers_count ?? 0);
      });
      setGrowthData(Array.from(byDay.entries()).map(([date, followers]) => ({ date, followers })));
    } else {
      setGrowthData([]);
    }

    if (spark7dRes.data && spark7dRes.data.length > 0) {
      const fByDay = new Map<string, number>();
      const foByDay = new Map<string, number>();
      spark7dRes.data.forEach((g) => {
        const day = g.recorded_at!.slice(0, 10);
        fByDay.set(day, g.followers_count ?? 0);
        foByDay.set(day, g.following_count ?? 0);
      });
      setSparkFollowers(Array.from(fByDay.values()));
      setSparkFollowing(Array.from(foByDay.values()));
    }

    if (sparkActionsRes.data && sparkActionsRes.data.length > 0) {
      const byDay = new Map<string, number>();
      sparkActionsRes.data.forEach((r) => {
        const day = r.day!;
        byDay.set(day, (byDay.get(day) || 0) + Number(r.success_count ?? 0));
      });
      setSparkActions(Array.from(byDay.values()));
    }

    setLoading(false);
  }, [user, activeAccountId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (refreshKey > 0) fetchAll();
  }, [refreshKey, fetchAll]);

  // Memoized derived values
  const botOnline = botStatusHook.isOnline;
  const followers = account?.followers_count ?? 0;
  const following = account?.following_count ?? 0;
  const followersDelta = useMemo(() => yesterdayFollowers !== null ? followers - yesterdayFollowers : null, [followers, yesterdayFollowers]);
  const ratio = useMemo(() => following > 0 ? (followers / following).toFixed(1) : "—", [followers, following]);
  const safetyScore = useMemo(() => {
    const total = actionsToday + errorCount;
    if (total === 0) return 100;
    const errorRate = errorCount / total;
    return Math.max(0, Math.min(100, Math.round(100 - (errorRate * 200) - (errorCount > 5 ? 20 : 0))));
  }, [actionsToday, errorCount]);

  const summaryItems = useMemo(() => [
    { label: "Follows", value: daySummary.follow, icon: UserPlus, color: "bg-emerald-400" },
    { label: "Unfollows", value: daySummary.unfollow, icon: UserMinus, color: "bg-red-400" },
    { label: "Likes", value: daySummary.like, icon: Heart, color: "bg-pink-400" },
    { label: "Comments", value: daySummary.comment, icon: MessageSquare, color: "bg-primary" },
    { label: "Skips", value: daySummary.skip, icon: SkipForward, color: "bg-amber-400" },
    { label: "Reels", value: daySummary.watch_reel, icon: Eye, color: "bg-blue-400" },
  ], [daySummary]);

  const maxSummary = useMemo(() => Math.max(...summaryItems.map((s) => s.value), 1), [summaryItems]);
  const totalActions = useMemo(() => summaryItems.reduce((acc, s) => acc + s.value, 0), [summaryItems]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 page-enter">
        <div>
          <div className="h-8 w-48 rounded-lg bg-secondary animate-pulse" />
          <div className="h-4 w-72 rounded-lg bg-secondary animate-pulse mt-2" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)}
        </div>
        <ChartSkeleton />
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3"><RecentActionsSkeleton /></div>
          <div className="lg:col-span-2"><SummarySkeleton /></div>
        </div>
      </div>
    );
  }

  if (noAccount) {
    return (
      <div className="page-enter">
        <OnboardingWizard onComplete={fetchAll} />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      {/* ─── GREETING ─── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{getGreeting()} 👋</h1>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Aqui está o resumo da sua automação
            {botOnline && (
              <span className="ml-2 inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                bot ativo
              </span>
            )}
          </p>
        </div>
        {followersDelta !== null && followersDelta !== 0 && (
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
            followersDelta > 0
              ? "bg-emerald-400/6 text-emerald-400 ring-emerald-400/15"
              : "bg-red-400/6 text-red-400 ring-red-400/15"
          }`}>
            {followersDelta > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            <span className="mono">{followersDelta > 0 ? "+" : ""}{followersDelta} hoje</span>
          </div>
        )}
      </div>

      {/* ─── METRIC CARDS ─── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Seguidores */}
        <Card className="card-hover fade-up fade-up-1 relative overflow-hidden">
          <div className="metric-glow bg-primary/8" />
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 ring-1 ring-primary/10">
                <Users className="h-[18px] w-[18px] text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Seguidores</p>
                <CountUp value={followers} className="text-2xl font-bold mono" />
              </div>
            </div>
            <Sparkline data={sparkFollowers} color="hsl(252, 62%, 60%)" />
          </CardContent>
        </Card>

        {/* Seguindo */}
        <Card className="card-hover fade-up fade-up-2 relative overflow-hidden">
          <div className="metric-glow bg-blue-400/8" />
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-400/8 ring-1 ring-blue-400/10">
                <UserPlus className="h-[18px] w-[18px] text-blue-400" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Seguindo</p>
                <CountUp value={following} className="text-2xl font-bold mono" />
                <p className="text-[11px] text-muted-foreground/50 mt-0.5">Ratio <span className="mono font-semibold text-foreground/80">{ratio}</span></p>
              </div>
            </div>
            <Sparkline data={sparkFollowing} color="hsl(215, 70%, 60%)" />
          </CardContent>
        </Card>

        {/* Ações Hoje */}
        <Card className="card-hover fade-up fade-up-3 relative overflow-hidden">
          <div className="metric-glow bg-amber-400/8" />
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/8 ring-1 ring-amber-400/10">
                <Zap className="h-[18px] w-[18px] text-amber-400" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Ações Hoje</p>
                <CountUp value={actionsToday} className="text-2xl font-bold mono" />
                <p className="text-[11px] text-muted-foreground/50 mt-0.5 mono">
                  {daySummary.follow > 0 && <span>{daySummary.follow}f</span>}
                  {daySummary.follow > 0 && daySummary.like > 0 && <span> · </span>}
                  {daySummary.like > 0 && <span>{daySummary.like}l</span>}
                  {daySummary.like > 0 && daySummary.comment > 0 && <span> · </span>}
                  {daySummary.comment > 0 && <span className="text-primary">{daySummary.comment}c</span>}
                </p>
              </div>
            </div>
            <Sparkline data={sparkActions} color="hsl(45, 93%, 58%)" />
          </CardContent>
        </Card>

        {/* Safety Score */}
        <Card className={`card-hover fade-up fade-up-4 relative overflow-hidden ${safetyScore >= 80 ? "ring-1 ring-emerald-400/10" : safetyScore >= 50 ? "ring-1 ring-amber-400/10" : "ring-1 ring-red-400/10"}`}>
          <div className={`metric-glow ${safetyScore >= 80 ? "bg-emerald-400/8" : safetyScore >= 50 ? "bg-amber-400/8" : "bg-red-400/8"}`} />
          <CardContent className="flex items-center gap-4 p-5">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              safetyScore >= 80 ? "bg-emerald-400/8 ring-1 ring-emerald-400/10" :
              safetyScore >= 50 ? "bg-amber-400/8 ring-1 ring-amber-400/10" :
              "bg-red-400/8 ring-1 ring-red-400/10"
            }`}>
              {safetyScore >= 80 ? (
                <ShieldCheck className="h-[18px] w-[18px] text-emerald-400" />
              ) : safetyScore >= 50 ? (
                <ShieldAlert className="h-[18px] w-[18px] text-amber-400" />
              ) : (
                <Shield className="h-[18px] w-[18px] text-red-400" />
              )}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Safety</p>
              <p className={`text-2xl font-bold ${
                safetyScore >= 80 ? "text-emerald-400" : safetyScore >= 50 ? "text-amber-400" : "text-red-400"
              }`}>
                {safetyScore}
              </p>
              <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                {errorCount > 0 ? (
                  <span className="text-red-400">{errorCount} erros</span>
                ) : (
                  <span className="text-emerald-400">Sem erros</span>
                )}
                {botOnline && (
                  <span className="ml-1.5 text-emerald-400">• Online</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── GROWTH CHART ─── */}
      <Card className="card-hover fade-up fade-up-5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary/60" />
            Crescimento — Últimos 30 dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            {growthData.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8">
                  <Users className="h-7 w-7 text-primary/50" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/80">Dados insuficientes</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Aguarde mais coletas para ver o crescimento.</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(252, 62%, 60%)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="hsl(252, 62%, 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(240, 8%, 12%)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="hsl(220, 10%, 35%)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(220, 10%, 35%)" fontSize={10} tickLine={false} axisLine={false} width={50} tickFormatter={formatK} />
                  <Tooltip
                    contentStyle={{
                      fontFamily: "'JetBrains Mono', monospace",
                      background: "hsl(240, 12%, 6%)",
                      border: "1px solid hsl(240, 8%, 14%)",
                      borderRadius: "10px",
                      color: "hsl(220, 14%, 90%)",
                      fontSize: "12px",
                      boxShadow: "0 8px 32px -8px hsl(0 0% 0% / 0.5)",
                    }}
                    labelStyle={{ color: "hsl(220, 10%, 45%)", marginBottom: 4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="followers"
                    stroke="hsl(252, 62%, 60%)"
                    fill="url(#purpleGrad)"
                    strokeWidth={2}
                    name="Seguidores"
                    dot={false}
                    activeDot={{ r: 4, fill: "hsl(252, 62%, 60%)", stroke: "hsl(240, 12%, 6%)", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── REMOTE CONTROL ─── */}
      <div className="fade-up fade-up-5">
        <BotRemoteControl />
      </div>

      {/* ─── BOTTOM SECTION: Recent Actions + Day Summary ─── */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Últimas Ações */}
        <Card className="card-hover fade-up fade-up-6 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary/60" />
              Últimas Ações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/8">
                  <Plug className="h-6 w-6 text-primary/50" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/80">Nenhuma ação registrada</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Conecte a extensão Bridge para começar!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {recentActions.map((action) => {
                  const Icon = ACTION_ICONS[action.action_type] || Zap;
                  const badgeClass = ACTION_BADGE_CLASS[action.action_type] || "badge-skip";
                  return (
                    <div
                      key={action.id}
                      className="flex items-center justify-between rounded-lg bg-secondary/30 hover:bg-secondary/50 px-3 py-2.5 row-fade-in transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${badgeClass}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-medium capitalize">{action.action_type.replace("_", " ")}</span>
                            {action.status === "failed" && (
                              <span className="text-[10px] font-semibold text-destructive">falhou</span>
                            )}
                          </div>
                          <p className="font-mono text-[11px] text-muted-foreground/50">
                            {action.target_username ? `@${action.target_username}` : "—"}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground/40 whitespace-nowrap">
                        {formatDistanceToNow(new Date(action.executed_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo do Dia */}
        <Card className="card-hover fade-up fade-up-6 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400/60" />
              Resumo do Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3.5">
              {summaryItems.map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-3.5 w-3.5 text-muted-foreground/50" />
                      <span className="text-[13px] text-foreground/80">{item.label}</span>
                    </div>
                    <CountUp value={item.value} className="font-semibold mono text-[13px]" />
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary/60 stat-bar">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-700 ease-out`}
                      style={{ width: `${(item.value / maxSummary) * 100}%`, opacity: 0.7 }}
                    />
                  </div>
                </div>
              ))}
              {/* Total */}
              <div className="section-divider mt-4 mb-0" />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Total</span>
                <span className="text-lg font-bold gradient-text mono">{totalActions}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Exportar com memoização para evitar re-renders desnecessários
export default memo(Index);
