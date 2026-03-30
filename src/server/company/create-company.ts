import { createServerFn } from "@tanstack/start-client-core";
import { companyOnboardingSchema } from "@/lib/validation/company";
import { completeCompanyOnboarding } from "@/server/company/service";

export const completeCompanyOnboardingServerFn = createServerFn({ method: "POST" })
  .validator(companyOnboardingSchema)
  .handler(async ({ data }) => completeCompanyOnboarding(data));
