import { createServerFn } from "@tanstack/start-client-core";
import { hierarchyProjectParamsSchema } from "@/lib/validation/hierarchy";
import { listBuildingsForProject } from "@/server/buildings/service";

export const listBuildingsForProjectServerFn = createServerFn({
  method: "GET",
})
  .validator(hierarchyProjectParamsSchema)
  .handler(async ({ data }) => listBuildingsForProject(data.projectId));
