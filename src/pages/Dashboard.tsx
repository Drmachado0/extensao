import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, UserMinus, Heart, ListTodo, CheckCircle, Zap, Play } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { ActionProgressCard } from "@/components/dashboard/ActionProgressCard";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { ActionsChart } from "@/components/dashboard/ActionsChart";
import { RecentActionsTable } from "@/components/dashboard/RecentActionsTable";

export default function DashboardPage() {
  const d = useDashboardData();

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

        <StatusCard accountStatus={d.accountStatus} accountUsername={d.accountUsername} />
      </div>

      <ActionsChart chartData={d.chartData} />
      <RecentActionsTable recentLogs={d.recentLogs} />
    </div>
  );
}
