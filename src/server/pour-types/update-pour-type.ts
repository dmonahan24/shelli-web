import { createServerFn } from "@tanstack/start-client-core";
import { updatePourTypeSchema } from "@/lib/validation/pour-type";
import { updatePourType } from "@/server/pour-types/service";

export const updatePourTypeServerFn = createServerFn({ method: "POST" })
  .validator(updatePourTypeSchema)
  .handler(async ({ data }) => updatePourType(data));
