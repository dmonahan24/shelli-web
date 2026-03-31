import { createServerFn } from "@tanstack/start-client-core";
import { applyPourTypePresetBundleSchema } from "@/lib/validation/pour-type";
import { applyPourTypePresetBundle } from "@/server/pour-types/service";

export const applyPourTypePresetBundleServerFn = createServerFn({ method: "POST" })
  .validator(applyPourTypePresetBundleSchema)
  .handler(async ({ data }) => applyPourTypePresetBundle(data));
