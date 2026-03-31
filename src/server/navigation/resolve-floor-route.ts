import { createServerFn } from "@tanstack/start-client-core";
import { hierarchyFloorRouteParamsSchema } from "@/lib/validation/hierarchy";
import { resolveFloorRoute } from "@/server/navigation/service";

export const resolveFloorRouteServerFn = createServerFn({
  method: "GET",
})
  .validator(hierarchyFloorRouteParamsSchema)
  .handler(async ({ data }) => resolveFloorRoute(data, "view"));
