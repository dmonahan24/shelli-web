import { createServerFn } from "@tanstack/start-client-core";
import { assignProjectMemberSchema } from "@/lib/validation/company";
import { assignProjectMember } from "@/server/company/service";

export const assignProjectMemberServerFn = createServerFn({ method: "POST" })
  .validator(assignProjectMemberSchema)
  .handler(async ({ data }) => assignProjectMember(data));
