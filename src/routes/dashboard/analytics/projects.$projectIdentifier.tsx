// @ts-nocheck
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { AnalyticsKpiCards } from "@/components/analytics/analytics-kpi-cards";
import { AttachmentTimelineChart } from "@/components/analytics/attachment-timeline-chart";
import { MixTypeDistributionChart } from "@/components/analytics/mix-type-distribution-chart";
import { ProjectAnalyticsHeader } from "@/components/analytics/project-analytics-header";
import { ProjectProgressChart } from "@/components/analytics/project-progress-chart";
import { RecentActivityFeed } from "@/components/analytics/recent-activity-feed";
import { WeeklyPoursChart } from "@/components/analytics/weekly-pours-chart";
import { projectRouteParamsSchema } from "@/lib/validation/project-list";
import { resolveProjectRouteServerFn } from "@/server/navigation/resolve-project-route";
import { getProjectAnalyticsServerFn } from "@/server/analytics/get-project-analytics";

function defaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 120);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export const Route = createFileRoute("/dashboard/analytics/projects/$projectIdentifier")({
  loader: async ({ params }) => {
    const parsedParams = projectRouteParamsSchema.parse(params);
    const resolved = await resolveProjectRouteServerFn({ data: parsedParams });

    if (!resolved) {
      throw notFound();
    }

    if (!resolved.isCanonical) {
      throw redirect({
        to: "/dashboard/analytics/projects/$projectIdentifier",
        params: resolved.canonicalParams,
      });
    }

    return getProjectAnalyticsServerFn({
      data: {
        projectId: resolved.project.id,
        dateRange: defaultDateRange(),
      },
    });
  },
  component: ProjectAnalyticsPage,
});

function ProjectAnalyticsPage() {
  const data = Route.useLoaderData();

  if (!data) {
    return <p className="text-sm text-muted-foreground">Project analytics are unavailable.</p>;
  }

  return (
    <div className="space-y-6">
      <ProjectAnalyticsHeader
        name={data.project.name}
        status={data.project.status}
        percentComplete={data.project.percentComplete}
        scheduleRisk={data.project.scheduleRisk}
      />
      <AnalyticsKpiCards
        items={[
          { label: "Total Concrete Poured", value: `${data.kpis.totalConcretePoured.toFixed(0)} yds` },
          { label: "Estimated Total", value: `${data.kpis.estimatedTotalConcrete.toFixed(0)} yds` },
          { label: "Remaining Concrete", value: `${data.kpis.remainingConcrete.toFixed(0)} yds` },
          { label: "Average Pour Size", value: `${data.kpis.averagePourSize.toFixed(1)} yds` },
        ]}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <ProjectProgressChart data={data.charts.cumulativeProgress} />
        <WeeklyPoursChart data={data.charts.weeklyPours} />
        <MixTypeDistributionChart data={data.charts.mixTypeDistribution} />
        <AttachmentTimelineChart data={data.charts.attachmentTimeline} />
      </div>
      <RecentActivityFeed items={data.recentActivity} />
    </div>
  );
}
