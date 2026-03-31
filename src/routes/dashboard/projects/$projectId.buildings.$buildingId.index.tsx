import { createFileRoute, notFound, useNavigate, useRouter } from "@tanstack/react-router";
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
  hierarchyBuildingParamsSchema,
  hierarchyFloorsSearchSchema,
} from "@/lib/validation/hierarchy";
import { getBuildingDetailServerFn } from "@/server/buildings/get-building-detail";

export const Route = createFileRoute("/dashboard/projects/$projectId/buildings/$buildingId/")({
  validateSearch: hierarchyFloorsSearchSchema,
  loader: async ({ params }) => {
    const parsedParams = hierarchyBuildingParamsSchema.parse(params);
    const detail = await getBuildingDetailServerFn({ data: parsedParams });

    if (!detail) {
      throw notFound();
    }

    return detail;
  },
  component: BuildingDetailPage,
});

function BuildingDetailPage() {
  const navigate = useNavigate({
    from: "/dashboard/projects/$projectId/buildings/$buildingId",
  });
  const router = useRouter();
  const detail = Route.useLoaderData();
  const { buildingId } = Route.useParams();
  const search = Route.useSearch();
  const deleteSummary = {
    actualConcreteTotal: detail.building.actualConcreteTotal,
    estimatedConcreteTotal: detail.building.estimatedConcreteTotal,
    floorCount: detail.summary.totalFloors,
    id: buildingId,
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
              buildingId={buildingId}
              onCreated={() => router.invalidate()}
              trigger={<Button>Add Floor</Button>}
            />
            <BuildingSetupWizard buildingId={buildingId} onCreated={() => router.invalidate()} />
            <BulkCreateFloorsDialog buildingId={buildingId} onCreated={() => router.invalidate()} />
            <EditBuildingDialog
              building={detail.building}
              onUpdated={() => router.invalidate()}
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
                  to: "/dashboard/projects/$projectId",
                  params: { projectId: detail.project.id },
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
        buildingId={buildingId}
        floors={filteredFloors}
        onMutationComplete={() => router.invalidate()}
        projectId={detail.project.id}
      />
    </div>
  );
}
