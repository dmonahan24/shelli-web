import { createFileRoute } from "@tanstack/react-router";
import { AccessRequestsAdminView } from "@/components/admin/access-requests-admin-view";
import { listAccessRequestsServerFn } from "@/server/admin/access-requests";

export const Route = createFileRoute("/admin/access-requests")({
  loader: async () => listAccessRequestsServerFn(),
  component: AccessRequestsAdminPage,
});

function AccessRequestsAdminPage() {
  const data = Route.useLoaderData();

  return <AccessRequestsAdminView data={data} />;
}
