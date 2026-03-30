import { createServerFn } from "@tanstack/start-client-core";
import { projectAnalyticsQuerySchema } from "@/lib/validation/analytics";
import { getProjectAnalytics } from "@/server/analytics/service";

export const getProjectAnalyticsServerFn = createServerFn({ method: "GET" })
  .validator(projectAnalyticsQuerySchema)
  .handler(async ({ data }) => (await getProjectAnalytics(data)) as any);
