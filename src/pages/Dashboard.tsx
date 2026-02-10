import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header + Account Selector + Bot Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu crescimento</p>
        </div>
        <div className="flex items-center gap-3">
          {d.accounts.length > 1 && (
            <Select value={d.selectedAccountId} onValueChange={d.setSelectedAccountId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecionar conta" />
              </SelectTrigger>
              <SelectContent>
                {d.accounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>@{a.ig_username}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
      </div>

      {/* No account state */}
      {!d.selectedAccountId && d.accounts.length === 0 && (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma conta conectada</h3>
            <p className="text-muted-foreground mb-4">Adicione uma conta Instagram nas Configurações para começar.</p>
          </CardContent>
        </Card>
      )}

      {d.selectedAccountId && (
        <>
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
        </>
      )}
    </div>
  );
}
