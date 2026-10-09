import { createBrowserClient } from "@supabase/ssr";

let config: { url: string; key: string } | null = null;
let client: ReturnType<typeof createBrowserClient> | null = null;

/** Called once by <SupabaseConfig> with values the server read at request time (not baked in at build). */
export function configureSupabase(url: string, key: string) {
  if (config?.url !== url || config?.key !== key) client = null;
  config = { url, key };
}

export function supabaseBrowser() {
  if (!config) throw new Error("Supabase is not configured");
  client ??= createBrowserClient(config.url, config.key);
  return client;
}
