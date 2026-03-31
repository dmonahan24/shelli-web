// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { FieldPendingPage } from "@/components/navigation/page-pending";
import { FieldModeHome } from "@/components/field/field-mode-home";
import { READ_ROUTE_CACHE_OPTIONS } from "@/lib/router-cache";
import { getFieldHomeDataServerFn } from "@/server/field/get-field-home-data";

export const Route = createFileRoute("/dashboard/field/")({
  ...READ_ROUTE_CACHE_OPTIONS,
  loader: async () => getFieldHomeDataServerFn(),
  pendingComponent: FieldPendingPage,
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
