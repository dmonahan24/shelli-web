import { createServerFn } from "@tanstack/start-client-core";
import {
  listProjectAccessRostersSchema,
  projectAccessRosterParamsSchema,
} from "@/lib/validation/company";
import {
  getProjectAccessRoster,
  listProjectAccessRosters,
} from "@/server/company/service";

export const getProjectAccessRosterServerFn = createServerFn({
  method: "GET",
})
  .validator(projectAccessRosterParamsSchema)
  .handler(async ({ data }) => getProjectAccessRoster(data));

export const listProjectAccessRostersServerFn = createServerFn({
  method: "POST",
})
  .validator(listProjectAccessRostersSchema)
  .handler(async ({ data }) => listProjectAccessRosters(data));
