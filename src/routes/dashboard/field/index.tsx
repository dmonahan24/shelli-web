// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { FieldModeHome } from "@/components/field/field-mode-home";
import { getFieldHomeDataServerFn } from "@/server/field/get-field-home-data";

export const Route = createFileRoute("/dashboard/field/")({
  loader: async () => getFieldHomeDataServerFn(),
  component: FieldHomePage,
});

function FieldHomePage() {
  const data = Route.useLoaderData();

  return (
    <FieldModeHome
      projects={data.projects}
      recentActivity={data.recentActivity}
      documentationTasks={data.documentationTasks}
    />
  );
}
