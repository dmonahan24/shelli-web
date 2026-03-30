import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { AddProjectDialog } from "@/components/projects/add-project-dialog";
import { ProjectsEmptyState } from "@/components/projects/projects-empty-state";
import { ProjectsTable } from "@/components/projects/projects-table";

type ProjectRow = {
  id: string;
  name: string;
  address: string;
  dateStarted: string;
  estimatedCompletionDate: string;
  totalConcretePoured: number;
  estimatedTotalConcrete: number;
};

export function ProjectsDashboardView({
  projects,
  title,
  subtitle,
  showActions = true,
}: {
  projects: ProjectRow[];
  title: string;
  subtitle: string;
  showActions?: boolean;
}) {
  return (
    <div className="space-y-6">
      <DashboardHeader title={title} subtitle={subtitle} action={showActions ? <AddProjectDialog /> : null} />
      {projects.length === 0 ? (
        <ProjectsEmptyState action={showActions ? <AddProjectDialog /> : null} />
      ) : (
        <ProjectsTable projects={projects} />
      )}
    </div>
  );
}
