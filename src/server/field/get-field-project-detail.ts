import { createServerFn } from "@tanstack/start-client-core";
import { z } from "zod";
import { getFieldProjectDetail } from "@/server/field/service";

export const getFieldProjectDetailServerFn = createServerFn({ method: "GET" })
  .validator(z.object({ projectId: z.string().uuid() }))
  .handler(async ({ data }) => (await getFieldProjectDetail(data.projectId)) as any);
