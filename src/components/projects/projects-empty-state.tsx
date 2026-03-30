import type { ReactNode } from "react";
import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ProjectsEmptyState({
  action,
}: {
  action?: ReactNode;
}) {
  return (
    <Card className="rounded-[28px] border-dashed border-border/80 bg-card/90">
      <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Building2 className="size-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">No projects yet</h2>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Add your first project to start tracking concrete placement progress,
            schedules, and field-ready records.
          </p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
