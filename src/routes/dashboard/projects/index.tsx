import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ProjectsPagination, ResultsSummary } from "@/components/projects/projects-pagination";
import { ProjectsTableAdvanced } from "@/components/projects/projects-table-advanced";
import { ProjectsToolbar } from "@/components/projects/projects-toolbar";
import { ProjectsTableSkeleton } from "@/components/projects/projects-table-skeleton";
import { projectListQuerySchema } from "@/lib/validation/project-list";
import { listProjectsServerFn } from "@/server/projects/list-projects";

export const Route = createFileRoute("/dashboard/projects/")({
  validateSearch: projectListQuerySchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => listProjectsServerFn({ data: deps }),
  pendingComponent: ProjectsTableSkeleton,
  component: ProjectsPage,
});

function ProjectsPage() {
  const navigate = useNavigate({ from: "/dashboard/projects" });
  const projects = Route.useLoaderData();
  const search = Route.useSearch();

  const updateSearch = (partial: Partial<typeof search>) =>
    navigate({
      replace: true,
      search: (current) => ({
        ...current,
        ...partial,
      }),
    });

  return (
    <div className="space-y-6">
      <ProjectsToolbar
        search={search}
        onSearchChange={(value) => updateSearch({ page: 1, q: value })}
        onStatusChange={(value) => updateSearch({ page: 1, status: value as typeof search.status })}
        onProgressChange={(value) =>
          updateSearch({ page: 1, progress: value as typeof search.progress })
        }
        onDateChange={(field, value) => updateSearch({ page: 1, [field]: value || undefined })}
        onSortByChange={(value) => updateSearch({ page: 1, sortBy: value as typeof search.sortBy })}
        onSortDirChange={(value) =>
          updateSearch({ page: 1, sortDir: value as typeof search.sortDir })
        }
        onPageSizeChange={(value) => updateSearch({ page: 1, pageSize: Number(value) })}
        onReset={() =>
          navigate({
            replace: true,
            search: () => projectListQuerySchema.parse({}),
          })
        }
      />
      <ResultsSummary
        page={projects.page}
        pageSize={projects.pageSize}
        totalCount={projects.totalCount}
      />
      <ProjectsTableAdvanced projects={projects.rows} />
      <ProjectsPagination
        page={projects.page}
        pageCount={projects.pageCount}
        pageSize={projects.pageSize}
        onPageSizeChange={(value) => updateSearch({ page: 1, pageSize: Number(value) })}
        onPrevious={() => updateSearch({ page: Math.max(1, projects.page - 1) })}
        onNext={() => updateSearch({ page: Math.min(projects.pageCount, projects.page + 1) })}
      />
    </div>
  );
}
