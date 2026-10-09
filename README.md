# DealDesk

DealDesk keeps every sponsorship, deadline and payment in one place, built for creators, not sales teams. This repo is the marketing site and waitlist: a Next.js landing page with a working waitlist (Supabase) and confirmation emails (Resend), deployed on Cloudflare Workers.

A Craftloop product. Production: https://dealdesk.craftloop.ca

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Framer Motion for animation (lazy-loaded, respects reduced motion)
- Supabase (Postgres) for waitlist storage
- Resend for confirmation emails
- Cloudflare Workers via the OpenNext adapter (`@opennextjs/cloudflare`)
- Optional Plausible analytics, with a `waitlist_signup` custom event on every successful submit

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
npm run preview              # optional: run in the real Workers runtime (needs .dev.vars)
```

Without Supabase credentials the page still renders; the form returns a friendly "temporarily unavailable" error.

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical URL, Open Graph, sitemap, robots. `https://dealdesk.craftloop.ca` in production |
| `SUPABASE_URL` | server | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Service role key. Never expose it to the browser or commit it |
| `RESEND_API_KEY` | server | Resend API key |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | public | Optional. Your Plausible site domain; enables the `waitlist_signup` event |
| `ADMIN_PASSWORD` | server | Password for `/admin` (12+ characters). Store as a **secret** |
| `EMAIL_FROM` | server | Sender, e.g. `DealDesk <support@craftloop.ca>` (domain must be verified in Resend) |

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

grant usage on schema public to service_role;
grant select, insert on table public.waitlist to service_role;
```

3. Copy **Project URL** and the **service_role** key from **Project Settings → API** into your env vars.

Row Level Security is on with no policies, so the public anon key cannot read or write the table. Only the API route (service role) can.

## Resend domain verification

1. Create an API key at https://resend.com/api-keys.
2. Go to **Domains → Add Domain** and add `craftloop.ca`.
3. Add the DNS records Resend shows (SPF, DKIM, and optionally DMARC) at your DNS provider, then click **Verify**.
4. Set `EMAIL_FROM="DealDesk <support@craftloop.ca>"`.

Until the domain is verified, Resend only lets you send from `onboarding@resend.dev` to your own address. A failed email never blocks a signup.

## Deploy to Cloudflare Workers

The domain's DNS is already on Cloudflare, so hosting, TLS and DNS all stay in one dashboard.

1. Push this repo to GitHub.
2. In the Cloudflare dashboard open **Workers & Pages → Create → Import a repository** and pick `DealDesk`.
3. Build settings:
   - Build command: `npx opennextjs-cloudflare build`
   - Deploy command: `npx opennextjs-cloudflare deploy`
4. Under **Build → Variables and secrets** add the build variables (needed at build time):
   - `NEXT_PUBLIC_SITE_URL` = `https://dealdesk.craftloop.ca`
   - `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (optional)
5. Deploy. You get a `dealdesk.<account>.workers.dev` URL.
6. In the Worker's **Settings → Variables and Secrets** add the runtime values:
   - `SUPABASE_URL` (text)
   - `SUPABASE_SERVICE_ROLE_KEY` (**secret**)
   - `RESEND_API_KEY` (**secret**)
   - `EMAIL_FROM` = `DealDesk <support@craftloop.ca>` (text)
   - `ADMIN_PASSWORD` (**secret**, 12+ characters)
7. Custom domain: Worker **Settings → Domains & Routes → Add → Custom domain**, enter `dealdesk.craftloop.ca`. Because `craftloop.ca` is on Cloudflare, the DNS record and certificate are created automatically. No manual CNAME is needed.
8. Optional pageview analytics: **Analytics & Logs → Web Analytics → Add a site** for `dealdesk.craftloop.ca` (free).
9. Optional hardening: add a **Security → WAF → Rate limiting rule** for path `/api/waitlist` (the in-app limiter is per Worker isolate only).

Manual deploy from your machine: `npx wrangler login`, then `npm run deploy`.

Resend DNS records (section above) are added in the Cloudflare **DNS** tab as **DNS only** records.

## The app (`/app`)

The CRM behind the waitlist: pipeline board (drag and drop), deal detail with deliverables and payments, deadlines, payments with overdue flags, rate card with a public share link (`/r/<slug>`), settings, and a daily reminder email. The free plan is limited to 3 active deals (enforced by a database trigger); a `plan` column on `profiles` is ready for Pro.

Setup, in order:

1. **Database.** In the Supabase SQL editor run [`supabase/app-schema.sql`](supabase/app-schema.sql) (after `schema.sql`). It creates `profiles`, `deals`, `deliverables`, `payments`, `rate_card_items` and `reminders_sent`, with row level security so each user only sees their own rows.
2. **Auth URLs.** Supabase → **Authentication → URL Configuration**: set **Site URL** to `https://dealdesk.craftloop.ca` and add `https://dealdesk.craftloop.ca/auth/callback` under **Redirect URLs**. Sign-in is by magic link (Email provider, enabled by default).
3. **Email delivery.** Supabase's built-in mailer is heavily rate limited. Under **Authentication → SMTP Settings** enable custom SMTP: host `smtp.resend.com`, port `465`, username `resend`, password your Resend API key, sender `support@craftloop.ca`.
4. **Env vars** on the Worker (plain variables are fine, they are read at runtime): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the anon or publishable key, safe for the browser), `CRON_SECRET` (secret, 16+ random characters), and optionally `SIGNUP_MODE`.
5. **Access control.** `SIGNUP_MODE=waitlist` (default) lets only people on the waitlist (and existing users) sign in; `SIGNUP_MODE=open` lets anyone.
6. **Reminders.** `wrangler.jsonc` schedules a daily cron (`0 14 * * *`, UTC) that calls `/api/cron/reminders`. One digest email per user: deliverables due within 2 days (once), overdue deliverables (once), overdue payments (at most every 7 days). Users can turn them off in Settings.

