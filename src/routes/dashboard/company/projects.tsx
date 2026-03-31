// @ts-nocheck
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { ProjectMembersCard } from "@/components/company/project-members-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listProjectAccessRostersServerFn } from "@/server/company/get-project-access-roster";
import { listProjectsServerFn } from "@/server/projects/list-projects";

export const Route = createFileRoute("/dashboard/company/projects")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "owner" && context.user.role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
  loader: async () => {
    const projects = await listProjectsServerFn({
      data: {
        page: 1,
        pageSize: 20,
      },
    });
    const rosters =
      projects.rows.length > 0
        ? await listProjectAccessRostersServerFn({
            data: {
              projectIds: projects.rows.map((project) => project.id),
            },
          })
        : {};

    return { projects, rosters };
  },
  component: CompanyProjectsPage,
});

function CompanyProjectsPage() {
  const router = useRouter();
  const data = Route.useLoaderData();

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
          <ProjectMembersCard
            projectId={project.id}
            projectName={project.name}
            roster={data.rosters[project.id]}
            onMutationComplete={() => router.invalidate()}
          />
        </div>
      ))}
    </div>
  );
}
