import { createServerFn } from "@tanstack/start-client-core";
import { hierarchyFloorParamsSchema } from "@/lib/validation/hierarchy";
import { listPourTypesForFloor } from "@/server/pour-types/service";

export const listPourTypesForFloorServerFn = createServerFn({
  method: "GET",
})
  .validator(hierarchyFloorParamsSchema)
  .handler(async ({ data }) => listPourTypesForFloor(data.floorId));
