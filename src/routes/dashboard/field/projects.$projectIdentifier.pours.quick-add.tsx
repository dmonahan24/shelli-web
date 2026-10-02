// @ts-nocheck
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { FormPendingPage } from "@/components/navigation/page-pending";
import { QuickPourForm } from "@/components/field/quick-pour-form";
import { projectRouteParamsSchema } from "@/lib/validation/project-list";
import { listBuildingsForProjectServerFn } from "@/server/buildings/list-buildings-for-project";
import { resolveProjectRouteServerFn } from "@/server/navigation/resolve-project-route";

export const Route = createFileRoute("/dashboard/field/projects/$projectIdentifier/pours/quick-add")({
  loader: async ({ params }) => {
    const parsedParams = projectRouteParamsSchema.parse(params);
    const resolved = await resolveProjectRouteServerFn({ data: parsedParams });

    if (!resolved) {
      throw notFound();
    }

    if (!resolved.isCanonical) {
      throw redirect({
        to: "/dashboard/field/projects/$projectIdentifier/pours/quick-add",
        params: resolved.canonicalParams,
      });
    }

    const buildings = await listBuildingsForProjectServerFn({
      data: { projectId: resolved.project.id },
    });

    return { project: resolved.project, buildings };
  },
  pendingComponent: FormPendingPage,
  component: QuickAddPourPage,
});

function QuickAddPourPage() {
  const { buildings, project } = Route.useLoaderData();

  return <QuickPourForm buildings={buildings} projectId={project.id} />;
}
