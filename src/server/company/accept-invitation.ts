import { createServerFn } from "@tanstack/start-client-core";
import { acceptInvitationSchema } from "@/lib/validation/invitation";
import { acceptInvitation, getInvitationStatus } from "@/server/company/service";

export const acceptInvitationServerFn = createServerFn({ method: "POST" })
  .validator(acceptInvitationSchema)
  .handler(async ({ data }) => acceptInvitation(data));

export const getInvitationStatusServerFn = createServerFn({ method: "GET" }).handler(
  async ({ data }: { data?: { token?: string } }) => getInvitationStatus(data?.token)
);
