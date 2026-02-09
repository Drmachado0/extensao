import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Filter, Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FiltersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filters, setFilters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFilters = async () => {
    if (!user) return;
    const { data } = await supabase.from("filters").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setFilters(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchFilters(); }, [user]);

  const deleteFilter = async (id: string) => {
    await supabase.from("filters").delete().eq("id", id);
    toast({ title: "Filtro removido" });
    fetchFilters();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Filtros</h1>
          <p className="text-muted-foreground">Configure filtros avançados de segmentação</p>
        </div>
        <Button className="gradient-primary"><Plus className="mr-2 h-4 w-4" /> Novo Filtro</Button>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1,2].map(i => <Card key={i} className="glass-card h-32 animate-pulse" />)}
        </div>
      ) : filters.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center py-12">
            <Filter className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum filtro criado ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filters.map((f) => (
            <Card key={f.id} className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">{f.name}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => deleteFilter(f.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-muted-foreground bg-secondary/50 rounded p-3 overflow-auto">
                  {JSON.stringify(f.criteria, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
