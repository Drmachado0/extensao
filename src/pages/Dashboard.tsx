import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserMinus, Heart, ListTodo, CheckCircle, Wifi, WifiOff, Play, Pause, TrendingUp, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useDashboardData } from "@/hooks/useDashboardData";

function ActionProgressCard({ label, icon: Icon, value, limit, color }: { label: string; icon: React.ElementType; value: number; limit: number; color: string }) {
  const pct = limit > 0 ? Math.min((value / limit) * 100, 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color }} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm text-muted-foreground">{value}/{limit}</span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}

const statusConfig: Record<string, { label: string; color: string; dotClass: string }> = {
  active: { label: "Ativa", color: "hsl(142, 71%, 45%)", dotClass: "bg-green-500" },
  paused: { label: "Pausada", color: "hsl(48, 96%, 53%)", dotClass: "bg-yellow-500" },
  rate_limited: { label: "Rate Limited", color: "hsl(25, 95%, 53%)", dotClass: "bg-orange-500" },
  blocked: { label: "Bloqueada", color: "hsl(0, 72%, 51%)", dotClass: "bg-red-500" },
  none: { label: "Nenhuma conta", color: "hsl(240, 5%, 65%)", dotClass: "bg-muted-foreground" },
};

export default function DashboardPage() {
  const d = useDashboardData();

  const status = statusConfig[d.accountStatus] || statusConfig.none;

  if (d.loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div><h1 className="text-2xl font-bold">Dashboard</h1><p className="text-muted-foreground">Carregando...</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 animate-pulse rounded-xl bg-secondary" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header + Bot Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu crescimento</p>
        </div>
        <Button
          size="lg"
          onClick={d.toggleBot}
          className={`gap-2 text-base font-semibold px-8 transition-all ${d.isRunning ? "bg-green-600 hover:bg-green-700 shadow-[0_0_20px_-4px_hsl(142,71%,45%,0.5)]" : "gradient-primary glow-primary"}`}
        >
          {d.isRunning ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400" />
              </span>
              Bot Ativo — Pausar
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              Iniciar Bot
            </>
          )}
        </Button>
      </div>

      {/* Row 1: 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ações Hoje */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Ações Hoje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ActionProgressCard label="Follow" icon={Users} value={d.todayFollows} limit={d.dailyFollowLimit} color="hsl(263, 70%, 50%)" />
            <ActionProgressCard label="Unfollow" icon={UserMinus} value={d.todayUnfollows} limit={d.dailyUnfollowLimit} color="hsl(0, 72%, 51%)" />
            <ActionProgressCard label="Like" icon={Heart} value={d.todayLikes} limit={d.dailyLikeLimit} color="hsl(217, 91%, 60%)" />
          </CardContent>
        </Card>

        {/* Card 2: Fila */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-primary" />
              Fila Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-3">{d.queuePending.total}</div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between"><span>Follow</span><span className="font-medium text-foreground">{d.queuePending.follow}</span></div>
              <div className="flex justify-between"><span>Unfollow</span><span className="font-medium text-foreground">{d.queuePending.unfollow}</span></div>
              <div className="flex justify-between"><span>Like</span><span className="font-medium text-foreground">{d.queuePending.like}</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Taxa de Sucesso */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Taxa de Sucesso (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{d.successRate}%</div>
            <p className="text-sm text-muted-foreground mt-1">{d.successActions7d} de {d.totalActions7d} ações</p>
            <Progress value={d.successRate} className="h-2 mt-3" />
          </CardContent>
        </Card>

        {/* Card 4: Status da Conta */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {d.accountStatus === "active" ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-muted-foreground" />}
              Status da Conta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-2">
              <span className={`h-3 w-3 rounded-full ${status.dotClass}`} style={d.accountStatus === "active" ? { boxShadow: "0 0 8px hsl(142,71%,45%,0.6)" } : undefined} />
              <span className="text-lg font-semibold" style={{ color: status.color }}>{status.label}</span>
            </div>
            {d.accountUsername && <p className="text-sm text-muted-foreground">@{d.accountUsername}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Chart: Ações por dia (30 dias) */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Ações por Dia (últimos 30 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {d.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={d.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 5%, 17%)" />
                <XAxis dataKey="date" stroke="hsl(240, 5%, 64.9%)" fontSize={11} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="hsl(240, 5%, 64.9%)" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "hsl(240, 10%, 6%)", border: "1px solid hsl(240, 5%, 17%)", borderRadius: "8px", color: "hsl(0, 0%, 98%)" }}
                  labelFormatter={(v) => `Data: ${v}`}
                />
                <Legend />
                <Line type="monotone" dataKey="follow" name="Follow" stroke="hsl(263, 70%, 50%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="unfollow" name="Unfollow" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="like" name="Like" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-12">Nenhum dado ainda.</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Actions Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Últimas Ações</CardTitle>
        </CardHeader>
        <CardContent>
          {d.recentLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Alvo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.recentLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-muted-foreground">{new Date(log.created_at).toLocaleString("pt-BR")}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{log.action_type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">@{log.target_username || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={log.status === "success" ? "default" : "destructive"}
                        className={`text-xs ${log.status === "success" ? "bg-green-500/15 text-green-400 border-green-500/30" : log.status === "skipped" ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" : ""}`}
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">Nenhuma ação registrada ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
