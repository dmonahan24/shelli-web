import { createServerFn } from "@tanstack/start-client-core";
import { projectListQuerySchema } from "@/lib/validation/project-list";
import { listProjects } from "@/server/projects/service";

export const listProjectsServerFn = createServerFn({
  method: "GET",
})
  .inputValidator((input) => projectListQuerySchema.parse(input ?? {}))
  .handler(async ({ data }) => listProjects(data));

export const listProjectsForCurrentUserServerFn = listProjectsServerFn;
