/** Single source of truth for branding. Rename the product here only. */
export const APP_NAME = "DealDesk";
export const PARENT_BRAND = "Craftloop";
export const PARENT_URL = "https://craftloop.ca";
export const SUPPORT_EMAIL = "hello@craftloop.ca";

export const TAGLINE = "The brand-deal CRM for small creators";
export const DESCRIPTION =
  "Track every sponsorship from pitch to paid. Deadline reminders, payment tracking with overdue alerts, and a rate card, free for your first 3 active deals.";

export const PLATFORMS = ["YouTube", "TikTok", "Instagram", "Twitch", "Other"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const FREE_DEAL_LIMIT = 3;
export const EARLY_ACCESS_OFFER = "50% off for life";

const DEFAULT_SITE_URL = "https://dealdesk.craftloop.ca";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");
