import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Settings, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<any>(null);
  const [automationPaused, setAutomationPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setSettings(data);
        setAutomationPaused(data.automation_paused ?? false);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const toggleAutomation = async () => {
    if (!user) return;
    const newVal = !automationPaused;
    setAutomationPaused(newVal);
    await supabase.from("user_settings").update({
      automation_paused: newVal,
      automation_paused_at: newVal ? new Date().toISOString() : null,
    }).eq("user_id", user.id);
    toast({ title: newVal ? "Automação pausada" : "Automação retomada" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Ajuste sua automação e preferências</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Automação Global
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Automação ativa</Label>
              <p className="text-sm text-muted-foreground">Pausar ou retomar toda automação</p>
            </div>
            <Switch checked={!automationPaused} onCheckedChange={toggleAutomation} />
          </div>
          {automationPaused && settings?.automation_paused_at && (
            <p className="text-xs text-muted-foreground">
              Pausada desde: {new Date(settings.automation_paused_at).toLocaleString("pt-BR")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Configurações de Delays</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs text-muted-foreground bg-secondary/50 rounded p-3 overflow-auto">
            {settings?.settings_json ? JSON.stringify(settings.settings_json, null, 2) : "Nenhuma configuração personalizada."}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
