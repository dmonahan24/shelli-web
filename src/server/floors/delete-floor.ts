import { createServerFn } from "@tanstack/start-client-core";
import { deleteFloorSchema } from "@/lib/validation/floor";
import { deleteFloor } from "@/server/floors/service";

export const deleteFloorServerFn = createServerFn({ method: "POST" })
  .validator(deleteFloorSchema)
  .handler(async ({ data }) => deleteFloor(data));
