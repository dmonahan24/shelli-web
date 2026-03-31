import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function ScheduleRiskBadge({ level }: { level: "low" | "medium" | "high" }) {
  const className =
    level === "high"
      ? "bg-red-100 text-red-900"
      : level === "medium"
        ? "bg-amber-100 text-amber-900"
        : "bg-emerald-100 text-emerald-900";

  return <Badge className={className}>{level} risk</Badge>;
}

export function ProjectAnalyticsHeader({
  name,
  status,
  percentComplete,
  scheduleRisk,
}: {
  name: string;
  status: string;
  percentComplete: number;
  scheduleRisk: "low" | "medium" | "high";
}) {
  return (
    <Card className="border-border/70">
      <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">Project analytics</p>
          <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{status.replaceAll("_", " ")}</Badge>
          <Badge variant="outline">{percentComplete.toFixed(1)}% complete</Badge>
          <ScheduleRiskBadge level={scheduleRisk} />
        </div>
      </CardContent>
    </Card>
  );
}
