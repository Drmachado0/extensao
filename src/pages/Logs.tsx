import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 20;

export default function LogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState("all");
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      let query = supabase
        .from("action_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filter !== "all") query = query.eq("action_type", filter);

      const { data } = await query;
      setLogs(data || []);
      setHasMore((data || []).length === PAGE_SIZE);
      setLoading(false);
    };
    fetch();
  }, [user, page, filter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Logs</h1>
          <p className="text-muted-foreground">Histórico completo de ações</p>
        </div>
        <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(0); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="follow">Follow</SelectItem>
            <SelectItem value="unfollow">Unfollow</SelectItem>
            <SelectItem value="like">Like</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="glass-card">
        <CardContent className="pt-6">
          {loading ? (
            <div className="h-40 animate-pulse rounded bg-secondary" />
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <ScrollText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum log encontrado.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Alvo</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{l.action_type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">@{l.target_username || "—"}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded ${l.result === "success" ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"}`}>
                          {l.result}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{new Date(l.created_at).toLocaleString("pt-BR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                </Button>
                <span className="text-sm text-muted-foreground">Página {page + 1}</span>
                <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => setPage(p => p + 1)}>
                  Próxima <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
