import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MetricCardSkeleton() {
  return (
    <Card className="border-border/40">
      <CardContent className="flex items-center gap-4 p-5">
        <Skeleton className="h-10 w-10 rounded-lg bg-secondary/60" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-20 bg-secondary/60" />
          <Skeleton className="h-7 w-24 bg-secondary/60" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ChartSkeleton() {
  return (
    <Card className="border-border/40">
      <CardHeader>
        <Skeleton className="h-5 w-64 bg-secondary/60" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-72 w-full rounded-lg bg-secondary/60" />
      </CardContent>
    </Card>
  );
}

export function RecentActionsSkeleton() {
  return (
    <Card className="border-border/40">
      <CardHeader>
        <Skeleton className="h-5 w-32 bg-secondary/60" />
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg bg-secondary/40 px-3 py-2.5">
            <Skeleton className="h-8 w-8 rounded-md bg-secondary/60" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-24 bg-secondary/60" />
              <Skeleton className="h-3 w-16 bg-secondary/60" />
            </div>
            <Skeleton className="h-3 w-16 bg-secondary/60" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function SummarySkeleton() {
  return (
    <Card className="border-border/40">
      <CardHeader>
        <Skeleton className="h-5 w-32 bg-secondary/60" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20 bg-secondary/60" />
              <Skeleton className="h-4 w-8 bg-secondary/60" />
            </div>
            <Skeleton className="h-2 w-full rounded-full bg-secondary/60" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Card className="border-border/40 overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 space-y-3">
          <div className="flex gap-4 pb-2 border-b border-border/40">
            <Skeleton className="h-4 w-24 bg-secondary/60" />
            <Skeleton className="h-4 w-20 bg-secondary/60" />
            <Skeleton className="h-4 w-28 bg-secondary/60" />
            <Skeleton className="h-4 w-16 bg-secondary/60" />
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-1.5">
              <Skeleton className="h-4 w-24 bg-secondary/60" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded bg-secondary/60" />
                <Skeleton className="h-4 w-16 bg-secondary/60" />
              </div>
              <Skeleton className="h-4 w-28 bg-secondary/60" />
              <Skeleton className="h-5 w-14 rounded-full bg-secondary/60" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
