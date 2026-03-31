import * as React from "react";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { AnalyticsKpiCards } from "@/components/analytics/analytics-kpi-cards";
import { RecentActivityFeed } from "@/components/analytics/recent-activity-feed";
import { ProjectsDashboardView } from "@/components/dashboard/projects-dashboard-view";
import { DocumentationTaskCard } from "@/components/field/documentation-task-card";
import { FieldActionGrid } from "@/components/field/field-action-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { READ_ROUTE_CACHE_OPTIONS } from "@/lib/router-cache";
import {
  getDashboardHomeCriticalDataServerFn,
  getDashboardHomeDeferredDataServerFn,
} from "@/server/dashboard/get-home-page-data";

const dashboardRouteApi = getRouteApi("/dashboard");

type DashboardHomeDeferredData = Awaited<
  ReturnType<typeof getDashboardHomeDeferredDataServerFn>
>;

export const Route = createFileRoute("/dashboard/")({
  ...READ_ROUTE_CACHE_OPTIONS,
  loader: async () => getDashboardHomeCriticalDataServerFn(),
  pendingComponent: DashboardPendingPage,
  component: DashboardHomePage,
});

function DashboardPendingPage() {
  return <div className="min-h-40" />;
}

function DashboardHomePage() {
  const user = dashboardRouteApi.useRouteContext({
    select: (context) => context.user,
  });
  const criticalData = Route.useLoaderData();
  const [deferredData, setDeferredData] = React.useState<DashboardHomeDeferredData | null>(null);

  React.useEffect(() => {
    let isCancelled = false;

    void (async () => {
      const result = await getDashboardHomeDeferredDataServerFn();
      if (!isCancelled) {
        setDeferredData(result);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

  if (user.role === "field_supervisor") {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Dashboard</p>
          <h1 className="text-2xl font-semibold tracking-tight">Field supervisor view</h1>
        </div>
        <FieldActionGrid project={criticalData.fieldHome?.projects[0]} />
        <div className="space-y-3">
          {criticalData.fieldHome?.documentationTasks.map((task: any) => (
            <DocumentationTaskCard key={`${task.title}-${task.description}`} {...task} />
          ))}
        </div>
        <RecentActivitySection items={deferredData?.fieldHome.recentActivity ?? []} />
      </div>
    );
  }

  if (user.role === "viewer") {
    return (
      <div className="space-y-6">
        <ProjectsDashboardView
          projects={criticalData.projects?.rows ?? []}
          title="Project summaries"
          subtitle="Read-only visibility into current construction work and recent operational activity."
          showActions={false}
        />
        <RecentActivitySection items={deferredData?.fieldHome.recentActivity ?? []} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {deferredData?.analytics ? (
        <AnalyticsKpiCards
          items={[
            { label: "Active Projects", value: String(deferredData.analytics.kpis.activeProjects) },
            {
              label: "Concrete This Month",
              value: `${deferredData.analytics.kpis.totalConcretePouredThisMonth.toFixed(0)} yds`,
            },
            {
              label: "Upcoming Completions",
              value: String(deferredData.analytics.kpis.upcomingEstimatedCompletions),
            },
            {
              label: "Docs Completion",
              value: `${deferredData.analytics.kpis.documentationCompletionRate.toFixed(0)}%`,
            },
          ]}
        />
      ) : (
        <DashboardDeferredPlaceholder title="Performance Snapshot" />
      )}
      <ProjectsDashboardView
        projects={criticalData.projects?.rows ?? []}
        title={user.role === "project_manager" ? "Assigned projects" : "Projects"}
        subtitle="Track upcoming pours, project progress, and documentation health from one shared operating view."
        showActions
      />
      <RecentActivitySection items={deferredData?.fieldHome.recentActivity ?? []} />
    </div>
  );
}

function RecentActivitySection({
  items,
}: {
  items: Array<{
    actorName?: string | null;
    createdAt?: Date | string | null;
    eventType?: string | null;
    id: string;
    summary?: string | null;
  }>;
}) {
  if (items.length === 0) {
    return <DashboardDeferredPlaceholder title="Recent Activity" />;
  }

  return <RecentActivityFeed items={items} />;
}

function DashboardDeferredPlaceholder({ title }: { title: string }) {
  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Loading the latest dashboard summary...</p>
      </CardContent>
    </Card>
  );
}
