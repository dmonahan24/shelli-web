import { Link, createFileRoute, notFound, redirect, useRouter } from "@tanstack/react-router";
import { AttachmentUploadDialog } from "@/components/attachments/attachment-upload-dialog";
import { ProjectAttachmentsCard } from "@/components/attachments/project-attachments-card";
import { ProjectMembersCard } from "@/components/company/project-members-card";
import { ProjectBuildingsSection } from "@/components/hierarchy/project-buildings-section";
import { DetailPendingPage } from "@/components/navigation/page-pending";
import { DeleteProjectDialog, DangerZoneCard } from "@/components/projects/delete-project-dialog";
import { ProjectDetailHeader } from "@/components/projects/project-detail-header";
import { ProjectInfoCard } from "@/components/projects/project-info-card";
import { ProjectSummaryCards } from "@/components/projects/project-summary-cards";
import { PourEventsTable } from "@/components/pours/pour-events-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectRouteParams } from "@/lib/project-paths";
import { READ_ROUTE_CACHE_OPTIONS } from "@/lib/router-cache";
import { formatDateTime } from "@/lib/utils/format";
import { getProjectPageDataServerFn } from "@/server/navigation/page-data";

export const Route = createFileRoute("/dashboard/projects/$projectIdentifier/")({
  ...READ_ROUTE_CACHE_OPTIONS,
  loader: async ({ cause, params }) => {
    const result = await getProjectPageDataServerFn({
      data: {
        cause,
        params,
      },
    });

    if (result.status === "not_found") {
      throw notFound();
    }

    if (result.status === "redirect") {
      throw redirect({
        to: "/dashboard/projects/$projectIdentifier",
        params: result.canonicalParams,
      });
    }
    return result.data;
  },
  pendingComponent: DetailPendingPage,
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const router = useRouter();
  const { attachments, accessRoster, buildings, detail, pours } = Route.useLoaderData();
  const projectParams = getProjectRouteParams(detail.project);

  return (
    <div className="space-y-6">
      <ProjectDetailHeader
        project={detail.project}
        actions={
          <>
            <Button asChild>
              <Link to="/dashboard/projects/$projectIdentifier/pours/new" params={projectParams}>
                Add Pour Event
              </Link>
            </Button>
            <AttachmentUploadDialog
              projectId={detail.project.id}
              onUploaded={() => router.invalidate()}
              trigger={<Button variant="outline">Upload Files</Button>}
            />
            <Button asChild variant="outline">
              <Link to="/dashboard/projects/$projectIdentifier/edit" params={projectParams}>
                Edit Project
              </Link>
            </Button>
            <DeleteProjectDialog
              attachmentCount={detail.summary.totalAttachments}
              pourEventCount={detail.summary.totalPourEvents}
              projectAddress={detail.project.address}
              projectId={detail.project.id}
              projectName={detail.project.name}
            />
          </>
        }
      />
      <ProjectSummaryCards
        project={detail.project}
        totalAttachments={detail.summary.totalAttachments}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <ProjectMembersCard
            projectId={detail.project.id}
            projectName={detail.project.name}
            roster={accessRoster}
            onMutationComplete={() => router.invalidate()}
          />
          <ProjectBuildingsSection
            buildings={buildings}
            onMutationComplete={() => router.invalidate()}
            project={detail.project}
          />
          <PourEventsTable
            initialData={pours}
            onMutationComplete={() => router.invalidate()}
            onOpenCreate={() =>
              router.navigate({
                to: "/dashboard/projects/$projectIdentifier/pours/new",
                params: projectParams,
              })
            }
            projectId={detail.project.id}
          />
        </div>
        <div className="space-y-6">
          <ProjectInfoCard project={detail.project} />
          <ProjectAttachmentsCard
            initialData={attachments}
            onMutationComplete={() => router.invalidate()}
            projectId={detail.project.id}
          />
          <Card className="rounded-[24px] border-border/70 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {detail.recentActivity.length > 0 ? (
                detail.recentActivity.map((activity: any) => (
                  <div key={activity.id} className="space-y-1 text-sm">
                    <p className="font-medium">{activity.summary}</p>
                    <p className="text-muted-foreground">
                      {activity.actorName} • {formatDateTime(activity.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity yet.</p>
              )}
            </CardContent>
          </Card>
          <DangerZoneCard>
            <DeleteProjectDialog
              attachmentCount={detail.summary.totalAttachments}
              pourEventCount={detail.summary.totalPourEvents}
              projectAddress={detail.project.address}
              projectId={detail.project.id}
              projectName={detail.project.name}
            />
          </DangerZoneCard>
        </div>
      </div>
    </div>
  );
}
