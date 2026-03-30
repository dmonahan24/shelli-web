import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";
import { DeleteAttachmentDialog } from "@/components/attachments/document-attachment-list";

export function PhotoGalleryGrid({
  attachments,
  onDelete,
  onPreview,
}: {
  attachments: Array<{
    caption: string | null;
    createdAt: Date;
    fileUrl: string;
    id: string;
    originalFileName: string;
    uploadedBy: string;
  }>;
  onDelete: (attachmentId: string) => Promise<void> | void;
  onPreview: (attachmentId: string) => void;
}) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        Photos
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="overflow-hidden rounded-2xl border border-border/70 bg-background text-left"
          >
            <button type="button" className="w-full" onClick={() => onPreview(attachment.id)}>
              <img
                src={attachment.fileUrl}
                alt={attachment.originalFileName}
                className="aspect-[4/3] w-full object-cover"
              />
            </button>
            <div className="space-y-1 p-4 text-sm">
              <p className="font-medium">{attachment.caption ?? attachment.originalFileName}</p>
              <p className="text-muted-foreground">
                {formatDate(attachment.createdAt)} • {attachment.uploadedBy}
              </p>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => onPreview(attachment.id)}>
                  View
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={`${attachment.fileUrl}?download=1`}>Download</a>
                </Button>
                <DeleteAttachmentDialog
                  attachmentId={attachment.id}
                  fileName={attachment.originalFileName}
                  onDelete={onDelete}
                  trigger={
                    <Button size="sm" variant="destructive">
                      Delete
                    </Button>
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
