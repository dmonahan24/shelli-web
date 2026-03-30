import { createServerFn } from "@tanstack/start-client-core";
import { getFieldHomeData } from "@/server/field/service";

export const getFieldHomeDataServerFn = createServerFn({ method: "GET" }).handler(
  async () => (await getFieldHomeData()) as any
);
