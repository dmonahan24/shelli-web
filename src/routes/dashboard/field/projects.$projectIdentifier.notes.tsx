// @ts-nocheck
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { FieldNoteCaptureCard, FieldNotesList } from "@/components/field/field-note-form";
import { FieldProjectHeader } from "@/components/field/field-project-header";
import { FormPendingPage } from "@/components/navigation/page-pending";
import { projectRouteParamsSchema } from "@/lib/validation/project-list";
import { getFieldNotesServerFn } from "@/server/field/get-field-notes";
import { resolveProjectRouteServerFn } from "@/server/navigation/resolve-project-route";

export const Route = createFileRoute("/dashboard/field/projects/$projectIdentifier/notes")({
  loader: async ({ params }) => {
    const parsedParams = projectRouteParamsSchema.parse(params);
    const resolved = await resolveProjectRouteServerFn({ data: parsedParams });

    if (!resolved) {
      throw notFound();
    }

    if (!resolved.isCanonical) {
      throw redirect({
        to: "/dashboard/field/projects/$projectIdentifier/notes",
        params: resolved.canonicalParams,
      });
    }

    const notes = await getFieldNotesServerFn({
      data: { projectId: resolved.project.id },
    });

    return { project: resolved.project, notes };
  },
  pendingComponent: FormPendingPage,
  component: FieldNotesPage,
});

function FieldNotesPage() {
  const { project, notes } = Route.useLoaderData();

  return (
    <div className="space-y-4">
      <FieldProjectHeader name={project.name} status={project.status} />
      <FieldNoteCaptureCard projectId={project.id} />
      <FieldNotesList notes={notes} />
    </div>
  );
}
