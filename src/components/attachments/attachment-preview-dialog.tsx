import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AttachmentPreviewDialog({
  attachment,
  onOpenChange,
  open,
}: {
  attachment:
    | {
        fileUrl: string;
        mimeType: string;
        originalFileName: string;
      }
    | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-4xl">
        {attachment ? (
          <>
            <DialogHeader>
              <DialogTitle>{attachment.originalFileName}</DialogTitle>
            </DialogHeader>
            {attachment.mimeType.startsWith("image/") ? (
              <img
                src={attachment.fileUrl}
                alt={attachment.originalFileName}
                className="max-h-[70vh] w-full rounded-2xl object-contain"
              />
            ) : (
              <iframe
                src={attachment.fileUrl}
                title={attachment.originalFileName}
                className="h-[70vh] w-full rounded-2xl border"
              />
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
