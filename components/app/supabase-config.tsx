"use client";

import { configureSupabase } from "@/lib/supabase/client";

/** Passes the public Supabase URL and anon key from the server to client components at runtime. */
export function SupabaseConfig({ url, anonKey, children }: { url: string; anonKey: string; children: React.ReactNode }) {
  configureSupabase(url, anonKey);
  return <>{children}</>;
}
