import { Link, createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { AttachmentUploadDialog } from "@/components/attachments/attachment-upload-dialog";
import { ProjectAttachmentsCard } from "@/components/attachments/project-attachments-card";
import { DeleteProjectDialog, DangerZoneCard } from "@/components/projects/delete-project-dialog";
import { ProjectDetailHeader } from "@/components/projects/project-detail-header";
import { ProjectInfoCard } from "@/components/projects/project-info-card";
import { ProjectSummaryCards } from "@/components/projects/project-summary-cards";
import { PourEventsTable } from "@/components/pours/pour-events-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { projectDetailParamsSchema } from "@/lib/validation/project-list";
import { getProjectDetailServerFn } from "@/server/projects/get-project-detail";
import { listProjectAttachmentsServerFn } from "@/server/attachments/list-project-attachments";
import { listProjectPoursServerFn } from "@/server/pours/list-pour-events";
import { formatDateTime } from "@/lib/utils/format";

export const Route = createFileRoute("/dashboard/projects/$projectId")({
  loader: async ({ params }) => {
    const parsedParams = projectDetailParamsSchema.parse(params);
    const [detail, pours, attachments] = await Promise.all([
      getProjectDetailServerFn({ data: parsedParams }),
      listProjectPoursServerFn({
        data: {
          projectId: parsedParams.projectId,
          query: {
            page: 1,
            pageSize: 10,
          },
        },
      }),
      listProjectAttachmentsServerFn({
        data: {
          projectId: parsedParams.projectId,
          query: {
            page: 1,
            pageSize: 8,
          },
        },
      }),
    ]);

    if (!detail) {
      throw notFound();
    }

    return {
      attachments,
      detail,
      pours,
    };
  },
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const router = useRouter();
  const { attachments, detail, pours } = Route.useLoaderData();
  const { projectId } = Route.useParams();

  return (
    <div className="space-y-6">
      <ProjectDetailHeader
        project={detail.project}
        actions={
          <>
            <Button asChild>
              <Link to="/dashboard/projects/$projectId/pours/new" params={{ projectId }}>
                Add Pour Event
              </Link>
            </Button>
            <AttachmentUploadDialog
              projectId={projectId}
              onUploaded={() => router.invalidate()}
              trigger={<Button variant="outline">Upload Files</Button>}
            />
            <Button asChild variant="outline">
              <Link to="/dashboard/projects/$projectId/edit" params={{ projectId }}>
                Edit Project
              </Link>
            </Button>
            <DeleteProjectDialog
              attachmentCount={detail.summary.totalAttachments}
              pourEventCount={detail.summary.totalPourEvents}
              projectAddress={detail.project.address}
              projectId={projectId}
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
          <PourEventsTable
            initialData={pours}
            onMutationComplete={() => router.invalidate()}
            onOpenCreate={() =>
              router.navigate({
                to: "/dashboard/projects/$projectId/pours/new",
                params: { projectId },
              })
            }
            projectId={projectId}
          />
        </div>
        <div className="space-y-6">
          <ProjectInfoCard project={detail.project} />
          <ProjectAttachmentsCard
            initialData={attachments}
            onMutationComplete={() => router.invalidate()}
            projectId={projectId}
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
              projectId={projectId}
              projectName={detail.project.name}
            />
          </DangerZoneCard>
        </div>
      </div>
    </div>
  );
}
