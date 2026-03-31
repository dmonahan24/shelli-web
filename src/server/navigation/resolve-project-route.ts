import { createServerFn } from "@tanstack/start-client-core";
import { projectRouteParamsSchema } from "@/lib/validation/project-list";
import { resolveProjectRoute } from "@/server/navigation/service";

export const resolveProjectRouteServerFn = createServerFn({
  method: "GET",
})
  .validator(projectRouteParamsSchema)
  .handler(async ({ data }) => resolveProjectRoute(data.projectIdentifier, "view"));
