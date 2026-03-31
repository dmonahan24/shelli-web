import { createServerFn } from "@tanstack/start-client-core";
import { hierarchyBuildingParamsSchema } from "@/lib/validation/hierarchy";
import { listFloorsForBuilding } from "@/server/floors/service";

export const listFloorsForBuildingServerFn = createServerFn({
  method: "GET",
})
  .validator(hierarchyBuildingParamsSchema)
  .handler(async ({ data }) => listFloorsForBuilding(data.buildingId));
