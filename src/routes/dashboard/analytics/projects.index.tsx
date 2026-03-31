// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { PendingLink } from "@/components/navigation/pending-link";
import { AnalyticsPendingPage } from "@/components/navigation/page-pending";
import { getProjectRouteParams } from "@/lib/project-paths";
import { READ_ROUTE_CACHE_OPTIONS } from "@/lib/router-cache";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listProjectsServerFn } from "@/server/projects/list-projects";

export const Route = createFileRoute("/dashboard/analytics/projects/")({
  ...READ_ROUTE_CACHE_OPTIONS,
  loader: async () =>
    listProjectsServerFn({
      data: {
        page: 1,
        pageSize: 50,
      },
    }),
  pendingComponent: AnalyticsPendingPage,
  component: ProjectAnalyticsIndexPage,
});

function ProjectAnalyticsIndexPage() {
  const data = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Analytics</p>
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.rows.map((project) => (
          <PendingLink
            key={project.id}
            preload="viewport"
            to="/dashboard/analytics/projects/$projectIdentifier"
            params={getProjectRouteParams(project)}
          >
            <Card className="border-border/70 transition hover:border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="size-4" />
                  {project.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{project.address}</p>
                <p className="mt-2 text-sm font-medium">
                  {project.totalConcretePoured.toLocaleString()} / {project.estimatedTotalConcrete.toLocaleString()} yds
                </p>
              </CardContent>
            </Card>
          </PendingLink>
        ))}
      </div>
    </div>
  );
}
