import { createServerFn } from "@tanstack/start-client-core";
import { createAccountSchema } from "@/lib/validation/auth";
import { createAccount } from "@/server/auth/service";

export const createAccountServerFn = createServerFn({ method: "POST" })
  .validator(createAccountSchema)
  .handler(async ({ data }) => createAccount(data));
