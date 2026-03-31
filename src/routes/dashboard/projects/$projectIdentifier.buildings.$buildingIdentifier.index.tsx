import { createFileRoute, notFound, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { DeleteBuildingDialog } from "@/components/buildings/delete-building-dialog";
import { BuildingSetupWizard } from "@/components/buildings/building-setup-wizard";
import { AddFloorDialog } from "@/components/floors/add-floor-dialog";
import { BulkCreateFloorsDialog } from "@/components/floors/bulk-create-floors-dialog";
import { EditBuildingDialog } from "@/components/buildings/edit-building-dialog";
import { BuildingDetailHeader } from "@/components/hierarchy/building-detail-header";
import { FloorsManagementToolbar } from "@/components/hierarchy/hierarchy-filters";
import { BuildingSummaryCards } from "@/components/hierarchy/building-summary-cards";
import { FloorsTable } from "@/components/hierarchy/floors-table";
import { Button } from "@/components/ui/button";
import {
  hierarchyBuildingRouteParamsSchema,
  hierarchyFloorsSearchSchema,
} from "@/lib/validation/hierarchy";
import {
  getBuildingRouteParams,
  getProjectRouteParams,
} from "@/lib/project-paths";
import { getBuildingDetailServerFn } from "@/server/buildings/get-building-detail";
import { resolveBuildingRouteServerFn } from "@/server/navigation/resolve-building-route";

export const Route = createFileRoute("/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier/")({
  validateSearch: hierarchyFloorsSearchSchema,
  loader: async ({ params }) => {
    const parsedParams = hierarchyBuildingRouteParamsSchema.parse(params);
    const resolved = await resolveBuildingRouteServerFn({ data: parsedParams });

    if (!resolved) {
      throw notFound();
    }

    if (!resolved.isCanonical) {
      throw redirect({
        to: "/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier",
        params: resolved.canonicalParams,
      });
    }

    const detail = await getBuildingDetailServerFn({
      data: {
        buildingId: resolved.building.id,
        projectId: resolved.project.id,
      },
    });

    if (!detail) {
      throw notFound();
    }

    return detail;
  },
  component: BuildingDetailPage,
});

function BuildingDetailPage() {
  const navigate = useNavigate({
    from: "/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier",
  });
  const router = useRouter();
  const detail = Route.useLoaderData();
  const search = Route.useSearch();
  const deleteSummary = {
    actualConcreteTotal: detail.building.actualConcreteTotal,
    estimatedConcreteTotal: detail.building.estimatedConcreteTotal,
    floorCount: detail.summary.totalFloors,
    id: detail.building.id,
    name: detail.building.name,
    pourTypeCount: detail.floors.reduce((count: number, floor: any) => count + floor.pourTypeCount, 0),
  };
  const updateSearch = (partial: Partial<typeof search>) =>
    navigate({
      replace: true,
      search: (current) => ({
        ...current,
        ...partial,
      }),
    });
  const filteredFloors = [...detail.floors]
    .filter((floor) => {
      const query = search.q.trim().toLowerCase();
      const matchesQuery = query ? floor.name.toLowerCase().includes(query) : true;
      const matchesFloorType = search.floorType === "all" ? true : floor.floorType === search.floorType;
      return matchesQuery && matchesFloorType;
    })
    .sort((left, right) => {
      const direction = search.sortDir === "asc" ? 1 : -1;
      switch (search.sortBy) {
        case "name":
          return left.name.localeCompare(right.name) * direction;
        case "levelNumber":
          return ((left.levelNumber ?? 0) - (right.levelNumber ?? 0)) * direction;
        case "estimatedConcreteTotal":
          return (left.estimatedConcreteTotal - right.estimatedConcreteTotal) * direction;
        case "actualConcreteTotal":
          return (left.actualConcreteTotal - right.actualConcreteTotal) * direction;
        case "displayOrder":
        default:
          return (left.displayOrder - right.displayOrder) * direction;
      }
    });

  return (
    <div className="space-y-6">
      <BuildingDetailHeader
        building={detail.building}
        project={detail.project}
        actions={
          <>
            <AddFloorDialog
              buildingId={detail.building.id}
              onCreated={() => router.invalidate()}
              trigger={<Button>Add Floor</Button>}
            />
            <BuildingSetupWizard buildingId={detail.building.id} onCreated={() => router.invalidate()} />
            <BulkCreateFloorsDialog buildingId={detail.building.id} onCreated={() => router.invalidate()} />
            <EditBuildingDialog
              building={detail.building}
              onUpdated={async (result) => {
                await router.navigate({
                  to: "/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier",
                  params: getBuildingRouteParams(
                    { id: detail.project.id, slug: result.projectSlug ?? detail.project.slug },
                    { id: detail.building.id, slug: result.slug }
                  ),
                });
                await router.invalidate();
              }}
              trigger={
                <Button variant="outline">
                  Edit Building
                </Button>
              }
            />
            <DeleteBuildingDialog
              building={deleteSummary}
              onDeleted={() =>
                router.navigate({
                  to: "/dashboard/projects/$projectIdentifier",
                  params: getProjectRouteParams(detail.project),
                })
              }
              trigger={<Button variant="destructive">Delete Building</Button>}
            />
          </>
        }
      />
      <BuildingSummaryCards
        actualConcreteTotal={detail.building.actualConcreteTotal}
        completedFloorsCount={detail.summary.completedFloorsCount}
        estimatedConcreteTotal={detail.building.estimatedConcreteTotal}
        inProgressFloorsCount={detail.summary.inProgressFloorsCount}
        remainingConcrete={detail.building.remainingConcrete}
        totalFloors={detail.summary.totalFloors}
      />
      <FloorsManagementToolbar
        onFilterChange={(value) => updateSearch({ floorType: value as typeof search.floorType })}
        onReset={() =>
          navigate({
            replace: true,
            search: () => hierarchyFloorsSearchSchema.parse({}),
          })
        }
        onSearchChange={(value) => updateSearch({ q: value })}
        onSortByChange={(value) => updateSearch({ sortBy: value as typeof search.sortBy })}
        onSortDirChange={(value) => updateSearch({ sortDir: value as typeof search.sortDir })}
        search={search}
      />
      <FloorsTable
        building={detail.building}
        floors={filteredFloors}
        onMutationComplete={() => router.invalidate()}
        project={detail.project}
      />
    </div>
  );
}
