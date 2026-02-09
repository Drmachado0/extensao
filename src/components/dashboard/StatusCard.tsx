import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi, WifiOff } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; dotClass: string }> = {
  active: { label: "Ativa", color: "hsl(142, 71%, 45%)", dotClass: "bg-green-500" },
  paused: { label: "Pausada", color: "hsl(48, 96%, 53%)", dotClass: "bg-yellow-500" },
  rate_limited: { label: "Rate Limited", color: "hsl(25, 95%, 53%)", dotClass: "bg-orange-500" },
  blocked: { label: "Bloqueada", color: "hsl(0, 72%, 51%)", dotClass: "bg-red-500" },
  none: { label: "Nenhuma conta", color: "hsl(240, 5%, 65%)", dotClass: "bg-muted-foreground" },
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
          {accountStatus === "active" ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-muted-foreground" />}
          Status da Conta
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-2">
          <span className={`h-3 w-3 rounded-full ${status.dotClass}`} style={accountStatus === "active" ? { boxShadow: "0 0 8px hsl(142,71%,45%,0.6)" } : undefined} />
          <span className="text-lg font-semibold" style={{ color: status.color }}>{status.label}</span>
        </div>
        {accountUsername && <p className="text-sm text-muted-foreground">@{accountUsername}</p>}
      </CardContent>
    </Card>
  );
}
