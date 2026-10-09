-- DealDesk app schema. Run in the Supabase SQL editor AFTER schema.sql (waitlist). Safe to re-run.

-- ───────────── profiles ─────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  currency text not null default 'USD' check (currency in ('USD','CAD','EUR','GBP','AUD','INR')),
  plan text not null default 'free' check (plan in ('free','pro')),
  public_slug text not null unique default substr(md5(random()::text || clock_timestamp()::text), 1, 10),
  rate_card_public boolean not null default false,
  rate_card_intro text,
  reminders_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email) values (new.id, lower(new.email)) on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for users that already exist.
insert into public.profiles (id, email) select id, lower(email) from auth.users on conflict (id) do nothing;

-- ───────────── deals ─────────────
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  brand text not null check (char_length(brand) between 1 and 120),
  contact_name text check (char_length(contact_name) <= 120),
  contact_email text check (char_length(contact_email) <= 254),
  platform text check (platform in ('YouTube','TikTok','Instagram','Twitch','Other')),
  amount_cents bigint not null default 0 check (amount_cents >= 0),
  stage text not null default 'pitched' check (stage in ('pitched','negotiating','signed','delivered','paid')),
  notes text check (char_length(notes) <= 5000),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists deals_user_idx on public.deals (user_id, stage);

create table if not exists public.deliverables (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  due_date date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists deliverables_user_due_idx on public.deliverables (user_id, due_date);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label text not null default 'Payment' check (char_length(label) between 1 and 120),
  amount_cents bigint not null check (amount_cents >= 0),
  invoiced_on date,
  due_on date,
  paid_on date,
  created_at timestamptz not null default now()
);
create index if not exists payments_user_due_idx on public.payments (user_id, due_on);

create table if not exists public.rate_card_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 120),
  description text check (char_length(description) <= 300),
  price_cents bigint not null check (price_cents >= 0),
  sort integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists rate_items_user_idx on public.rate_card_items (user_id, sort);

create table if not exists public.reminders_sent (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  ref_id uuid not null,
  sent_on date not null default current_date
);
create index if not exists reminders_ref_idx on public.reminders_sent (kind, ref_id, sent_on);

-- ───────────── triggers ─────────────
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists deals_touch on public.deals;
create trigger deals_touch before update on public.deals for each row execute function public.touch_updated_at();

-- Free plan: at most 3 active (not paid, not archived) deals.
create or replace function public.enforce_free_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare active_count integer; user_plan text;
begin
  if new.stage <> 'paid' and not new.archived then
    select plan into user_plan from public.profiles where id = new.user_id;
    if coalesce(user_plan, 'free') = 'free' then
      select count(*) into active_count from public.deals
        where user_id = new.user_id and stage <> 'paid' and not archived and id <> new.id;
      if active_count >= 3 then raise exception 'free_limit'; end if;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists deals_free_limit on public.deals;
create trigger deals_free_limit before insert or update of stage, archived on public.deals
  for each row execute function public.enforce_free_limit();

-- Stage rule: a deal can only move to Delivered once it has deliverables and every one is done.
create or replace function public.enforce_stage_rules() returns trigger
language plpgsql security definer set search_path = '' as $$
declare total integer; open_count integer;
begin
  if new.stage = 'delivered' and (tg_op = 'INSERT' or old.stage is distinct from 'delivered') then
    select count(*), count(*) filter (where not done) into total, open_count
      from public.deliverables where deal_id = new.id;
    if total = 0 or open_count > 0 then raise exception 'deliverables_incomplete'; end if;
  end if;
  return new;
end $$;

drop trigger if exists deals_stage_rules on public.deals;
create trigger deals_stage_rules before insert or update of stage on public.deals
  for each row execute function public.enforce_stage_rules();

-- ───────────── row level security ─────────────
alter table public.profiles enable row level security;
alter table public.deals enable row level security;
alter table public.deliverables enable row level security;
alter table public.payments enable row level security;
alter table public.rate_card_items enable row level security;
alter table public.reminders_sent enable row level security;

drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "own deals" on public.deals;
create policy "own deals" on public.deals for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own deliverables" on public.deliverables;
create policy "own deliverables" on public.deliverables for all to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.deals d where d.id = deal_id and d.user_id = auth.uid()));

drop policy if exists "own payments" on public.payments;
create policy "own payments" on public.payments for all to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.deals d where d.id = deal_id and d.user_id = auth.uid()));

drop policy if exists "own rate items" on public.rate_card_items;
create policy "own rate items" on public.rate_card_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- reminders_sent: no policies. Only the service role (cron job) touches it.

-- ───────────── grants ─────────────
grant usage on schema public to authenticated, service_role;
grant select, update (display_name, currency, rate_card_public, rate_card_intro, reminders_enabled) on public.profiles to authenticated;
grant select, insert, update, delete on public.deals, public.deliverables, public.payments, public.rate_card_items to authenticated;
grant all on public.profiles, public.deals, public.deliverables, public.payments, public.rate_card_items, public.reminders_sent to service_role;
