import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardView } from "@/components/admin/admin-dashboard-view";
import { AdminPendingPage } from "@/components/navigation/page-pending";
import { READ_ROUTE_CACHE_OPTIONS } from "@/lib/router-cache";
import { getAdminDashboardServerFn } from "@/server/admin/dashboard";

export const Route = createFileRoute("/admin/")({
  ...READ_ROUTE_CACHE_OPTIONS,
  loader: async () => getAdminDashboardServerFn(),
  pendingComponent: AdminPendingPage,
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const data = Route.useLoaderData();

  return <AdminDashboardView data={data} />;
}
