import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const SUPABASE_PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function authConfigured() {
  return !!SUPABASE_PUBLIC_URL && !!SUPABASE_ANON_KEY;
}

/** Cookie-aware Supabase client for server components and route handlers (acts as the signed-in user, RLS applies). */
export async function createClient() {
  const store = await cookies();
  return createServerClient(SUPABASE_PUBLIC_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* called from a server component; middleware refreshes the session */
        }
      },
    },
  });
}
