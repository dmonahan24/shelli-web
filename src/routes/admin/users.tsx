import { createFileRoute } from "@tanstack/react-router";
import { AdminUsersView } from "@/components/admin/admin-users-view";
import { AdminPendingPage } from "@/components/navigation/page-pending";
import { READ_ROUTE_CACHE_OPTIONS } from "@/lib/router-cache";
import { listAdminUsersServerFn } from "@/server/admin/users";

export const Route = createFileRoute("/admin/users")({
  ...READ_ROUTE_CACHE_OPTIONS,
  loader: async () => listAdminUsersServerFn(),
  pendingComponent: AdminPendingPage,
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const data = Route.useLoaderData();

  return <AdminUsersView data={data} />;
}
