import { createServerFn } from "@tanstack/start-client-core";
import { runWithRequestContext } from "@/lib/server/request-context";
import { getAuthenticatedPrincipal } from "@/server/auth/service";

export const getCurrentPrincipalServerFn = createServerFn({ method: "GET" }).handler(
  async () =>
    runWithRequestContext("serverfn:auth.current_principal", async () =>
      getAuthenticatedPrincipal()
    )
);

export const getCurrentUserServerFn = getCurrentPrincipalServerFn;
