import { createServerFn } from "@tanstack/start-client-core";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { getResetPasswordTokenStatus, resetPassword } from "@/server/auth/service";

export const resetPasswordServerFn = createServerFn({ method: "POST" })
  .validator(resetPasswordSchema)
  .handler(async ({ data }) => resetPassword(data));

export const getResetPasswordTokenStatusServerFn = createServerFn({
  method: "GET",
})
  .validator((input: { token?: string }) => input)
  .handler(async ({ data }) => getResetPasswordTokenStatus(data.token));
