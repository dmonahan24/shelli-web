import { createServerFn } from "@tanstack/start-client-core";
import { bulkCreateFloorsSchema } from "@/lib/validation/floor";
import { bulkCreateFloors } from "@/server/floors/service";

export const bulkCreateFloorsServerFn = createServerFn({ method: "POST" })
  .validator(bulkCreateFloorsSchema)
  .handler(async ({ data }) => bulkCreateFloors(data));
