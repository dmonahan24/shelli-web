// @ts-nocheck
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { FormPendingPage } from "@/components/navigation/page-pending";
import { QuickPourForm } from "@/components/field/quick-pour-form";
import { projectRouteParamsSchema } from "@/lib/validation/project-list";
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

    return resolved.project;
  },
  pendingComponent: FormPendingPage,
  component: QuickAddPourPage,
});

function QuickAddPourPage() {
  const project = Route.useLoaderData();

  return <QuickPourForm projectId={project.id} />;
}
