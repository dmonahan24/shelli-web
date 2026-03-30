import { createServerFn } from "@tanstack/start-client-core";
import { companyAnalyticsQuerySchema } from "@/lib/validation/analytics";
import { getCompanyAnalyticsOverview } from "@/server/analytics/service";

export const getCompanyAnalyticsOverviewServerFn = createServerFn({ method: "GET" })
  .validator(companyAnalyticsQuerySchema)
  .handler(async ({ data }) => (await getCompanyAnalyticsOverview(data)) as any);
