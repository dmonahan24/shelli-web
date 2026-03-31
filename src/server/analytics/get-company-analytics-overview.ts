import { createServerFn } from "@tanstack/start-client-core";
import { runWithRequestContext } from "@/lib/server/request-context";
import { companyAnalyticsQuerySchema } from "@/lib/validation/analytics";
import { getCompanyAnalyticsOverview } from "@/server/analytics/service";

export const getCompanyAnalyticsOverviewServerFn = createServerFn({ method: "GET" })
  .validator(companyAnalyticsQuerySchema)
  .handler(async ({ data }) =>
    runWithRequestContext("serverfn:analytics.company_overview", async () =>
      (await getCompanyAnalyticsOverview(data)) as any
    )
  );
