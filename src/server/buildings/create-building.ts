import { createServerFn } from "@tanstack/start-client-core";
import { createBuildingSchema } from "@/lib/validation/building";
import { createBuilding } from "@/server/buildings/service";

export const createBuildingServerFn = createServerFn({ method: "POST" })
  .validator(createBuildingSchema)
  .handler(async ({ data }) => createBuilding(data));
