import { createServerFn } from "@tanstack/start-client-core";
import { deletePourTypeSchema } from "@/lib/validation/pour-type";
import { deletePourType } from "@/server/pour-types/service";

export const deletePourTypeServerFn = createServerFn({ method: "POST" })
  .validator(deletePourTypeSchema)
  .handler(async ({ data }) => deletePourType(data));
