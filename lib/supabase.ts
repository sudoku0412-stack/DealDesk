import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** Server-only Supabase client using the service role key. Returns null if missing or misconfigured. */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;

  try {
    client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    return client;
  } catch (err) {
    console.error(
      "[waitlist] could not create Supabase client; check SUPABASE_URL is exactly https://<ref>.supabase.co:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
