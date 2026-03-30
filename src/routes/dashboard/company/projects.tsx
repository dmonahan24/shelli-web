// @ts-nocheck
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ProjectMembersCard } from "@/components/company/project-members-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listMembersServerFn } from "@/server/company/list-members";
import { listProjectsServerFn } from "@/server/projects/list-projects";

export const Route = createFileRoute("/dashboard/company/projects")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "owner" && context.user.role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
  loader: async () => {
    const [members, projects] = await Promise.all([
      listMembersServerFn(),
      listProjectsServerFn({
        data: {
          page: 1,
          pageSize: 20,
        },
      }),
    ]);

    return { members, projects };
  },
  component: CompanyProjectsPage,
});

function CompanyProjectsPage() {
  const data = Route.useLoaderData();
  const memberOptions = data.members.map((member) => ({
    userId: member.userId,
    label: `${member.fullName} (${member.email})`,
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Company</p>
        <h1 className="text-2xl font-semibold tracking-tight">Project Access</h1>
      </div>
      {data.projects.rows.map((project) => (
        <div key={project.id} className="space-y-3">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>{project.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{project.address}</p>
            </CardContent>
          </Card>
          <ProjectMembersCard projectId={project.id} members={[]} companyMembers={memberOptions} />
        </div>
      ))}
    </div>
  );
}
