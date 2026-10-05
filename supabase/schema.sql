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

-- Visitor analytics (first-party, no cookies, no IP stored).
-- `visitor` is a daily-rotating salted hash, so it can count unique visitors per day but cannot identify anyone.
create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  visitor text not null,
  path text not null,
  referrer text,
  country text
);

create index if not exists page_views_created_at_idx on public.page_views (created_at);

alter table public.page_views enable row level security;

grant insert, select on table public.page_views to service_role;
