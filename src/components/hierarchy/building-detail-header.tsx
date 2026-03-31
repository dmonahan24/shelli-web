import type { ReactNode } from "react";
import { HierarchyBreadcrumbs } from "@/components/hierarchy/hierarchy-breadcrumbs";

export function BuildingDetailHeader({
  actions,
  building,
  project,
}: {
  actions: ReactNode;
  building: {
    code: string | null;
    id: string;
    name: string;
    slug?: string | null;
  };
  project: {
    id: string;
    name: string;
    slug?: string | null;
  };
}) {
  return (
    <div className="space-y-4 rounded-[28px] border border-border/70 bg-card/90 p-6 shadow-sm">
      <HierarchyBreadcrumbs building={building} project={project} />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{building.name}</h1>
          {building.code ? <p className="text-sm text-muted-foreground">Code: {building.code}</p> : null}
        </div>
        <div className="flex flex-wrap gap-3">{actions}</div>
      </div>
    </div>
  );
}
