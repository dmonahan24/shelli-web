import { createServerFn } from "@tanstack/start-client-core";
import { hierarchyFloorParamsSchema } from "@/lib/validation/hierarchy";
import { getFloorDetail } from "@/server/floors/service";

export const getFloorDetailServerFn = createServerFn({
  method: "GET",
})
  .validator(hierarchyFloorParamsSchema)
  .handler(async ({ data }) => getFloorDetail(data.floorId));
