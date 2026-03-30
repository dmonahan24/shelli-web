import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProjectsTableSkeleton() {
  return (
    <Card className="rounded-[28px] border-border/80 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-48" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-2xl" />
        ))}
      </CardContent>
    </Card>
  );
}
