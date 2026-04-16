import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink } from "lucide-react";

interface ActionLog {
  id: string;
  created_at: string;
  action_type: string;
  target_username?: string | null;
  status: string;
}

interface RecentActionsTableProps {
  recentLogs: ActionLog[];
}

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
                <TableHead>Quando</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Alvo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLogs.map((log) => (
                <TableRow key={log.id} className="animate-fade-in">
                  <TableCell className="text-sm text-muted-foreground" title={new Date(log.created_at).toLocaleString("pt-BR")}>
                    {timeAgo(log.created_at)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{log.action_type}</Badge>
                  </TableCell>
                  <TableCell>
                    {log.target_username ? (
                      <a
                        href={`https://instagram.com/${log.target_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:text-primary transition-colors flex items-center gap-1"
                      >
                        @{log.target_username}
                        <ExternalLink className="h-3 w-3 opacity-40" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={log.status === "success" ? "default" : "destructive"}
                      className={`text-xs ${log.status === "success" ? "bg-success/15 text-success border-success/30" : log.status === "skipped" ? "bg-warning/15 text-warning border-warning/30" : ""}`}
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
