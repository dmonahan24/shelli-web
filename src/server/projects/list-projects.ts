import { createServerFn } from "@tanstack/start-client-core";
import { runWithRequestContext } from "@/lib/server/request-context";
import { projectListQuerySchema } from "@/lib/validation/project-list";
import { listProjects } from "@/server/projects/service";

export const listProjectsServerFn = createServerFn({
  method: "GET",
})
  .validator((input) => projectListQuerySchema.parse(input ?? {}))
  .handler(async ({ data }) =>
    runWithRequestContext("serverfn:projects.list", async () => listProjects(data))
  );

export const listProjectsForCurrentUserServerFn = listProjectsServerFn;
