import { createFileRoute } from "@tanstack/react-router";
import { ProjectsDashboardView } from "@/components/dashboard/projects-dashboard-view";
import { ProjectsTableSkeleton } from "@/components/projects/projects-table-skeleton";
import { listProjectsServerFn } from "@/server/projects/list-projects";

export const Route = createFileRoute("/dashboard/")({
  loader: async () =>
    listProjectsServerFn({
      data: {
        page: 1,
        pageSize: 5,
      },
    }),
  pendingComponent: ProjectsTableSkeleton,
  component: DashboardHomePage,
});

function DashboardHomePage() {
  const projects = Route.useLoaderData();

  return (
    <ProjectsDashboardView
      projects={projects.rows}
      title="Projects"
      subtitle="Track the current user’s active construction jobs, review progress to date, and add new projects without leaving the dashboard."
    />
  );
}
