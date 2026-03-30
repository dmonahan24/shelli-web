import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardView } from "@/components/admin/admin-dashboard-view";
import { getAdminDashboardServerFn } from "@/server/admin/dashboard";

export const Route = createFileRoute("/admin/")({
  loader: async () => getAdminDashboardServerFn(),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const data = Route.useLoaderData();

  return <AdminDashboardView data={data} />;
}
