import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveAccount } from "@/hooks/useActiveAccount";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { TrendingUp, CalendarDays, Star, Users, Grid3X3, UserPlus, ArrowRight } from "lucide-react";
import { format, subDays, startOfWeek, addDays, getDay, differenceInWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";

// --- Types ---
interface GrowthPoint {
  date: string;
  followers: number;
  following: number;
}

interface ActionDay {
  date: string;
  follow: number;
  unfollow: number;
  like: number;
  comment: number;
}

const PERIODS = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
  { label: "6m", value: 180 },
  { label: "1a", value: 365 },
];

const CHART_TOOLTIP_STYLE = {
  fontFamily: "'JetBrains Mono', monospace",
  background: "hsl(240, 10%, 8%)",
  border: "1px solid hsl(240, 8%, 16%)",
  borderRadius: "10px",
  color: "hsl(220, 14%, 90%)",
  fontSize: "12px",
  boxShadow: "0 8px 32px -8px hsl(0 0% 0% / 0.5)",
};

const AXIS_STROKE = "hsl(220, 10%, 35%)";
const GRID_STROKE = "hsl(240, 8%, 12%)";

const Growth = () => {
  const { user } = useAuth();
  const { activeAccountId } = useActiveAccount();
  const [period, setPeriod] = useState(30);
  const [growthData, setGrowthData] = useState<GrowthPoint[]>([]);
  const [actionData, setActionData] = useState<ActionDay[]>([]);
  const [heatmapData, setHeatmapData] = useState<Map<string, number>>(new Map());
  const [followBackData, setFollowBackData] = useState({
    followsSent: 0,
    followersGained: 0,
    rate: 0,
    loading: true,
  });

  const fetchData = useCallback(async () => {
    if (!user || !activeAccountId) return;
    const since = subDays(new Date(), period).toISOString();

    const [growthRes, actionsRes] = await Promise.all([
      supabase
        .from("growth_stats")
        .select("followers_count, following_count, recorded_at")
        .eq("ig_account_id", activeAccountId)
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: true }),
      supabase
        .from("daily_action_summary")
        .select("day, action_type, success_count")
        .eq("ig_account_id", activeAccountId)
        .gte("day", since.slice(0, 10)),
    ]);

    if (growthRes.data && growthRes.data.length > 0) {
      const byDay = new Map<string, { followers: number; following: number }>();
      growthRes.data.forEach((s) => {
        const day = format(new Date(s.recorded_at!), "dd/MM");
        byDay.set(day, { followers: s.followers_count ?? 0, following: s.following_count ?? 0 });
      });
      setGrowthData(Array.from(byDay.entries()).map(([date, v]) => ({ date, ...v })));
    } else {
      setGrowthData([]);
    }

    if (actionsRes.data && actionsRes.data.length > 0) {
      const byDay = new Map<string, ActionDay>();
      actionsRes.data.forEach((r) => {
        const day = format(new Date(r.day!), "dd/MM");
        if (!byDay.has(day)) byDay.set(day, { date: day, follow: 0, unfollow: 0, like: 0, comment: 0 });
        const entry = byDay.get(day)!;
        const count = Number(r.success_count) || 0;
        if (r.action_type === "follow") entry.follow += count;
        else if (r.action_type === "unfollow") entry.unfollow += count;
        else if (r.action_type === "like") entry.like += count;
        else if (r.action_type === "comment") entry.comment += count;
      });
      setActionData(Array.from(byDay.values()));
    } else {
      setActionData([]);
    }
    
    // Heatmap data (always 90 days)
    const heatSince = subDays(new Date(), 90).toISOString().slice(0, 10);
    const { data: heatRes } = await supabase
      .from("daily_action_summary")
      .select("day, success_count")
      .eq("ig_account_id", activeAccountId)
      .gte("day", heatSince);

    const heatMap = new Map<string, number>();
    if (heatRes) {
      heatRes.forEach((r) => {
        const day = r.day as string;
        heatMap.set(day, (heatMap.get(day) ?? 0) + (Number(r.success_count) || 0));
      });
    }
    setHeatmapData(heatMap);
  }, [user, activeAccountId, period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Follow-back rate (always 7 days)
  useEffect(() => {
    const fetchFollowBack = async () => {
      if (!activeAccountId) return;
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

      const [followsRes, growthRes] = await Promise.all([
        supabase
          .from("action_log")
          .select("id", { count: "exact", head: true })
          .eq("ig_account_id", activeAccountId)
          .eq("action_type", "follow")
          .eq("status", "success")
          .gte("executed_at", sevenDaysAgo),
        supabase
          .from("growth_stats")
          .select("followers_count, recorded_at")
          .eq("ig_account_id", activeAccountId)
          .gte("recorded_at", sevenDaysAgo)
          .order("recorded_at", { ascending: true }),
      ]);

      const followsSent = followsRes.count ?? 0;
      const growthData = growthRes.data ?? [];

      let followersGained = 0;
      if (growthData.length >= 2) {
        followersGained = Math.max(
          0,
          (growthData[growthData.length - 1].followers_count ?? 0) - (growthData[0].followers_count ?? 0)
        );
      }

      const rate = followsSent > 0 ? Math.round((followersGained / followsSent) * 100) : 0;

      setFollowBackData({
        followsSent,
        followersGained,
        rate: Math.min(rate, 100),
        loading: false,
      });
    };

    fetchFollowBack();
  }, [activeAccountId]);

  const stats = useMemo(() => {
    if (growthData.length < 2) {
      const f = growthData[0]?.followers ?? 0;
      const fo = growthData[0]?.following ?? 1;
      return { gained: 0, avgDaily: 0, bestDay: "—", ratio: (f / (fo || 1)).toFixed(2) };
    }

    const first = growthData[0];
    const last = growthData[growthData.length - 1];
    const gained = last.followers - first.followers;
    const avgDaily = gained / growthData.length;

    let bestDay = "—";
    let bestGain = 0;
    for (let i = 1; i < growthData.length; i++) {
      const gain = growthData[i].followers - growthData[i - 1].followers;
      if (gain > bestGain) { bestGain = gain; bestDay = growthData[i].date; }
    }

    const ratio = last.following > 0 ? (last.followers / last.following).toFixed(2) : "∞";

    return { gained, avgDaily: Math.round(avgDaily * 10) / 10, bestDay: bestDay + ` (+${bestGain})`, ratio };
  }, [growthData]);

  return (
    <div className="space-y-6 page-enter">
      {/* Header + Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Crescimento</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Análise detalhada do período</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-secondary/60 p-1 ring-1 ring-border/50">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/40 card-hover fade-up fade-up-1 relative overflow-hidden">
          <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full ${stats.gained >= 0 ? "bg-success/5" : "bg-destructive/5"} blur-2xl`} />
          <CardContent className="flex items-center gap-4 p-5">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stats.gained >= 0 ? "bg-success/10 ring-1 ring-success/15" : "bg-destructive/10 ring-1 ring-destructive/15"}`}>
              <TrendingUp className={`h-4 w-4 ${stats.gained >= 0 ? "text-success" : "text-destructive"}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Novos Seguidores</p>
              <p className={`text-2xl font-bold mono ${stats.gained >= 0 ? "text-success" : "text-destructive"}`}>
                {stats.gained >= 0 ? "+" : ""}{stats.gained}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 card-hover fade-up fade-up-2 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-primary/5 blur-2xl" />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/15">
              <CalendarDays className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Média Diária</p>
              <p className="text-2xl font-bold mono">{stats.avgDaily}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 card-hover fade-up fade-up-3 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-warning/5 blur-2xl" />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning/10 ring-1 ring-warning/15">
              <Star className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Melhor Dia</p>
              <p className="text-lg font-bold mono">{stats.bestDay}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 card-hover fade-up fade-up-4 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-accent/5 blur-2xl" />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/15">
              <Users className="h-4 w-4 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Follow Ratio</p>
              <p className="text-2xl font-bold mono">{stats.ratio}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN AREA CHART */}
      <Card className="border-border/40 card-hover fade-up fade-up-5">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Seguidores & Seguindo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56 md:h-80">
            {growthData.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <TrendingUp className="h-7 w-7 text-primary/60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Aguarde a primeira coleta</p>
                  <p className="text-xs text-muted-foreground mt-1">Os dados de crescimento aparecerão aqui após a extensão Bridge coletar informações.</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="gFollowers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(252, 62%, 60%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(252, 62%, 60%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gFollowing" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(215, 20%, 55%)" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(215, 20%, 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke={AXIS_STROKE} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke={AXIS_STROKE} fontSize={10} tickLine={false} axisLine={false} width={50} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <Area type="monotone" dataKey="followers" stroke="hsl(252, 62%, 60%)" fill="url(#gFollowers)" strokeWidth={2} name="Seguidores" dot={false} activeDot={{ r: 4 }} />
                  <Area type="monotone" dataKey="following" stroke="hsl(215, 20%, 55%)" fill="url(#gFollowing)" strokeWidth={1.5} strokeDasharray="4 2" name="Seguindo" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* STACKED BAR CHART */}
      <Card className="border-border/40 card-hover fade-up fade-up-6">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Ações por Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56 md:h-72">
            {actionData.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
                  <Star className="h-7 w-7 text-warning/60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Nenhuma ação registrada</p>
                  <p className="text-xs text-muted-foreground mt-1">As ações diárias aparecerão aqui quando o bot começar a operar.</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actionData}>
                  <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke={AXIS_STROKE} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke={AXIS_STROKE} fontSize={10} tickLine={false} axisLine={false} width={40} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <Bar dataKey="follow" stackId="a" fill="hsl(152, 72%, 48%)" name="Follows" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="unfollow" stackId="a" fill="hsl(0, 72%, 55%)" name="Unfollows" />
                  <Bar dataKey="like" stackId="a" fill="hsl(330, 70%, 55%)" name="Likes" />
                  <Bar dataKey="comment" stackId="a" fill="hsl(252, 62%, 60%)" name="Comments" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ACTIVITY HEATMAP */}
      <ActivityHeatmap data={heatmapData} />

      {/* FOLLOW-BACK RATE */}
      <Card className="border-border/40 card-hover">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            Taxa de Follow-back (7 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {followBackData.loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Stats Row */}
              <div className="flex items-center justify-around gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Follows enviados</p>
                  <p className="text-2xl font-bold mono">{followBackData.followsSent}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Followers ganhos</p>
                  <p className="text-2xl font-bold mono text-success">{followBackData.followersGained}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Taxa estimada</span>
                  <span className={`font-bold mono ${
                    followBackData.rate >= 15 ? "text-success" :
                    followBackData.rate >= 5 ? "text-warning" : "text-destructive"
                  }`}>
                    {followBackData.rate}%
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-secondary/60 overflow-hidden">
                  <div
                  className={`h-full rounded-full transition-all duration-700 ${
                      followBackData.rate >= 15 ? "bg-success" :
                      followBackData.rate >= 5 ? "bg-warning" : "bg-destructive"
                    }`}
                    style={{ width: `${Math.min(followBackData.rate, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0%</span>
                  <span>5%</span>
                  <span>15%+</span>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground text-center">
                * Estimativa baseada em seguidores ganhos vs follows enviados nos últimos 7 dias
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};


// --- Activity Heatmap Component ---
const DAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"]; // Sun=0 to Sat=6

function getIntensityClass(count: number): string {
  if (count === 0) return "bg-secondary/30";
  if (count <= 5) return "bg-primary/20";
  if (count <= 15) return "bg-primary/40";
  if (count <= 30) return "bg-primary/60";
  return "bg-primary/80";
}

function ActivityHeatmap({ data }: { data: Map<string, number> }) {
  const { weeks, months } = useMemo(() => {
    const today = new Date();
    const start = startOfWeek(subDays(today, 90), { weekStartsOn: 1 }); // Monday
    const totalWeeks = differenceInWeeks(today, start) + 1;

    const weeks: { date: Date; count: number; key: string }[][] = [];
    const months: { label: string; col: number }[] = [];
    let lastMonth = -1;

    for (let w = 0; w < totalWeeks; w++) {
      const week: { date: Date; count: number; key: string }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(start, w * 7 + d);
        if (date > today) {
          week.push({ date, count: -1, key: `${w}-${d}` }); // future
        } else {
          const key = format(date, "yyyy-MM-dd");
          week.push({ date, count: data.get(key) ?? 0, key });
        }

        // Track month labels
        if (d === 0) {
          const month = date.getMonth();
          if (month !== lastMonth) {
            months.push({ label: format(date, "MMM", { locale: ptBR }), col: w });
            lastMonth = month;
          }
        }
      }
      weeks.push(week);
    }

    return { weeks, months };
  }, [data]);

  // Day labels mapped to Mon-start: Mon=0, Tue=1, ..., Sun=6
  const dayLabels = ["S", "T", "Q", "Q", "S", "S", "D"];

  return (
    <Card className="border-border/40 card-hover">
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Grid3X3 className="h-4 w-4 text-primary" />
          📊 Mapa de Atividade
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {/* Month labels */}
          <div className="flex ml-6 mb-1">
            {months.map((m, i) => (
              <div
                key={i}
                className="text-[10px] text-muted-foreground"
                style={{ position: "relative", left: `${m.col * 14}px`, marginRight: i < months.length - 1 ? `${((months[i+1]?.col ?? m.col) - m.col) * 14 - 24}px` : 0 }}
              >
                {m.label}
              </div>
            ))}
          </div>

          <div className="flex gap-0">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] mr-1.5 pt-0">
              {dayLabels.map((label, i) => (
                <div key={i} className="h-[12px] w-4 text-[9px] text-muted-foreground flex items-center justify-end pr-0.5">
                  {i % 2 === 0 ? label : ""}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day) => {
                    if (day.count < 0) {
                      return <div key={day.key} className="h-[12px] w-[12px]" />;
                    }
                    return (
                      <UITooltip key={day.key}>
                        <TooltipTrigger asChild>
                          <div
                            className={`h-[12px] w-[12px] rounded-[3px] transition-colors ${getIntensityClass(day.count)}`}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">{format(day.date, "dd MMM yyyy", { locale: ptBR })}</p>
                          <p className="text-muted-foreground">{day.count} ações</p>
                        </TooltipContent>
                      </UITooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-3 justify-end">
            <span className="text-[10px] text-muted-foreground mr-1">Menos</span>
            {[0, 3, 10, 20, 35].map((v) => (
              <div key={v} className={`h-[10px] w-[10px] rounded-[2px] ${getIntensityClass(v)}`} />
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">Mais</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default Growth;
