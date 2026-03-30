import * as React from "react";
import { toast } from "sonner";
import { AttachmentDropzone } from "@/components/attachments/attachment-dropzone";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { attachmentTypeValues } from "@/lib/validation/attachment";
import { uploadProjectAttachmentServerFn } from "@/server/attachments/upload-project-attachment";

export function AttachmentUploadDialog({
  onUploaded,
  projectId,
  trigger,
}: {
  onUploaded: () => Promise<void> | void;
  projectId: string;
  trigger: React.ReactNode;
}) {
  const [caption, setCaption] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const [attachmentType, setAttachmentType] = React.useState<string>("photo");
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <AttachmentDropzone files={files} onChange={setFiles} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Attachment Type</Label>
              <Select value={attachmentType} onValueChange={setAttachmentType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select file type" />
                </SelectTrigger>
                <SelectContent>
                  {attachmentTypeValues.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Caption</Label>
              <Input
                placeholder="Optional caption"
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={isPending || files.length === 0}
              onClick={() =>
                startTransition(async () => {
                  const formData = new FormData();
                  formData.set("projectId", projectId);
                  formData.set("attachmentType", attachmentType);
                  formData.set("caption", caption);

                  for (const file of files) {
                    formData.append("files", file);
                  }

                  const result = await uploadProjectAttachmentServerFn({
                    data: formData,
                  });

                  if (!result.ok) {
                    toast.error(result.formError ?? "Unable to upload attachments.");
                    return;
                  }

                  toast.success(result.message ?? "Attachments uploaded.");
                  setCaption("");
                  setFiles([]);
                  setOpen(false);
                  await onUploaded();
                })
              }
            >
              {isPending ? "Uploading..." : "Upload Files"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
