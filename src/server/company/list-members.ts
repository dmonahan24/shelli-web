import { createServerFn } from "@tanstack/start-client-core";
import { runWithRequestContext } from "@/lib/server/request-context";
import { getCompanyOverview, listMembers } from "@/server/company/service";

export const getCompanyOverviewServerFn = createServerFn({ method: "GET" }).handler(
  async () =>
    runWithRequestContext("serverfn:company.overview", async () => getCompanyOverview())
);

export const listMembersServerFn = createServerFn({ method: "GET" }).handler(async () =>
  runWithRequestContext("serverfn:company.members", async () => listMembers())
);
