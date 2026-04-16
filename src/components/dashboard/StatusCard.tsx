import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi, WifiOff } from "lucide-react";

const statusConfig: Record<string, { label: string; textClass: string; dotClass: string }> = {
  active: { label: "Ativa", textClass: "text-success", dotClass: "bg-success" },
  paused: { label: "Pausada", textClass: "text-warning", dotClass: "bg-warning" },
  rate_limited: { label: "Rate Limited", textClass: "text-warning", dotClass: "bg-warning" },
  blocked: { label: "Bloqueada", textClass: "text-destructive", dotClass: "bg-destructive" },
  none: { label: "Nenhuma conta", textClass: "text-muted-foreground", dotClass: "bg-muted-foreground" },
};

interface StatusCardProps {
  accountStatus: string;
  accountUsername: string;
}

export function StatusCard({ accountStatus, accountUsername }: StatusCardProps) {
  const status = statusConfig[accountStatus] || statusConfig.none;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {accountStatus === "active" ? <Wifi className="h-4 w-4 text-success" /> : <WifiOff className="h-4 w-4 text-muted-foreground" />}
          Status da Conta
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-2">
          <span className={`h-3 w-3 rounded-full ${status.dotClass}`} />
          <span className={`text-lg font-semibold ${status.textClass}`}>{status.label}</span>
        </div>
        {accountUsername && <p className="text-sm text-muted-foreground">@{accountUsername}</p>}
      </CardContent>
    </Card>
  );
}
