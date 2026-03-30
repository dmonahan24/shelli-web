import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env/server";

let browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  }

  return browserClient;
}
