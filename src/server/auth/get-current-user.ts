import { createServerFn } from "@tanstack/start-client-core";
import { getAuthenticatedPrincipal } from "@/server/auth/service";

export const getCurrentPrincipalServerFn = createServerFn({ method: "GET" }).handler(
  async () => getAuthenticatedPrincipal()
);

export const getCurrentUserServerFn = getCurrentPrincipalServerFn;
