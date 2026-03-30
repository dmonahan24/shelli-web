import { createServerFn } from "@tanstack/start-client-core";
import { updateMembershipRoleSchema } from "@/lib/validation/company";
import { updateMemberRole } from "@/server/company/service";

export const updateMemberRoleServerFn = createServerFn({ method: "POST" })
  .validator(updateMembershipRoleSchema)
  .handler(async ({ data }) => updateMemberRole(data));
