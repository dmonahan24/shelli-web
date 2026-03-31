// @ts-nocheck
import { createFileRoute, getRouteApi, redirect } from "@tanstack/react-router";
import { ListPendingPage } from "@/components/navigation/page-pending";
import { InviteMemberDialog } from "@/components/company/invite-member-dialog";
import { MembersTable } from "@/components/company/members-table";
import { READ_ROUTE_CACHE_OPTIONS } from "@/lib/router-cache";
import { listMembersServerFn } from "@/server/company/list-members";

const dashboardRouteApi = getRouteApi("/dashboard");

export const Route = createFileRoute("/dashboard/company/members")({
  ...READ_ROUTE_CACHE_OPTIONS,
  beforeLoad: ({ context }) => {
    if (context.user.role !== "owner" && context.user.role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
  loader: async () => listMembersServerFn(),
  pendingComponent: ListPendingPage,
  component: CompanyMembersPage,
});

function CompanyMembersPage() {
  const rows = Route.useLoaderData();
  const user = dashboardRouteApi.useRouteContext({
    select: (context) => context.user,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Company</p>
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        </div>
        <InviteMemberDialog companyId={user.companyId} />
      </div>
      <MembersTable companyId={user.companyId} rows={rows} />
    </div>
  );
}
