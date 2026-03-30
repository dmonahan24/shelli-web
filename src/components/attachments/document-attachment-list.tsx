import * as React from "react";
import { FileText, MoreHorizontal } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatFileSize } from "@/lib/utils/format";

export function DocumentAttachmentList({
  attachments,
  onDelete,
  onPreview,
}: {
  attachments: Array<{
    attachmentType: string;
    createdAt: Date;
    fileSizeBytes: number;
    fileUrl: string;
    id: string;
    isPreviewable: boolean;
    originalFileName: string;
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
        Documents
      </h3>
      <div className="space-y-3">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background p-4"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
                <FileText className="size-5" />
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{attachment.originalFileName}</p>
                <p className="text-muted-foreground">
                  {attachment.attachmentType.replaceAll("_", " ")} •{" "}
                  {formatFileSize(attachment.fileSizeBytes)} • {formatDate(attachment.createdAt)}
                </p>
              </div>
            </div>
            <AttachmentRowActions
              attachment={attachment}
              onDelete={onDelete}
              onPreview={onPreview}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AttachmentRowActions({
  attachment,
  onDelete,
  onPreview,
}: {
  attachment: {
    fileUrl: string;
    id: string;
    isPreviewable: boolean;
    originalFileName: string;
  };
  onDelete: (attachmentId: string) => Promise<void> | void;
  onPreview: (attachmentId: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {attachment.isPreviewable ? (
          <DropdownMenuItem onClick={() => onPreview(attachment.id)}>View</DropdownMenuItem>
        ) : null}
        <DropdownMenuItem asChild>
          <a href={`${attachment.fileUrl}?download=1`}>Download</a>
        </DropdownMenuItem>
        <DeleteAttachmentDialog
          attachmentId={attachment.id}
          fileName={attachment.originalFileName}
          onDelete={onDelete}
          trigger={
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(event) => event.preventDefault()}
            >
              Delete
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DeleteAttachmentDialog({
  attachmentId,
  fileName,
  onDelete,
  trigger,
}: {
  attachmentId: string;
  fileName: string;
  onDelete: (attachmentId: string) => Promise<void> | void;
  trigger: React.ReactNode;
}) {
  const [isPending, startTransition] = React.useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete attachment?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove {fileName} from the project record.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              startTransition(async () => {
                await onDelete(attachmentId);
              });
            }}
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
