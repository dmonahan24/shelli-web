// @ts-nocheck
import { createFileRoute, redirect } from "@tanstack/react-router";
import { InviteMemberDialog } from "@/components/company/invite-member-dialog";
import { MembersTable } from "@/components/company/members-table";
import { getCompanyOverviewServerFn, listMembersServerFn } from "@/server/company/list-members";

export const Route = createFileRoute("/dashboard/company/members")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "owner" && context.user.role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
  loader: async () => {
    const [overview, members] = await Promise.all([getCompanyOverviewServerFn(), listMembersServerFn()]);
    return { overview, members };
  },
  component: CompanyMembersPage,
});

function CompanyMembersPage() {
  const data = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Company</p>
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        </div>
        <InviteMemberDialog companyId={data.overview.company.id} />
      </div>
      <MembersTable companyId={data.overview.company.id} rows={data.members} />
    </div>
  );
}
