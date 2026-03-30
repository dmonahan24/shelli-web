import { serveProjectAttachmentFile } from "@/server/attachments/service";

export async function serveProjectAttachment(input: {
  projectId: string;
  attachmentId: string;
  request: Request;
}) {
  return serveProjectAttachmentFile(input);
}
