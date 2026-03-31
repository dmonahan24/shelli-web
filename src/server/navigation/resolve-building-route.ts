import { createServerFn } from "@tanstack/start-client-core";
import { hierarchyBuildingRouteParamsSchema } from "@/lib/validation/hierarchy";
import { resolveBuildingRoute } from "@/server/navigation/service";

export const resolveBuildingRouteServerFn = createServerFn({
  method: "GET",
})
  .validator(hierarchyBuildingRouteParamsSchema)
  .handler(async ({ data }) => resolveBuildingRoute(data, "view"));
