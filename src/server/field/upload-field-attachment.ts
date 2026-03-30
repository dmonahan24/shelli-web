import { createServerFn } from "@tanstack/start-client-core";
import { uploadFieldAttachment } from "@/server/field/service";

export const uploadFieldAttachmentServerFn = createServerFn({ method: "POST" })
  .validator((input: FormData) => input)
  .handler(async ({ data }) => uploadFieldAttachment(data));
