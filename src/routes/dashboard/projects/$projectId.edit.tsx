import type { ProjectStatus } from "@/lib/validation/project";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { EditProjectForm } from "@/components/projects/edit-project-form";
import { projectDetailParamsSchema } from "@/lib/validation/project-list";
import { getProjectDetailServerFn } from "@/server/projects/get-project-detail";

export const Route = createFileRoute("/dashboard/projects/$projectId/edit")({
  loader: async ({ params }) => {
    const parsedParams = projectDetailParamsSchema.parse(params);
    const detail = await getProjectDetailServerFn({ data: parsedParams });

    if (!detail) {
      throw notFound();
    }

    return detail;
  },
  component: EditProjectPage,
});

function EditProjectPage() {
  const detail = Route.useLoaderData();
  const { projectId } = Route.useParams();

  return (
    <EditProjectForm
      projectId={projectId}
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
