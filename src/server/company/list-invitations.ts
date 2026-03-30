import { createServerFn } from "@tanstack/start-client-core";
import { listInvitations } from "@/server/company/service";

export const listInvitationsServerFn = createServerFn({ method: "GET" }).handler(
  async () => listInvitations()
);
