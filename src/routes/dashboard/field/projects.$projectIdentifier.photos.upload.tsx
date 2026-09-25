// @ts-nocheck
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { FormPendingPage } from "@/components/navigation/page-pending";
import { FieldUploadCaptureCard } from "@/components/field/field-upload-capture-card";
import { attachmentTypeSchema } from "@/lib/validation/attachment";
import { projectRouteParamsSchema } from "@/lib/validation/project-list";
import { resolveProjectRouteServerFn } from "@/server/navigation/resolve-project-route";

export const Route = createFileRoute("/dashboard/field/projects/$projectIdentifier/photos/upload")({
  validateSearch: z.object({
    type: attachmentTypeSchema.catch("photo").default("photo"),
  }),
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
  pendingComponent: FormPendingPage,
  component: UploadProjectPhotoPage,
});

function UploadProjectPhotoPage() {
  const project = Route.useLoaderData();
  const { type } = Route.useSearch();

  return <FieldUploadCaptureCard projectId={project.id} defaultAttachmentType={type} />;
}
