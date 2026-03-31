import { createServerFn } from "@tanstack/start-client-core";
import { createPourTypeSchema } from "@/lib/validation/pour-type";
import { createPourType } from "@/server/pour-types/service";

export const createPourTypeServerFn = createServerFn({ method: "POST" })
  .validator(createPourTypeSchema)
  .handler(async ({ data }) => createPourType(data));
