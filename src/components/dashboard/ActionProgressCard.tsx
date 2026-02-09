import { Progress } from "@/components/ui/progress";

interface ActionProgressCardProps {
  label: string;
  icon: React.ElementType;
  value: number;
  limit: number;
  color: string;
}

export function ActionProgressCard({ label, icon: Icon, value, limit, color }: ActionProgressCardProps) {
  const pct = limit > 0 ? Math.min((value / limit) * 100, 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color }} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm text-muted-foreground">{value}/{limit}</span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}
