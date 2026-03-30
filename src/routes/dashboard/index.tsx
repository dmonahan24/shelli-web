import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsKpiCards } from "@/components/analytics/analytics-kpi-cards";
import { RecentActivityFeed } from "@/components/analytics/recent-activity-feed";
import { DocumentationTaskCard } from "@/components/field/documentation-task-card";
import { FieldActionGrid } from "@/components/field/field-action-grid";
import { ProjectsDashboardView } from "@/components/dashboard/projects-dashboard-view";
import { ProjectsTableSkeleton } from "@/components/projects/projects-table-skeleton";
import { getCurrentPrincipalServerFn } from "@/server/auth/get-current-user";
import { getCompanyAnalyticsOverviewServerFn } from "@/server/analytics/get-company-analytics-overview";
import { getFieldHomeDataServerFn } from "@/server/field/get-field-home-data";
import { listProjectsServerFn } from "@/server/projects/list-projects";

export const Route = createFileRoute("/dashboard/")({
  loader: async () => {
    const principal = await getCurrentPrincipalServerFn();
    const projects = await listProjectsServerFn({
      data: {
        page: 1,
        pageSize: 5,
      },
    });
    const fieldHome = await getFieldHomeDataServerFn();
    const analytics =
      principal?.kind === "tenant_user" &&
      principal.role !== "field_supervisor" &&
      principal.role !== "viewer"
        ? await getCompanyAnalyticsOverviewServerFn({
            data: {
              dateRange: {
                from: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString().slice(0, 10),
                to: new Date().toISOString().slice(0, 10),
              },
              status: "all",
              assignedOnly: principal.role === "project_manager",
            },
          })
        : null;

    return { principal, projects, fieldHome, analytics };
  },
  pendingComponent: ProjectsTableSkeleton,
  component: DashboardHomePage,
});

function DashboardHomePage() {
  const { principal, projects, fieldHome, analytics } = Route.useLoaderData();

  if (principal?.kind !== "tenant_user") {
    return null;
  }

  if (principal.role === "field_supervisor") {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Dashboard</p>
          <h1 className="text-2xl font-semibold tracking-tight">Field supervisor view</h1>
        </div>
        <FieldActionGrid projectId={fieldHome.projects[0]?.id} />
        <div className="space-y-3">
          {fieldHome.documentationTasks.map((task: any) => (
            <DocumentationTaskCard key={`${task.title}-${task.description}`} {...task} />
          ))}
        </div>
        <RecentActivityFeed items={fieldHome.recentActivity} />
      </div>
    );
  }

  if (principal.role === "viewer") {
    return (
      <div className="space-y-6">
        <ProjectsDashboardView
          projects={projects.rows}
          title="Project summaries"
          subtitle="Read-only visibility into current construction work and recent operational activity."
          showActions={false}
        />
        <RecentActivityFeed items={fieldHome.recentActivity} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {analytics ? (
        <AnalyticsKpiCards
          items={[
            { label: "Active Projects", value: String(analytics.kpis.activeProjects) },
            { label: "Concrete This Month", value: `${analytics.kpis.totalConcretePouredThisMonth.toFixed(0)} yds` },
            { label: "Upcoming Completions", value: String(analytics.kpis.upcomingEstimatedCompletions) },
            { label: "Docs Completion", value: `${analytics.kpis.documentationCompletionRate.toFixed(0)}%` },
          ]}
        />
      ) : null}
      <ProjectsDashboardView
        projects={projects.rows}
        title={principal.role === "project_manager" ? "Assigned projects" : "Projects"}
        subtitle="Track upcoming pours, project progress, and documentation health from one shared operating view."
        showActions
      />
      <RecentActivityFeed items={fieldHome.recentActivity} />
    </div>
  );
}
