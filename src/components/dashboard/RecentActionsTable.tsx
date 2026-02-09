import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface RecentActionsTableProps {
  recentLogs: any[];
}

export function RecentActionsTable({ recentLogs }: RecentActionsTableProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Últimas Ações</CardTitle>
      </CardHeader>
      <CardContent>
        {recentLogs.length > 0 ? (
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
              {recentLogs.map((log: any) => (
                <TableRow key={log.id} className="animate-fade-in">
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
  );
}
