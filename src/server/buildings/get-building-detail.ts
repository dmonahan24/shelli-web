import { createServerFn } from "@tanstack/start-client-core";
import { hierarchyBuildingParamsSchema } from "@/lib/validation/hierarchy";
import { getBuildingDetail } from "@/server/buildings/service";

export const getBuildingDetailServerFn = createServerFn({
  method: "GET",
})
  .validator(hierarchyBuildingParamsSchema)
  .handler(async ({ data }) => getBuildingDetail(data.buildingId));
