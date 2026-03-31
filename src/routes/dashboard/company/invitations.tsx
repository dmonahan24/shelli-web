// @ts-nocheck
import { createFileRoute, getRouteApi, redirect } from "@tanstack/react-router";
import { ListPendingPage } from "@/components/navigation/page-pending";
import { InviteMemberDialog } from "@/components/company/invite-member-dialog";
import { InvitationsTable } from "@/components/company/invitations-table";
import { READ_ROUTE_CACHE_OPTIONS } from "@/lib/router-cache";
import { listInvitationsServerFn } from "@/server/company/list-invitations";

const dashboardRouteApi = getRouteApi("/dashboard");

export const Route = createFileRoute("/dashboard/company/invitations")({
  ...READ_ROUTE_CACHE_OPTIONS,
  beforeLoad: ({ context }) => {
    if (context.user.role !== "owner" && context.user.role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
  loader: async () => listInvitationsServerFn(),
  pendingComponent: ListPendingPage,
  component: CompanyInvitationsPage,
});

function CompanyInvitationsPage() {
  const rows = Route.useLoaderData();
  const user = dashboardRouteApi.useRouteContext({
    select: (context) => context.user,
  });

  return (
    <div className="space-y-6">
      <div className="tablet-stack">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Company</p>
          <h1 className="text-2xl font-semibold tracking-tight">Invitations</h1>
        </div>
        <InviteMemberDialog companyId={user.companyId} />
      </div>
      <InvitationsTable companyId={user.companyId} rows={rows} />
    </div>
  );
}
