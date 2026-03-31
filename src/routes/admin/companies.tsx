import { createFileRoute } from "@tanstack/react-router";
import { CompaniesAdminView } from "@/components/admin/companies-admin-view";
import { AdminPendingPage } from "@/components/navigation/page-pending";
import { READ_ROUTE_CACHE_OPTIONS } from "@/lib/router-cache";
import { listAdminCompaniesServerFn } from "@/server/admin/companies";

export const Route = createFileRoute("/admin/companies")({
  ...READ_ROUTE_CACHE_OPTIONS,
  loader: async () => listAdminCompaniesServerFn(),
  pendingComponent: AdminPendingPage,
  component: CompaniesAdminPage,
});

function CompaniesAdminPage() {
  const companies = Route.useLoaderData();

  return <CompaniesAdminView companies={companies} />;
}
