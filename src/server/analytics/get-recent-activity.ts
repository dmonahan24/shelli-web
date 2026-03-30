import { createServerFn } from "@tanstack/start-client-core";
import { companyAnalyticsQuerySchema } from "@/lib/validation/analytics";
import { getRecentFieldActivity } from "@/server/analytics/service";

export const getRecentActivityServerFn = createServerFn({ method: "GET" })
  .validator(companyAnalyticsQuerySchema)
  .handler(async ({ data }) => (await getRecentFieldActivity(data)) as any);
