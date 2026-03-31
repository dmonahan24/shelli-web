// @ts-nocheck
import { Link } from "@tanstack/react-router";
import { getProjectRouteParams } from "@/lib/project-paths";
import { RecentActivityFeed } from "@/components/analytics/recent-activity-feed";
import { DocumentationTaskCard } from "@/components/field/documentation-task-card";
import { FieldActionGrid } from "@/components/field/field-action-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MyAssignedProjectsList({
  projects,
}: {
  projects: Array<{
    id: string;
    name: string;
    slug?: string | null;
    status: string;
    remainingConcrete: number;
  }>;
}) {
  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-base">My Projects</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No assigned projects yet.</p>
        ) : (
          projects.map((project) => (
            <Link
              key={project.id}
              to="/dashboard/field/projects/$projectIdentifier"
              params={getProjectRouteParams(project)}
              className="block rounded-xl border border-border/60 px-3 py-3"
            >
              <p className="font-medium">{project.name}</p>
              <p className="text-sm text-muted-foreground">
                {project.status.replaceAll("_", " ")} • {project.remainingConcrete.toLocaleString()} yds remaining
              </p>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function FieldRecentActivityCard({
  items,
}: {
  items: Array<{
    id: string;
    eventType: string;
    summary: string;
    actorName?: string | null;
    createdAt: Date | string;
  }>;
}) {
  return <RecentActivityFeed items={items} title="Recent Field Activity" />;
}

export function QuickProjectSwitcher({
  projects,
}: {
  projects: Array<{ id: string; name: string; slug?: string | null }>;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {projects.map((project) => (
        <Link
          key={project.id}
          to="/dashboard/field/projects/$projectIdentifier"
          params={getProjectRouteParams(project)}
          className="rounded-full border border-border/70 bg-background px-3 py-2 text-sm font-medium whitespace-nowrap"
        >
          {project.name}
        </Link>
      ))}
    </div>
  );
}

export function FieldModeHome({
  projects,
  recentActivity,
  documentationTasks,
}: {
  projects: Array<{
    id: string;
    name: string;
    slug?: string | null;
    status: string;
    remainingConcrete: number;
  }>;
  recentActivity: Array<{
    id: string;
    eventType: string;
    summary: string;
    actorName?: string | null;
    createdAt: Date | string;
  }>;
  documentationTasks: Array<{
    title: string;
    description: string;
    severity: "warning" | "critical";
  }>;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Field mode</p>
        <h1 className="text-2xl font-semibold tracking-tight">Fast job-site actions</h1>
      </div>
      <QuickProjectSwitcher
        projects={projects.map((project) => ({
          id: project.id,
          name: project.name,
          slug: project.slug,
        }))}
      />
      <FieldActionGrid project={projects[0]} />
      <MyAssignedProjectsList projects={projects} />
      <div className="space-y-3">
        {documentationTasks.map((task) => (
          <DocumentationTaskCard key={`${task.title}-${task.description}`} {...task} />
        ))}
      </div>
      <FieldRecentActivityCard items={recentActivity} />
    </div>
  );
}
