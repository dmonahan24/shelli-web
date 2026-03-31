// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsKpiCards } from "@/components/analytics/analytics-kpi-cards";
import { ConcretePouredOverTimeChart } from "@/components/analytics/concrete-poured-over-time-chart";
import { ProjectStatusBreakdownChart } from "@/components/analytics/project-status-breakdown-chart";
import { RecentActivityFeed } from "@/components/analytics/recent-activity-feed";
import { TopProjectsChart } from "@/components/analytics/top-projects-chart";
import { AnalyticsPendingPage } from "@/components/navigation/page-pending";
import { READ_ROUTE_CACHE_OPTIONS } from "@/lib/router-cache";
import { getCompanyAnalyticsOverviewServerFn } from "@/server/analytics/get-company-analytics-overview";

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
  ...READ_ROUTE_CACHE_OPTIONS,
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
      <div className="grid gap-6 xl:grid-cols-2">
        <ConcretePouredOverTimeChart data={data.charts.concretePouredOverTime} />
        <ProjectStatusBreakdownChart data={data.charts.projectStatusBreakdown} />
      </div>
      <TopProjectsChart data={data.charts.topProjectsByConcrete} />
      <RecentActivityFeed items={data.recentFieldActivity} />
    </div>
  );
}
