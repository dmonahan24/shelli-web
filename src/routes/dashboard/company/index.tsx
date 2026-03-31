// @ts-nocheck
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ListPendingPage } from "@/components/navigation/page-pending";
import { CompanyOverviewCards } from "@/components/company/company-overview-cards";
import { READ_ROUTE_CACHE_OPTIONS } from "@/lib/router-cache";
import { getCompanyOverviewServerFn } from "@/server/company/list-members";

export const Route = createFileRoute("/dashboard/company/")({
  ...READ_ROUTE_CACHE_OPTIONS,
  beforeLoad: ({ context }) => {
    if (context.user.role !== "owner" && context.user.role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
  loader: async () => getCompanyOverviewServerFn(),
  pendingComponent: ListPendingPage,
  component: CompanyOverviewPage,
});

function CompanyOverviewPage() {
  const data = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Company</p>
        <h1 className="text-2xl font-semibold tracking-tight">{data.company.name}</h1>
      </div>
      <CompanyOverviewCards
        items={[
          { label: "Members", value: String(data.metrics.totalMembers) },
          { label: "Active Projects", value: String(data.metrics.totalActiveProjects) },
          { label: "Pours This Month", value: String(data.metrics.totalPoursThisMonth) },
          { label: "Concrete This Month", value: `${data.metrics.totalConcreteThisMonth.toFixed(0)} yds` },
          { label: "Pending Invites", value: String(data.metrics.pendingInvitations) },
        ]}
      />
    </div>
  );
}
