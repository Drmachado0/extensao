import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ActionsChartProps {
  chartData: { date: string; follow: number; unfollow: number; like: number }[];
}

export function ActionsChart({ chartData }: ActionsChartProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Ações por Dia (últimos 30 dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
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
  );
}
