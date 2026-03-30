import { createServerFn } from "@tanstack/start-client-core";
import { uploadProjectAttachment } from "@/server/attachments/service";

export const uploadProjectAttachmentServerFn = createServerFn({
  method: "POST",
})
  .validator((input: FormData) => input)
  .handler(async ({ data }) => uploadProjectAttachment(data));
