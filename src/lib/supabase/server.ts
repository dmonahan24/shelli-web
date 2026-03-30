import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env/server";

function createBaseClient(supabaseKey: string) {
  return createClient(env.SUPABASE_URL, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export function createSupabaseServerClient() {
  return createBaseClient(env.SUPABASE_ANON_KEY);
}

export function createSupabaseAdminClient() {
  return createBaseClient(env.SUPABASE_SERVICE_ROLE_KEY);
}
