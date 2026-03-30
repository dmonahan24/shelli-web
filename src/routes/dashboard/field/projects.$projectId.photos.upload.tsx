// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { FieldUploadCaptureCard } from "@/components/field/field-upload-capture-card";

export const Route = createFileRoute("/dashboard/field/projects/$projectId/photos/upload")({
  component: UploadProjectPhotoPage,
});

function UploadProjectPhotoPage() {
  const { projectId } = Route.useParams();

  return <FieldUploadCaptureCard projectId={projectId} />;
}
