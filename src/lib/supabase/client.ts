import { createClient } from "@supabase/supabase-js";
import { getClientEnv } from "@/lib/env/client";

let browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    const env = getClientEnv();
    browserClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  }

  return browserClient;
}
