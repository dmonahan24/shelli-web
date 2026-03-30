import { createServerFn } from "@tanstack/start-client-core";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { forgotPassword } from "@/server/auth/service";

export const forgotPasswordServerFn = createServerFn({ method: "POST" })
  .validator(forgotPasswordSchema)
  .handler(async ({ data }) => forgotPassword(data));
