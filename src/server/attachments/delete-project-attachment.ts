import { createServerFn } from "@tanstack/start-client-core";
import { deleteProjectAttachmentSchema } from "@/lib/validation/attachment";
import { deleteProjectAttachment } from "@/server/attachments/service";

export const deleteProjectAttachmentServerFn = createServerFn({ method: "POST" })
  .inputValidator(deleteProjectAttachmentSchema)
  .handler(async ({ data }) => deleteProjectAttachment(data));
