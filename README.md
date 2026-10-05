# DealDesk

DealDesk keeps every sponsorship, deadline and payment in one place, built for creators, not sales teams. This repo is the marketing site and waitlist: a Next.js landing page with a working waitlist (Supabase) and confirmation emails (Resend).

A Craftloop product. Production: https://dealdesk.craftloop.ca

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Framer Motion for animation (lazy-loaded, respects reduced motion)
- Supabase (Postgres) for waitlist storage
- Resend for confirmation emails
- Vercel Analytics, with a `waitlist_signup` custom event on every successful submit

## Project structure

```
app/            routes, metadata, OG image, sitemap, robots, API route
  api/waitlist  POST endpoint (validation, honeypot, rate limit, dedupe)
components/     page sections and UI
lib/config.ts   APP_NAME and other branding constants (rename the product here)
lib/            validation, rate limiter, Supabase and Resend clients
supabase/       schema.sql
```

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

Without Supabase credentials the page still renders; the form returns a friendly "temporarily unavailable" error.

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical URL, Open Graph, sitemap, robots. `https://dealdesk.craftloop.ca` in production |
| `SUPABASE_URL` | server | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Service role key. Never expose it to the browser or commit it |
| `RESEND_API_KEY` | server | Resend API key |
| `EMAIL_FROM` | server | Sender, e.g. `DealDesk <hello@craftloop.ca>` (domain must be verified in Resend) |

Secrets live in `.env.local` (git-ignored). Only `.env.example` is committed.

## Supabase

1. Create a project at https://supabase.com.
2. Open **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql):

```sql
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  platform text not null check (platform in ('YouTube', 'TikTok', 'Instagram', 'Twitch', 'Other')),
  created_at timestamptz not null default now(),
  constraint waitlist_email_key unique (email),
  constraint waitlist_email_lowercase check (email = lower(email))
);

create index if not exists waitlist_created_at_idx on public.waitlist (created_at);

alter table public.waitlist enable row level security;
```

3. Copy **Project URL** and the **service_role** key from **Project Settings → API** into your env vars.

Row Level Security is on with no policies, so the public anon key cannot read or write the table. Only the API route (service role) can.

## Resend domain verification

1. Create an API key at https://resend.com/api-keys.
2. Go to **Domains → Add Domain** and add `craftloop.ca`.
3. Add the DNS records Resend shows (SPF, DKIM, and optionally DMARC) at your DNS provider, then click **Verify**.
4. Set `EMAIL_FROM="DealDesk <hello@craftloop.ca>"`.

Until the domain is verified, Resend only lets you send from `onboarding@resend.dev` to your own address. A failed email never blocks a signup.

## Deploy to Vercel

1. Push this repo to GitHub and import it at https://vercel.com/new (framework: Next.js, no build overrides).
2. Add the five environment variables above for **Production** (and Preview if you want).
3. Deploy.
4. Add the custom domain: **Project → Settings → Domains → Add** `dealdesk.craftloop.ca`.
5. At your DNS provider for `craftloop.ca`, add:

   | Type | Name | Value |
   | --- | --- | --- |
   | `CNAME` | `dealdesk` | `cname.vercel-dns.com` |

   (Vercel shows the exact target for your project; use that if it differs.)
6. Wait for Vercel to show the domain as valid; HTTPS is issued automatically.
7. Enable **Analytics** in the Vercel project to receive page views and the `waitlist_signup` event.

## Waitlist API

`POST /api/waitlist` with JSON `{ "email": string, "platform": "YouTube" | "TikTok" | "Instagram" | "Twitch" | "Other", "company": "" }`.

- Validates and normalizes the email (trimmed, lowercased).
- `company` is a honeypot: if filled, the API returns a fake success and stores nothing.
- Rate limit: 5 requests per IP per 10 minutes (in-memory, per serverless instance; swap `lib/rate-limit.ts` for Upstash Redis if you need strict global limits).
- Duplicate emails return `{ ok: true, duplicate: true, position }` instead of an error.
- Success returns `{ ok: true, position, duplicate }`, which drives the "You're #N on the list" message.

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # TypeScript check
```

## Renaming the product

Edit `APP_NAME` (and friends) in [`lib/config.ts`](lib/config.ts). The logo mark and favicon are simple SVG/JSX and can be swapped separately.
