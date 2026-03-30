import { createFileRoute } from "@tanstack/react-router";
import { AdminUsersView } from "@/components/admin/admin-users-view";
import { listAdminUsersServerFn } from "@/server/admin/users";

export const Route = createFileRoute("/admin/users")({
  loader: async () => listAdminUsersServerFn(),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const data = Route.useLoaderData();

  return <AdminUsersView data={data} />;
}
