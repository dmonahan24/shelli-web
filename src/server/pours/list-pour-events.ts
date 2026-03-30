import { createServerFn } from "@tanstack/start-client-core";
import { z } from "zod";
import { pourEventListQuerySchema } from "@/lib/validation/pour-event";
import { listProjectPours } from "@/server/pours/service";

const listProjectPoursSchema = z.object({
  projectId: z.string().uuid("Invalid project id"),
  query: pourEventListQuerySchema.optional(),
});

export const listProjectPoursServerFn = createServerFn({
  method: "GET",
})
  .validator((input) => listProjectPoursSchema.parse(input ?? {}))
  .handler(async ({ data }) => listProjectPours(data.projectId, data.query));
