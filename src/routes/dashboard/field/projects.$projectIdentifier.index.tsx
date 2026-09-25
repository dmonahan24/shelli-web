// @ts-nocheck
import { Link, createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { RecentActivityFeed } from "@/components/analytics/recent-activity-feed";
import { DocumentationTaskCard } from "@/components/field/documentation-task-card";
import { FieldNotesList } from "@/components/field/field-note-form";
import { FieldPendingPage } from "@/components/navigation/page-pending";
import { FieldProjectHeader } from "@/components/field/field-project-header";
import { FieldProjectSummaryCard, FieldRecentPoursList, FieldRecentUploadsList } from "@/components/field/field-project-details";
import { FieldQuickActionsBar } from "@/components/field/field-quick-actions-bar";
import { getProjectRouteParams } from "@/lib/project-paths";
import { READ_ROUTE_CACHE_OPTIONS } from "@/lib/router-cache";
import { projectRouteParamsSchema } from "@/lib/validation/project-list";
import { getFieldProjectDetailServerFn } from "@/server/field/get-field-project-detail";
import { resolveProjectRouteServerFn } from "@/server/navigation/resolve-project-route";

export const Route = createFileRoute("/dashboard/field/projects/$projectIdentifier/")({
  ...READ_ROUTE_CACHE_OPTIONS,
  loader: async ({ params }) => {
    const parsedParams = projectRouteParamsSchema.parse(params);
    const resolved = await resolveProjectRouteServerFn({ data: parsedParams });

    if (!resolved) {
      throw notFound();
    }

    if (!resolved.isCanonical) {
      throw redirect({
        to: "/dashboard/field/projects/$projectIdentifier",
        params: resolved.canonicalParams,
      });
    }

    return getFieldProjectDetailServerFn({
      data: { projectId: resolved.project.id },
    });
  },
  pendingComponent: FieldPendingPage,
  component: FieldProjectPage,
});

function FieldProjectPage() {
  const data = Route.useLoaderData();

  if (!data) {
    return <p className="text-sm text-muted-foreground">Project details are unavailable.</p>;
  }

  return (
    <div className="space-y-4">
      <FieldProjectHeader name={data.project.name} status={data.project.status} />
      <FieldQuickActionsBar project={data.project} />
      <FieldProjectSummaryCard
        estimatedTotalConcrete={Number(data.project.estimatedTotalConcrete)}
        totalConcretePoured={Number(data.project.totalConcretePoured)}
        remainingConcrete={data.project.remainingConcrete}
      />
      <div className="space-y-3">
        {data.documentationTasks.map((task) => (
          <DocumentationTaskCard key={`${task.title}-${task.description}`} {...task} />
        ))}
      </div>
      <FieldRecentPoursList rows={data.recentPours} />
      <FieldNotesList
        notes={data.recentNotes}
        action={
          <Link
            to="/dashboard/field/projects/$projectIdentifier/notes"
            params={getProjectRouteParams(data.project)}
            className="text-sm font-medium text-primary"
          >
            Add / view all
          </Link>
        }
      />
      <FieldRecentUploadsList rows={data.recentUploads} />
      <RecentActivityFeed items={data.recentActivity} title="Project Activity" />
    </div>
  );
}
