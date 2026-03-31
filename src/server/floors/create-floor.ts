import { createServerFn } from "@tanstack/start-client-core";
import { createFloorSchema } from "@/lib/validation/floor";
import { createFloor } from "@/server/floors/service";

export const createFloorServerFn = createServerFn({ method: "POST" })
  .validator(createFloorSchema)
  .handler(async ({ data }) => createFloor(data));
