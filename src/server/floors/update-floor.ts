import { createServerFn } from "@tanstack/start-client-core";
import { updateFloorSchema } from "@/lib/validation/floor";
import { updateFloor } from "@/server/floors/service";

export const updateFloorServerFn = createServerFn({ method: "POST" })
  .validator(updateFloorSchema)
  .handler(async ({ data }) => updateFloor(data));
