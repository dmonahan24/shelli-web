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
    slug?: string | null;
  };
  floor: {
    id?: string;
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
      <HierarchyBreadcrumbs
        building={building}
        floor={floor}
        project={project}
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
