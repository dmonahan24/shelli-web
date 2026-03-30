import { createServerFn } from "@tanstack/start-client-core";
import { z } from "zod";
import { listProjectAttachments } from "@/server/attachments/service";

const listProjectAttachmentsSchema = z.object({
  projectId: z.string().uuid("Invalid project id"),
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      pageSize: z.coerce.number().int().min(1).max(100).optional(),
    })
    .optional(),
});

export const listProjectAttachmentsServerFn = createServerFn({
  method: "GET",
})
  .inputValidator((input) => listProjectAttachmentsSchema.parse(input ?? {}))
  .handler(async ({ data }) => listProjectAttachments(data.projectId, data.query));
