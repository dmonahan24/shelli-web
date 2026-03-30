// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { QuickPourForm } from "@/components/field/quick-pour-form";

export const Route = createFileRoute("/dashboard/field/projects/$projectId/pours/quick-add")({
  component: QuickAddPourPage,
});

function QuickAddPourPage() {
  const { projectId } = Route.useParams();

  return <QuickPourForm projectId={projectId} />;
}