Each pipeline stage has its own color, and a card's color animates when it moves. A deal can only move to **Delivered** once it has deliverables and every one is marked done. The UI explains why when a move is refused, and the `enforce_stage_rules` trigger in `app-schema.sql` enforces it in the database. After pulling this change, re-run `supabase/app-schema.sql` (it is safe to re-run).

Dates in the app use UTC.

## Admin dashboard

`/admin` shows visitors, page views, signups and the visitor-to-signup conversion rate, plus total signups, today / 7-day / 30-day counts, a 30-day chart, a platform breakdown and a searchable, paginated signup table with CSV export. Times are UTC.

- Visitor stats come from a first-party, cookie-free tracker (`/api/collect` into the `page_views` table). It stores no IP addresses, uses a daily-rotating hash, skips bots, Do Not Track and your own admin visits. Multi-day visitor totals are the sum of daily unique visitors. Run the `page_views` SQL in `supabase/schema.sql` once to enable it.
- Sign in with `ADMIN_PASSWORD` (12+ characters). The session is a signed, httpOnly, same-site cookie valid for 7 days; changing the password signs everyone out.
- Login is rate limited, `/admin` is `noindex` and disallowed in `robots.txt`.
- For defense in depth, also put **Cloudflare Access** (Zero Trust, free up to 50 users) in front of `/admin*` and `/api/admin/*`.

## Waitlist API

`POST /api/waitlist` with JSON `{ "email": string, "platform": "YouTube" | "TikTok" | "Instagram" | "Twitch" | "Other", "company": "" }`.

- Validates and normalizes the email (trimmed, lowercased).
- `company` is a honeypot: if filled, the API returns a fake success and stores nothing.
- Rate limit: 5 requests per IP per 10 minutes (in-memory, per Worker isolate; add a Cloudflare WAF rate limiting rule for strict global limits).
- Duplicate emails return `{ ok: true, duplicate: true, position }` instead of an error.
- Success returns `{ ok: true, position, duplicate }`, which drives the "You're #N on the list" message.

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm run start      # serve the Next.js production build
npm run preview    # build and run in the Workers runtime
npm run deploy     # build and deploy to Cloudflare
npm run typecheck  # TypeScript check
```

## Renaming the product

Edit `APP_NAME` (and friends) in [`lib/config.ts`](lib/config.ts). The logo mark and favicon are simple SVG/JSX and can be swapped separately.
