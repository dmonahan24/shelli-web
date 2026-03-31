// @ts-nocheck
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsKpiCards } from "@/components/analytics/analytics-kpi-cards";
import { RecentActivityFeed } from "@/components/analytics/recent-activity-feed";
import { AnalyticsPendingPage } from "@/components/navigation/page-pending";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SUMMARY_ROUTE_CACHE_OPTIONS } from "@/lib/router-cache";
import { getCompanyAnalyticsOverviewServerFn } from "@/server/analytics/get-company-analytics-overview";

const ConcretePouredOverTimeChart = React.lazy(() =>
  import("@/components/analytics/concrete-poured-over-time-chart").then((module) => ({
    default: module.ConcretePouredOverTimeChart,
  }))
);
const ProjectStatusBreakdownChart = React.lazy(() =>
  import("@/components/analytics/project-status-breakdown-chart").then((module) => ({
    default: module.ProjectStatusBreakdownChart,
  }))
);
const TopProjectsChart = React.lazy(() =>
  import("@/components/analytics/top-projects-chart").then((module) => ({
    default: module.TopProjectsChart,
  }))
);

function defaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 90);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export const Route = createFileRoute("/dashboard/analytics/")({
  ...SUMMARY_ROUTE_CACHE_OPTIONS,
  loader: async () =>
    getCompanyAnalyticsOverviewServerFn({
      data: {
        dateRange: defaultDateRange(),
        assignedOnly: false,
        status: "all",
      },
    }),
  pendingComponent: AnalyticsPendingPage,
  component: AnalyticsOverviewPage,
});

function AnalyticsOverviewPage() {
  const data = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Analytics</p>
        <h1 className="text-2xl font-semibold tracking-tight">Company overview</h1>
      </div>
      <AnalyticsKpiCards
        items={[
          { label: "Active Projects", value: String(data.kpis.activeProjects) },
          { label: "Completed Projects", value: String(data.kpis.completedProjects) },
          { label: "Total Concrete Poured", value: `${data.kpis.totalConcretePoured.toFixed(0)} yds` },
          { label: "This Month", value: `${data.kpis.totalConcretePouredThisMonth.toFixed(0)} yds` },
        ]}
      />
      <React.Suspense fallback={<AnalyticsChartsLoadingState />}>
        <div className="grid gap-6 xl:grid-cols-2">
          <ConcretePouredOverTimeChart data={data.charts.concretePouredOverTime} />
          <ProjectStatusBreakdownChart data={data.charts.projectStatusBreakdown} />
        </div>
        <TopProjectsChart data={data.charts.topProjectsByConcrete} />
      </React.Suspense>
      <RecentActivityFeed items={data.recentFieldActivity} />
    </div>
  );
}

function AnalyticsChartsLoadingState() {
  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-base">Loading charts</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Preparing the latest production charts for this company.
        </p>
      </CardContent>
    </Card>
  );
}
