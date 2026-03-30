import { createServerFn } from "@tanstack/start-client-core";
import { createPourEventSchema } from "@/lib/validation/pour-event";
import { createPourEvent } from "@/server/pours/service";

export const createPourEventServerFn = createServerFn({ method: "POST" })
  .validator(createPourEventSchema)
  .handler(async ({ data }) => createPourEvent(data));
