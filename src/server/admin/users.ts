import { createServerFn } from "@tanstack/start-client-core";
import {
  toggleAdminUserActiveSchema,
  updateAdminUserAccessSchema,
} from "@/lib/validation/admin";
import {
  listAdminUsers,
  toggleAdminUserActive,
  updateAdminUserAccess,
} from "@/server/admin/service";

export const listAdminUsersServerFn = createServerFn({ method: "GET" }).handler(
  async () => listAdminUsers()
);

export const updateAdminUserAccessServerFn = createServerFn({ method: "POST" })
  .validator(updateAdminUserAccessSchema)
  .handler(async ({ data }) => updateAdminUserAccess(data));

export const toggleAdminUserActiveServerFn = createServerFn({ method: "POST" })
  .validator(toggleAdminUserActiveSchema)
  .handler(async ({ data }) => toggleAdminUserActive(data));
