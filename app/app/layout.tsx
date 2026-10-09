import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, SUPABASE_ANON_KEY, SUPABASE_PUBLIC_URL } from "@/lib/supabase/server";
import { SupabaseConfig } from "@/components/app/supabase-config";
import { Logo } from "@/components/nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppNav } from "@/components/app/app-nav";
import type { Profile } from "@/lib/app/types";

export const metadata: Metadata = { title: { default: "App", template: "%s | DealDesk" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[220px_1fr]">
      <aside className="sticky top-0 z-30 hidden h-dvh flex-col border-r border-line bg-bg-2/60 p-4 md:flex">
        <Link href="/app" aria-label="DealDesk app home" className="px-2 py-2">
          <Logo />
        </Link>
        <AppNav orientation="side" />
        <div className="mt-auto space-y-3 px-2 text-sm">
          <p className="truncate text-muted" title={profile?.email}>
            {profile?.display_name || profile?.email}
          </p>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form method="post" action="/auth/signout">
              <button className="h-10 rounded-full border border-line px-4 text-sm font-semibold hover:bg-surface">Sign out</button>
            </form>
          </div>
        </div>
      </aside>

      <div className="min-w-0 pb-24 md:pb-0">
        <header className="flex items-center justify-between border-b border-line px-4 py-3 md:hidden">
          <Link href="/app" aria-label="DealDesk app home">
            <Logo />
          </Link>
          <ThemeToggle />
        </header>
        <main id="main" className="mx-auto max-w-7xl p-4 sm:p-6">
          <SupabaseConfig url={SUPABASE_PUBLIC_URL!} anonKey={SUPABASE_ANON_KEY!}>
            {children}
          </SupabaseConfig>
        </main>
      </div>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 backdrop-blur-xl md:hidden">
        <AppNav orientation="bottom" />
      </nav>
    </div>
  );
}
