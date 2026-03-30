// @ts-nocheck
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const roleMatrix = [
  {
    role: "owner",
    permissions: "Manage members, projects, invitations, analytics, and future billing controls.",
  },
  {
    role: "admin",
    permissions: "Manage most team and project operations without owner-level platform control.",
  },
  {
    role: "project_manager",
    permissions: "Manage assigned projects, edit pours, upload attachments, and review analytics.",
  },
  {
    role: "field_supervisor",
    permissions: "Run field workflows, add pours, upload media, and keep documentation complete.",
  },
  {
    role: "viewer",
    permissions: "Read-only access to projects, pours, and attachments.",
  },
];

export const Route = createFileRoute("/dashboard/company/roles")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "owner" && context.user.role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: CompanyRolesPage,
});

function CompanyRolesPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Company</p>
        <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {roleMatrix.map((item) => (
          <Card key={item.role} className="border-border/70">
            <CardHeader>
              <CardTitle className="capitalize">{item.role.replaceAll("_", " ")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.permissions}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
