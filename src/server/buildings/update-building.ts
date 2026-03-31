import { createServerFn } from "@tanstack/start-client-core";
import { updateBuildingSchema } from "@/lib/validation/building";
import { updateBuilding } from "@/server/buildings/service";

export const updateBuildingServerFn = createServerFn({ method: "POST" })
  .validator(updateBuildingSchema)
  .handler(async ({ data }) => updateBuilding(data));
