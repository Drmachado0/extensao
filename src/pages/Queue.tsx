import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ListTodo, Pause, Play, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function QueuePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActions = async () => {
    if (!user) return;
    const { data } = await supabase.from("scheduled_actions").select("*").eq("user_id", user.id).order("scheduled_time", { ascending: true });
    setActions(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchActions(); }, [user]);

  const toggleAction = async (id: string, isActive: boolean) => {
    await supabase.from("scheduled_actions").update({ is_active: !isActive }).eq("id", id);
    toast({ title: isActive ? "Ação pausada" : "Ação retomada" });
    fetchActions();
  };

  const deleteAction = async (id: string) => {
    await supabase.from("scheduled_actions").delete().eq("id", id);
    toast({ title: "Ação removida" });
    fetchActions();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Fila de Ações</h1>
        <p className="text-muted-foreground">Gerencie suas ações agendadas</p>
      </div>

      <Card className="glass-card">
        <CardContent className="pt-6">
          {loading ? (
            <div className="h-40 animate-pulse rounded bg-secondary" />
          ) : actions.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <ListTodo className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma ação agendada.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Função</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Repetir</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actions.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.function_label || a.function_name}</TableCell>
                    <TableCell>{a.scheduled_time}</TableCell>
                    <TableCell>{a.repeat_daily ? "Diário" : "Único"}</TableCell>
                    <TableCell>
                      <Badge variant={a.is_active ? "default" : "secondary"} className={a.is_active ? "gradient-primary text-xs" : "text-xs"}>
                        {a.is_active ? "Ativo" : "Pausado"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => toggleAction(a.id, a.is_active)}>
                          {a.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteAction(a.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
