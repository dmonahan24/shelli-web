import { createServerFn } from "@tanstack/start-client-core";
import { bulkAssignProjectMembersSchema } from "@/lib/validation/company";
import { bulkAssignProjectMembers } from "@/server/company/service";

export const bulkAssignProjectMembersServerFn = createServerFn({
  method: "POST",
})
  .validator(bulkAssignProjectMembersSchema)
  .handler(async ({ data }) => bulkAssignProjectMembers(data));
