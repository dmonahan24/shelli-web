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
    <div className="space-y-4 rounded-[28px] border border-border/70 bg-card/90 p-4 shadow-sm sm:p-6">
      <ProjectBreadcrumbs project={project} />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {project.name}
            </h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>{project.address}</p>
            {project.projectCode ? (
              <p className="font-medium text-foreground/80">Project Code: {project.projectCode}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 max-sm:w-full max-sm:[&>*]:flex-1">
          {actions}
        </div>
      </div>
    </div>
  );
}
