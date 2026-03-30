import { createServerFn } from "@tanstack/start-client-core";
import { signInSchema } from "@/lib/validation/auth";
import { signIn } from "@/server/auth/service";

export const signInServerFn = createServerFn({ method: "POST" })
  .inputValidator(signInSchema)
  .handler(async ({ data }) => signIn(data));
