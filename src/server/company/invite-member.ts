import { createServerFn } from "@tanstack/start-client-core";
import { inviteMemberSchema, resendInvitationSchema, revokeInvitationSchema } from "@/lib/validation/company";
import { inviteMember, resendInvitation, revokeInvitation } from "@/server/company/service";

export const inviteMemberServerFn = createServerFn({ method: "POST" })
  .validator(inviteMemberSchema)
  .handler(async ({ data }) => inviteMember(data));

export const resendInvitationServerFn = createServerFn({ method: "POST" })
  .validator(resendInvitationSchema)
  .handler(async ({ data }) => resendInvitation(data));

export const revokeInvitationServerFn = createServerFn({ method: "POST" })
  .validator(revokeInvitationSchema)
  .handler(async ({ data }) => revokeInvitation(data));
