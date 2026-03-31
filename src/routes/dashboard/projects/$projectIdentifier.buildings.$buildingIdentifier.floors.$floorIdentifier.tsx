import { createFileRoute, notFound, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { DeleteFloorDialog } from "@/components/floors/delete-floor-dialog";
import { EditFloorDialog } from "@/components/floors/edit-floor-dialog";
import { AddPourTypeDialog } from "@/components/pour-types/add-pour-type-dialog";
import { FloorDetailHeader } from "@/components/hierarchy/floor-detail-header";
import { PourTypesManagementToolbar } from "@/components/hierarchy/hierarchy-filters";
import { FloorSummaryCards } from "@/components/hierarchy/floor-summary-cards";
import { PourTypesTable } from "@/components/hierarchy/pour-types-table";
import { FloorPresetBundleDialog } from "@/components/pour-types/floor-preset-bundle-dialog";
import { DetailPendingPage } from "@/components/navigation/page-pending";
import { Button } from "@/components/ui/button";
import { READ_ROUTE_CACHE_OPTIONS } from "@/lib/router-cache";
import {
  hierarchyPourTypesSearchSchema,
} from "@/lib/validation/hierarchy";
import {
  getBuildingRouteParams,
  getFloorRouteParams,
} from "@/lib/project-paths";
import { getFloorPageDataServerFn } from "@/server/navigation/page-data";

export const Route = createFileRoute("/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier/floors/$floorIdentifier")({
  ...READ_ROUTE_CACHE_OPTIONS,
  validateSearch: hierarchyPourTypesSearchSchema,
  loader: async ({ cause, params }) => {
    const result = await getFloorPageDataServerFn({
      data: {
        cause,
        params,
      },
    });

    if (result.status === "not_found") {
      throw notFound();
    }

    if (result.status === "redirect") {
      throw redirect({
        to: "/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier/floors/$floorIdentifier",
        params: result.canonicalParams,
      });
    }
    return result.data;
  },
  pendingComponent: DetailPendingPage,
  component: FloorDetailPage,
});

function FloorDetailPage() {
  const navigate = useNavigate({
    from: "/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier/floors/$floorIdentifier",
  });
  const router = useRouter();
  const detail = Route.useLoaderData();
  const search = Route.useSearch();
  const updateSearch = (partial: Partial<typeof search>) =>
    navigate({
      replace: true,
      search: (current) => ({
        ...current,
        ...partial,
      }),
    });
  const filteredPourTypes = [...detail.pourTypes]
    .filter((pourType) => {
      const query = search.q.trim().toLowerCase();
      const matchesQuery = query
        ? pourType.name.toLowerCase().includes(query) ||
          pourType.pourCategory.toLowerCase().includes(query) ||
          (pourType.notes ?? "").toLowerCase().includes(query)
        : true;
      const matchesCategory = search.category === "all" ? true : pourType.pourCategory === search.category;
      const matchesStatus = search.status === "all" ? true : pourType.status === search.status;
      return matchesQuery && matchesCategory && matchesStatus;
    })
    .sort((left, right) => {
      const direction = search.sortDir === "asc" ? 1 : -1;
      const sortBy = String(search.sortBy);

      if (sortBy === "name") {
        return left.name.localeCompare(right.name) * direction;
      }

      if (sortBy === "estimatedConcrete") {
        return (left.estimatedConcrete - right.estimatedConcrete) * direction;
      }

      if (sortBy === "actualConcrete") {
        return (left.actualConcrete - right.actualConcrete) * direction;
      }

      if (sortBy === "updatedAt") {
        return (new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime()) * direction;
      }

      return (left.displayOrder - right.displayOrder) * direction;
    });

  return (
    <div className="space-y-6">
      <FloorDetailHeader
        building={detail.building}
        floor={detail.floor}
        project={detail.project}
        actions={
          <>
            <AddPourTypeDialog
              floorId={detail.floor.id}
              onCreated={() => router.invalidate()}
              trigger={<Button>Add Pour</Button>}
            />
            <FloorPresetBundleDialog
              defaultBundle={detail.floor.floorType === "foundation" ? "foundation" : "standard"}
              floorId={detail.floor.id}
              onApplied={() => router.invalidate()}
            />
            <EditFloorDialog
              floor={detail.floor}
              onUpdated={async (result) => {
                await router.navigate({
                  to: "/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier/floors/$floorIdentifier",
                  params: getFloorRouteParams(
                    { id: detail.project.id, slug: result.projectSlug ?? detail.project.slug },
                    { id: detail.building.id, slug: result.buildingSlug ?? detail.building.slug },
                    { id: detail.floor.id, slug: result.slug }
                  ),
                });
                await router.invalidate();
              }}
              trigger={<Button variant="outline">Edit Floor</Button>}
            />
            <DeleteFloorDialog
              floor={{
                actualConcreteTotal: detail.floor.actualConcreteTotal,
                estimatedConcreteTotal: detail.floor.estimatedConcreteTotal,
                id: detail.floor.id,
                name: detail.floor.name,
                pourTypeCount: detail.summary.totalPourTypes,
              }}
              onDeleted={() =>
                router.navigate({
                  to: "/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier",
                  params: getBuildingRouteParams(detail.project, detail.building),
                })
              }
              trigger={<Button variant="destructive">Delete Floor</Button>}
            />
          </>
        }
      />
      <FloorSummaryCards
        actualConcreteTotal={detail.floor.actualConcreteTotal}
        completedPourTypesCount={detail.summary.completedPourTypesCount}
        estimatedConcreteTotal={detail.floor.estimatedConcreteTotal}
        remainingConcrete={detail.floor.remainingConcrete}
        totalPourTypes={detail.summary.totalPourTypes}
      />
      <PourTypesManagementToolbar
        onCategoryChange={(value) => updateSearch({ category: value as typeof search.category })}
        onReset={() =>
          navigate({
            replace: true,
            search: () => hierarchyPourTypesSearchSchema.parse({}),
          })
        }
        onSearchChange={(value) => updateSearch({ q: value })}
        onSortByChange={(value) => updateSearch({ sortBy: value as typeof search.sortBy })}
        onSortDirChange={(value) => updateSearch({ sortDir: value as typeof search.sortDir })}
        onStatusChange={(value) => updateSearch({ status: value as typeof search.status })}
        search={search}
      />
      <PourTypesTable onMutationComplete={() => router.invalidate()} pourTypes={filteredPourTypes} />
    </div>
  );
}
