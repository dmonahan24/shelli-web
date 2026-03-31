import type { ProjectStatus } from "@/lib/validation/project";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { FormPendingPage } from "@/components/navigation/page-pending";
import { EditProjectForm } from "@/components/projects/edit-project-form";
import { READ_ROUTE_CACHE_OPTIONS } from "@/lib/router-cache";
import { projectRouteParamsSchema } from "@/lib/validation/project-list";
import { resolveProjectRouteServerFn } from "@/server/navigation/resolve-project-route";
import { getProjectDetailServerFn } from "@/server/projects/get-project-detail";

export const Route = createFileRoute("/dashboard/projects/$projectIdentifier/edit")({
  ...READ_ROUTE_CACHE_OPTIONS,
  loader: async ({ params }) => {
    const parsedParams = projectRouteParamsSchema.parse(params);
    const resolved = await resolveProjectRouteServerFn({ data: parsedParams });

    if (!resolved) {
      throw notFound();
    }

    if (!resolved.isCanonical) {
      throw redirect({
        to: "/dashboard/projects/$projectIdentifier/edit",
        params: resolved.canonicalParams,
      });
    }

    const detail = await getProjectDetailServerFn({ data: { projectId: resolved.project.id } });

    if (!detail) {
      throw notFound();
    }

    return detail;
  },
  pendingComponent: FormPendingPage,
  component: EditProjectPage,
});

function EditProjectPage() {
  const detail = Route.useLoaderData();

  return (
    <EditProjectForm
      projectId={detail.project.id}
      currentTotalConcretePoured={detail.project.totalConcretePoured}
      isHierarchyManaged={detail.summary.totalBuildings > 0}
      defaultValues={{
        name: detail.project.name,
        address: detail.project.address,
        status: detail.project.status as ProjectStatus,
        description: detail.project.description ?? "",
        projectCode: detail.project.projectCode ?? "",
        dateStarted: detail.project.dateStarted,
        estimatedCompletionDate: detail.project.estimatedCompletionDate,
        estimatedTotalConcrete: detail.project.estimatedTotalConcrete,
      }}
    />
  );
}
