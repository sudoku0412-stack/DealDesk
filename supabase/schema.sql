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

-- Newer Supabase projects do not auto-grant API roles on tables created via SQL.
-- The API route (service role) needs these, or inserts fail with "permission denied".
grant usage on schema public to service_role;
grant select, insert on table public.waitlist to service_role;
