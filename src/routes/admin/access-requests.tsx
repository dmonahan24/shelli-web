import { createFileRoute } from "@tanstack/react-router";
import { AccessRequestsAdminView } from "@/components/admin/access-requests-admin-view";
import { AdminPendingPage } from "@/components/navigation/page-pending";
import { READ_ROUTE_CACHE_OPTIONS } from "@/lib/router-cache";
import { listAccessRequestsServerFn } from "@/server/admin/access-requests";

export const Route = createFileRoute("/admin/access-requests")({
  ...READ_ROUTE_CACHE_OPTIONS,
  loader: async () => listAccessRequestsServerFn(),
  pendingComponent: AdminPendingPage,
  component: AccessRequestsAdminPage,
});

function AccessRequestsAdminPage() {
  const data = Route.useLoaderData();

  return <AccessRequestsAdminView data={data} />;
}
