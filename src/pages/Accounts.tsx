import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Instagram, Plus, Power } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AccountsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    if (!user) return;
    const { data } = await supabase.from("instagram_accounts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setAccounts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAccounts(); }, [user]);

  const toggleActive = async (id: string, currentActive: boolean) => {
    await supabase.from("instagram_accounts").update({ is_active: !currentActive }).eq("id", id);
    toast({ title: currentActive ? "Conta desativada" : "Conta ativada" });
    fetchAccounts();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contas Instagram</h1>
          <p className="text-muted-foreground">Gerencie suas contas conectadas</p>
        </div>
        <Button className="gradient-primary"><Plus className="mr-2 h-4 w-4" /> Adicionar Conta</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Card key={i} className="glass-card h-40 animate-pulse" />)}
        </div>
      ) : accounts.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center py-12">
            <Instagram className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma conta conectada ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <Card key={acc.id} className={`glass-card ${acc.is_active ? "border-primary/40" : ""}`}>
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center">
                  <Instagram className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">@{acc.ig_username}</CardTitle>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={acc.is_active ? "default" : "secondary"} className={acc.is_active ? "gradient-primary text-xs" : "text-xs"}>
                      {acc.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div><span className="text-muted-foreground">Followers:</span> <span className="font-medium">{acc.followers_count?.toLocaleString() ?? "—"}</span></div>
                  <div><span className="text-muted-foreground">Following:</span> <span className="font-medium">{acc.following_count?.toLocaleString() ?? "—"}</span></div>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => toggleActive(acc.id, acc.is_active)}>
                  <Power className="mr-2 h-3 w-3" /> {acc.is_active ? "Desativar" : "Ativar"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
