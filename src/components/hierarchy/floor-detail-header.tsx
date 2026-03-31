import type { ReactNode } from "react";
import { HierarchyBreadcrumbs } from "@/components/hierarchy/hierarchy-breadcrumbs";

export function FloorDetailHeader({
  actions,
  building,
  floor,
  project,
}: {
  actions: ReactNode;
  building: {
    id: string;
    name: string;
  };
  floor: {
    name: string;
  };
  project: {
    id: string;
    name: string;
  };
}) {
  return (
    <div className="space-y-4 rounded-[28px] border border-border/70 bg-card/90 p-6 shadow-sm">
      <HierarchyBreadcrumbs
        buildingId={building.id}
        buildingName={building.name}
        floorName={floor.name}
        projectId={project.id}
        projectName={project.name}
      />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{floor.name}</h1>
          <p className="text-sm text-muted-foreground">{building.name}</p>
          <p className="text-sm text-muted-foreground">
            Add floor-specific pour items and track estimated concrete for each scope of work.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">{actions}</div>
      </div>
    </div>
  );
}
