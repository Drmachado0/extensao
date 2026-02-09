import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, UserMinus, Heart, Activity, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface MetricCard {
  title: string;
  value: number;
  icon: React.ElementType;
  change?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [recentActions, setRecentActions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const today = new Date().toISOString().slice(0, 10);

      const [followsRes, unfollowsRes, likesRes, growthRes, actionsRes] = await Promise.all([
        supabase.from("action_history").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("action_type", "follow").gte("created_at", today),
        supabase.from("action_history").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("action_type", "unfollow").gte("created_at", today),
        supabase.from("action_history").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("action_type", "like").gte("created_at", today),
        supabase.from("growth_stats").select("*").eq("user_id", user.id).order("date", { ascending: true }).limit(30),
        supabase.from("action_history").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);

      setMetrics([
        { title: "Follows Hoje", value: followsRes.count ?? 0, icon: Users },
        { title: "Unfollows Hoje", value: unfollowsRes.count ?? 0, icon: UserMinus },
        { title: "Likes Hoje", value: likesRes.count ?? 0, icon: Heart },
        { title: "Total de Ações", value: (followsRes.count ?? 0) + (unfollowsRes.count ?? 0) + (likesRes.count ?? 0), icon: Activity },
      ]);

      setGrowthData(
        (growthRes.data || []).map((d) => ({
          date: d.date,
          followers: d.followers_count ?? 0,
          following: d.following_count ?? 0,
        }))
      );

      setRecentActions(actionsRes.data || []);
    };

    fetchData();
  }, [user]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu crescimento</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.title} className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.title}</CardTitle>
              <m.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{m.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Growth Chart */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Crescimento de Followers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {growthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(263 70% 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(263 70% 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 17%)" />
                <XAxis dataKey="date" stroke="hsl(240 5% 64.9%)" fontSize={12} />
                <YAxis stroke="hsl(240 5% 64.9%)" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(240 10% 6%)", border: "1px solid hsl(240 5% 17%)", borderRadius: "8px" }} />
                <Area type="monotone" dataKey="followers" stroke="hsl(263 70% 50%)" fillOpacity={1} fill="url(#colorFollowers)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-12">Nenhum dado de crescimento ainda.</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Actions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActions.length > 0 ? (
            <div className="space-y-3">
              {recentActions.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${a.result === "success" ? "bg-green-500" : "bg-destructive"}`} />
                    <div>
                      <p className="text-sm font-medium">{a.action_type} → @{a.target_username}</p>
                      <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${a.result === "success" ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"}`}>
                    {a.result}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Nenhuma ação recente.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
