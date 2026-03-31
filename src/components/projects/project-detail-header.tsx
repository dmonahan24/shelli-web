import type { ReactNode } from "react";
import { ProjectBreadcrumbs } from "@/components/projects/project-breadcrumbs";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";

export function ProjectDetailHeader({
  project,
  actions,
}: {
  project: {
    id: string;
    address: string;
    name: string;
    projectCode: string | null;
    slug?: string | null;
    status: string;
  };
  actions: ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-[28px] border border-border/70 bg-card/90 p-6 shadow-sm">
      <ProjectBreadcrumbs project={project} />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>{project.address}</p>
            {project.projectCode ? (
              <p className="font-medium text-foreground/80">Project Code: {project.projectCode}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">{actions}</div>
      </div>
    </div>
  );
}
