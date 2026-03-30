import { createFileRoute } from "@tanstack/react-router";
import { CompaniesAdminView } from "@/components/admin/companies-admin-view";
import { listAdminCompaniesServerFn } from "@/server/admin/companies";

export const Route = createFileRoute("/admin/companies")({
  loader: async () => listAdminCompaniesServerFn(),
  component: CompaniesAdminPage,
});

function CompaniesAdminPage() {
  const companies = Route.useLoaderData();

  return <CompaniesAdminView companies={companies} />;
}
