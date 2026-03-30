import { createServerFn } from "@tanstack/start-client-core";
import { deletePourEventSchema } from "@/lib/validation/pour-event";
import { deletePourEvent } from "@/server/pours/service";

export const deletePourEventServerFn = createServerFn({ method: "POST" })
  .validator(deletePourEventSchema)
  .handler(async ({ data }) => deletePourEvent(data));
