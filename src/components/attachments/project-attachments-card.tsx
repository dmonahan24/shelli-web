import * as React from "react";
import { FileUp } from "lucide-react";
import { toast } from "sonner";
import { AttachmentPreviewDialog } from "@/components/attachments/attachment-preview-dialog";
import { AttachmentUploadDialog } from "@/components/attachments/attachment-upload-dialog";
import { DocumentAttachmentList } from "@/components/attachments/document-attachment-list";
import { PhotoGalleryGrid } from "@/components/attachments/photo-gallery-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteProjectAttachmentServerFn } from "@/server/attachments/delete-project-attachment";
import { listProjectAttachmentsServerFn } from "@/server/attachments/list-project-attachments";

type AttachmentsResponse = Awaited<ReturnType<typeof listProjectAttachmentsServerFn>>;
type AttachmentRow = AttachmentsResponse["rows"][number];

export function ProjectAttachmentsCard({
  initialData,
  onMutationComplete,
  projectId,
}: {
  initialData: AttachmentsResponse | null;
  onMutationComplete: () => Promise<void> | void;
  projectId: string;
}) {
  const [attachments, setAttachments] = React.useState<AttachmentsResponse | null>(initialData);
  const [previewAttachmentId, setPreviewAttachmentId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setAttachments(initialData);
  }, [initialData]);

  const refresh = React.useCallback(async () => {
    if (!attachments) {
      return;
    }

    const response = await listProjectAttachmentsServerFn({
      data: {
        projectId,
        query: {
          page: attachments.page,
          pageSize: attachments.pageSize,
        },
      },
    });

    setAttachments(response);
  }, [attachments, projectId]);

  const previewAttachment =
    attachments?.rows.find((attachment) => attachment.id === previewAttachmentId) ?? null;
  const handleDelete = async (attachmentId: string) => {
    const result = await deleteProjectAttachmentServerFn({
      data: {
        attachmentId,
        projectId,
      },
    });

    if (!result.ok) {
      toast.error(result.formError ?? "Unable to delete attachment.");
      return;
    }

    toast.success(result.message ?? "Attachment deleted.");
    await refresh();
    await onMutationComplete();
  };
  const photoAttachments =
    attachments?.rows.filter((attachment) => attachment.mimeType.startsWith("image/")) ?? [];
  const documentAttachments =
    attachments?.rows.filter((attachment) => !attachment.mimeType.startsWith("image/")) ?? [];

  return (
    <>
      <Card className="rounded-[24px] border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Attachments</CardTitle>
            <p className="text-sm text-muted-foreground">
              Secure photos, delivery tickets, and inspection documents for this project.
            </p>
          </div>
          <AttachmentUploadDialog
            projectId={projectId}
            onUploaded={async () => {
              await refresh();
              await onMutationComplete();
            }}
            trigger={
              <Button>
                <FileUp className="mr-2 size-4" />
                Upload Files
              </Button>
            }
          />
        </CardHeader>
        <CardContent className="space-y-5">
          {!attachments ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">
              Loading project attachments...
            </div>
          ) : attachments.rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">
              No attachments yet. Upload documentation from the pour site, delivery tickets, or
              inspection records.
            </div>
          ) : (
            <>
              <PhotoGalleryGrid
                attachments={photoAttachments}
                onDelete={handleDelete}
                onPreview={(attachmentId) => setPreviewAttachmentId(attachmentId)}
              />
              <DocumentAttachmentList
                attachments={documentAttachments}
                onPreview={(attachmentId) => setPreviewAttachmentId(attachmentId)}
                onDelete={handleDelete}
              />
            </>
          )}
        </CardContent>
      </Card>
      <AttachmentPreviewDialog
        attachment={previewAttachment}
        open={Boolean(previewAttachment)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewAttachmentId(null);
          }
        }}
      />
    </>
  );
}
