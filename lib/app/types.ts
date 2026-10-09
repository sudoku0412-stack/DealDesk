export const STAGES = [
  { id: "pitched", label: "Pitched", dot: "bg-muted" },
  { id: "negotiating", label: "Negotiating", dot: "bg-amber" },
  { id: "signed", label: "Signed", dot: "bg-accent" },
  { id: "delivered", label: "Delivered", dot: "bg-[#7c5cff]" },
  { id: "paid", label: "Paid", dot: "bg-green" },
] as const;

export type Stage = (typeof STAGES)[number]["id"];

export type Deal = {
  id: string;
  brand: string;
  contact_name: string | null;
  contact_email: string | null;
  platform: string | null;
  amount_cents: number;
  stage: Stage;
  notes: string | null;
  archived: boolean;
  created_at: string;
};

export type Deliverable = { id: string; deal_id: string; title: string; due_date: string | null; done: boolean };

export type Payment = {
  id: string;
  deal_id: string;
  label: string;
  amount_cents: number;
  invoiced_on: string | null;
  due_on: string | null;
  paid_on: string | null;
};

export type RateItem = { id: string; label: string; description: string | null; price_cents: number; sort: number };

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  currency: string;
  plan: "free" | "pro";
  public_slug: string;
  rate_card_public: boolean;
  rate_card_intro: string | null;
  reminders_enabled: boolean;
};

export const FREE_LIMIT_MESSAGE =
  "The free plan covers 3 active deals. Mark one Paid or archive it to add another. Pro is coming soon.";
