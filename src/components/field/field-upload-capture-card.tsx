import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { uploadFieldAttachmentServerFn } from "@/server/field/upload-field-attachment";

const attachmentTypes = [
  { value: "photo", label: "Photo" },
  { value: "delivery_ticket", label: "Delivery Ticket" },
  { value: "inspection_doc", label: "Inspection" },
  { value: "other", label: "Other" },
] as const;

export function AttachmentTypeChips({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {attachmentTypes.map((type) => (
        <button
          key={type.value}
          type="button"
          className={`rounded-full px-3 py-2 text-sm font-medium ${
            value === type.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
          onClick={() => onChange(type.value)}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}

export function MobilePhotoPreview({ file }: { file: File | null }) {
  if (!file) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-3 text-sm">
      Ready to upload: <span className="font-medium">{file.name}</span>
    </div>
  );
}

export function UploadProgressCard({ pending }: { pending: boolean }) {
  return pending ? (
    <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
      Uploading file...
    </div>
  ) : null;
}

export function FieldUploadCaptureCard({ projectId }: { projectId: string }) {
  const [attachmentType, setAttachmentType] = React.useState("photo");
  const [caption, setCaption] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [isPending, startTransition] = React.useTransition();

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-lg">Upload Documentation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AttachmentTypeChips value={attachmentType} onChange={setAttachmentType} />
        <Input type="file" accept="image/*,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        <MobilePhotoPreview file={file} />
        <Input placeholder="Optional caption" value={caption} onChange={(event) => setCaption(event.target.value)} />
        <UploadProgressCard pending={isPending} />
        <Button
          disabled={!file || isPending}
          className="w-full"
          onClick={() => {
            if (!file) {
              return;
            }

            startTransition(async () => {
              const formData = new FormData();
              formData.set("projectId", projectId);
              formData.set("attachmentType", attachmentType);
              formData.set("caption", caption);
              formData.set("file", file);
              const result = await uploadFieldAttachmentServerFn({ data: formData });

              if (!result.ok) {
                toast.error(result.formError ?? "Unable to upload the file.");
                return;
              }

              toast.success(result.message ?? "Upload complete.");
              setCaption("");
              setFile(null);
            });
          }}
        >
          Upload File
        </Button>
      </CardContent>
    </Card>
  );
}
