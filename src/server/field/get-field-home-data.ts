import { createServerFn } from "@tanstack/start-client-core";
import { runWithRequestContext } from "@/lib/server/request-context";
import { getFieldHomeData } from "@/server/field/service";

export const getFieldHomeDataServerFn = createServerFn({ method: "GET" }).handler(
  async () =>
    runWithRequestContext("serverfn:field.home", async () => (await getFieldHomeData()) as any)
);
