import { createServerFn } from "@tanstack/start-client-core";
import { updatePourEventSchema } from "@/lib/validation/pour-event";
import { updatePourEvent } from "@/server/pours/service";

export const updatePourEventServerFn = createServerFn({ method: "POST" })
  .validator(updatePourEventSchema)
  .handler(async ({ data }) => updatePourEvent(data));
