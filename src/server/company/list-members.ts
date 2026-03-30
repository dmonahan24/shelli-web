import { createServerFn } from "@tanstack/start-client-core";
import { getCompanyOverview, listMembers } from "@/server/company/service";

export const getCompanyOverviewServerFn = createServerFn({ method: "GET" }).handler(
  async () => getCompanyOverview()
);

export const listMembersServerFn = createServerFn({ method: "GET" }).handler(async () => listMembers());
