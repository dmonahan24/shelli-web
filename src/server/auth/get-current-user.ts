import { createServerFn } from "@tanstack/start-client-core";
import { getAuthenticatedUser } from "@/server/auth/service";

export const getCurrentUserServerFn = createServerFn({ method: "GET" }).handler(
  async () => getAuthenticatedUser()
);
