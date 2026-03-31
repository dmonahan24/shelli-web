// @ts-nocheck
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { FieldUploadCaptureCard } from "@/components/field/field-upload-capture-card";
import { projectRouteParamsSchema } from "@/lib/validation/project-list";
import { resolveProjectRouteServerFn } from "@/server/navigation/resolve-project-route";

export const Route = createFileRoute("/dashboard/field/projects/$projectIdentifier/photos/upload")({
  loader: async ({ params }) => {
    const parsedParams = projectRouteParamsSchema.parse(params);
    const resolved = await resolveProjectRouteServerFn({ data: parsedParams });

    if (!resolved) {
      throw notFound();
    }

    if (!resolved.isCanonical) {
      throw redirect({
        to: "/dashboard/field/projects/$projectIdentifier/photos/upload",
        params: resolved.canonicalParams,
      });
    }

    return resolved.project;
  },
  component: UploadProjectPhotoPage,
});

function UploadProjectPhotoPage() {
  const project = Route.useLoaderData();

  return <FieldUploadCaptureCard projectId={project.id} />;
}
