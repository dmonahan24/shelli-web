import { createServerFn } from "@tanstack/start-client-core";
import { deleteBuildingSchema } from "@/lib/validation/building";
import { deleteBuilding } from "@/server/buildings/service";

export const deleteBuildingServerFn = createServerFn({ method: "POST" })
  .validator(deleteBuildingSchema)
  .handler(async ({ data }) => deleteBuilding(data));
