// @ts-nocheck
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ListPendingPage } from "@/components/navigation/page-pending";
import { InviteMemberDialog } from "@/components/company/invite-member-dialog";
import { InvitationsTable } from "@/components/company/invitations-table";
import { READ_ROUTE_CACHE_OPTIONS } from "@/lib/router-cache";
import { getCompanyOverviewServerFn } from "@/server/company/list-members";
import { listInvitationsServerFn } from "@/server/company/list-invitations";

export const Route = createFileRoute("/dashboard/company/invitations")({
  ...READ_ROUTE_CACHE_OPTIONS,
  beforeLoad: ({ context }) => {
    if (context.user.role !== "owner" && context.user.role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
  loader: async () => {
    const [overview, invitations] = await Promise.all([
      getCompanyOverviewServerFn(),
      listInvitationsServerFn(),
    ]);

    return { overview, invitations };
  },
  pendingComponent: ListPendingPage,
  component: CompanyInvitationsPage,
});

function CompanyInvitationsPage() {
  const data = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Company</p>
          <h1 className="text-2xl font-semibold tracking-tight">Invitations</h1>
        </div>
        <InviteMemberDialog companyId={data.overview.company.id} />
      </div>
      <InvitationsTable companyId={data.overview.company.id} rows={data.invitations} />
    </div>
  );
}
