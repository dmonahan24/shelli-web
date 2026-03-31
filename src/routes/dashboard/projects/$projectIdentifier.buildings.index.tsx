import { createFileRoute, notFound, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { BuildingsManagementToolbar } from "@/components/hierarchy/hierarchy-filters";
import { ProjectBuildingsSection } from "@/components/hierarchy/project-buildings-section";
import { projectRouteParamsSchema } from "@/lib/validation/project-list";
import { hierarchyBuildingsSearchSchema } from "@/lib/validation/hierarchy";
import { resolveProjectRouteServerFn } from "@/server/navigation/resolve-project-route";
import { getProjectDetailServerFn } from "@/server/projects/get-project-detail";
import { listBuildingsForProjectServerFn } from "@/server/buildings/list-buildings-for-project";

export const Route = createFileRoute("/dashboard/projects/$projectIdentifier/buildings/")({
  validateSearch: hierarchyBuildingsSearchSchema,
  loader: async ({ params }) => {
    const parsedParams = projectRouteParamsSchema.parse(params);
    const resolved = await resolveProjectRouteServerFn({ data: parsedParams });

    if (!resolved) {
      throw notFound();
    }

    if (!resolved.isCanonical) {
      throw redirect({
        to: "/dashboard/projects/$projectIdentifier/buildings",
        params: resolved.canonicalParams,
      });
    }

    const [detail, buildings] = await Promise.all([
      getProjectDetailServerFn({ data: { projectId: resolved.project.id } }),
      listBuildingsForProjectServerFn({ data: { projectId: resolved.project.id } }),
    ]);

    if (!detail) {
      throw notFound();
    }

    return {
      buildings,
      project: detail.project,
    };
  },
  component: ProjectBuildingsPage,
});

function ProjectBuildingsPage() {
  const navigate = useNavigate({ from: "/dashboard/projects/$projectIdentifier/buildings" });
  const router = useRouter();
  const { buildings, project } = Route.useLoaderData();
  const search = Route.useSearch();

  const updateSearch = (partial: Partial<typeof search>) =>
    navigate({
      replace: true,
      search: (current) => ({
        ...current,
        ...partial,
      }),
    });

  const filteredBuildings = [...buildings]
    .filter((building) => {
      const query = search.q.trim().toLowerCase();
      if (!query) {
        return true;
      }

      return (
        building.name.toLowerCase().includes(query) ||
        (building.code ?? "").toLowerCase().includes(query)
      );
    })
    .sort((left, right) => {
      const direction = search.sortDir === "asc" ? 1 : -1;

      switch (search.sortBy) {
        case "name":
          return left.name.localeCompare(right.name) * direction;
        case "estimatedConcreteTotal":
          return (left.estimatedConcreteTotal - right.estimatedConcreteTotal) * direction;
        case "actualConcreteTotal":
          return (left.actualConcreteTotal - right.actualConcreteTotal) * direction;
        case "floorCount":
          return (left.floorCount - right.floorCount) * direction;
        case "displayOrder":
        default:
          return (left.displayOrder - right.displayOrder) * direction;
      }
    });

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-border/70 bg-card/90 p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
        <p className="text-sm text-muted-foreground">Buildings and structural planning hierarchy</p>
      </div>
      <BuildingsManagementToolbar
        onReset={() =>
          navigate({
            replace: true,
            search: () => hierarchyBuildingsSearchSchema.parse({}),
          })
        }
        onSearchChange={(value) => updateSearch({ q: value })}
        onSortByChange={(value) => updateSearch({ sortBy: value as typeof search.sortBy })}
        onSortDirChange={(value) => updateSearch({ sortDir: value as typeof search.sortDir })}
        search={search}
      />
      <ProjectBuildingsSection
        buildings={filteredBuildings}
        onMutationComplete={() => router.invalidate()}
        project={project}
      />
    </div>
  );
}
