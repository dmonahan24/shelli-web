import { z } from "zod";

const clientEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
});

function readClientEnv() {
  return {
    SUPABASE_URL:
      import.meta.env.VITE_SUPABASE_URL ??
      import.meta.env.PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY:
      import.meta.env.VITE_SUPABASE_ANON_KEY ??
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function getClientEnv() {
  const parsedEnv = clientEnvSchema.safeParse(readClientEnv());

  if (!parsedEnv.success) {
    throw new Error(
      `Invalid client environment configuration: ${parsedEnv.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ")}`
    );
  }

  return parsedEnv.data;
}
