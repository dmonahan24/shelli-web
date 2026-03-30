import { createServerFn } from "@tanstack/start-client-core";
import {
  grantPlatformAdminSchema,
  revokePlatformAdminSchema,
} from "@/lib/validation/admin";
import {
  grantPlatformAdmin,
  listPlatformAdmins,
  revokePlatformAdmin,
} from "@/server/admin/service";

export const listPlatformAdminsServerFn = createServerFn({ method: "GET" }).handler(
  async () => listPlatformAdmins()
);

export const grantPlatformAdminServerFn = createServerFn({ method: "POST" })
  .validator(grantPlatformAdminSchema)
  .handler(async ({ data }) => grantPlatformAdmin(data));

export const revokePlatformAdminServerFn = createServerFn({ method: "POST" })
  .validator(revokePlatformAdminSchema)
  .handler(async ({ data }) => revokePlatformAdmin(data));
