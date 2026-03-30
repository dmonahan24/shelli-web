// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { RecentActivityFeed } from "@/components/analytics/recent-activity-feed";
import { DocumentationTaskCard } from "@/components/field/documentation-task-card";
import { FieldProjectHeader } from "@/components/field/field-project-header";
import { FieldProjectSummaryCard, FieldRecentPoursList, FieldRecentUploadsList } from "@/components/field/field-project-details";
import { FieldQuickActionsBar } from "@/components/field/field-quick-actions-bar";
import { getFieldProjectDetailServerFn } from "@/server/field/get-field-project-detail";

export const Route = createFileRoute("/dashboard/field/projects/$projectId")({
  loader: async ({ params }) =>
    getFieldProjectDetailServerFn({
      data: { projectId: params.projectId },
    }),
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
      <FieldQuickActionsBar projectId={data.project.id} />
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
      <FieldRecentUploadsList rows={data.recentUploads} />
      <RecentActivityFeed items={data.recentActivity} title="Project Activity" />
    </div>
  );
}
