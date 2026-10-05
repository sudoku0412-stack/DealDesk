-- DealDesk waitlist table. Run in the Supabase SQL editor.
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  platform text not null check (platform in ('YouTube', 'TikTok', 'Instagram', 'Twitch', 'Other')),
  created_at timestamptz not null default now(),
  constraint waitlist_email_key unique (email),
  constraint waitlist_email_lowercase check (email = lower(email))
);

create index if not exists waitlist_created_at_idx on public.waitlist (created_at);

-- Lock the table down. The API uses the service role key, which bypasses RLS.
-- With no policies, the public anon key cannot read or write anything.
alter table public.waitlist enable row level security;
