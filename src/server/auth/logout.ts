import { createServerFn } from "@tanstack/start-client-core";
import { deleteSession } from "@/lib/auth/session";
import { failure, success } from "@/lib/utils/action-result";

export const logoutServerFn = createServerFn({ method: "POST" }).handler(
  async () => {
    try {
      await deleteSession();
      return success({ redirectTo: "/auth/sign-in" }, "Signed out.");
    } catch {
      return failure("logout_failed", "Unable to sign out right now.");
    }
  }
);
