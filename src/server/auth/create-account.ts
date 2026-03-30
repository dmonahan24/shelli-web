import { createServerFn } from "@tanstack/start-client-core";
import { createAccountSchema } from "@/lib/validation/auth";
import { createAccount } from "@/server/auth/service";

export const createAccountServerFn = createServerFn({ method: "POST" })
  .inputValidator(createAccountSchema)
  .handler(async ({ data }) => createAccount(data));
