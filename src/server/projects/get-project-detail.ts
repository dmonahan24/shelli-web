import { createServerFn } from "@tanstack/start-client-core";
import { projectDetailParamsSchema } from "@/lib/validation/project-list";
import { getProjectDetail } from "@/server/projects/service";

export const getProjectDetailServerFn = createServerFn({
  method: "GET",
})
  .inputValidator(projectDetailParamsSchema)
  .handler(async ({ data }) => getProjectDetail(data));
