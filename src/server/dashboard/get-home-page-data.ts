import { createServerFn } from "@tanstack/start-client-core";
import { runWithRequestContext } from "@/lib/server/request-context";
import {
  getDashboardHomeCriticalData,
  getDashboardHomeDeferredData,
} from "@/server/dashboard/service";

export const getDashboardHomeCriticalDataServerFn = createServerFn({
  method: "GET",
}).handler(
  async () =>
    (await runWithRequestContext("serverfn:dashboard.home_critical", async () =>
      getDashboardHomeCriticalData()
    )) as any
);

export const getDashboardHomeDeferredDataServerFn = createServerFn({
  method: "GET",
}).handler(
  async () =>
    (await runWithRequestContext("serverfn:dashboard.home_deferred", async () =>
      getDashboardHomeDeferredData()
    )) as any
);
