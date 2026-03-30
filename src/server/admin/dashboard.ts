import { createServerFn } from "@tanstack/start-client-core";
import { getAdminDashboardData } from "@/server/admin/service";

export const getAdminDashboardServerFn = createServerFn({ method: "GET" }).handler(
  async () => getAdminDashboardData()
);
