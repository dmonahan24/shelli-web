import { createServerFn } from "@tanstack/start-client-core";
import { quickPourSchema } from "@/lib/validation/field";
import { createQuickPour } from "@/server/field/service";

export const createQuickPourServerFn = createServerFn({ method: "POST" })
  .validator(quickPourSchema)
  .handler(async ({ data }) => createQuickPour(data));
