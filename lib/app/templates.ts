import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays } from "@/lib/app/format";
import type { Deliverable, DealTemplate, Payment } from "@/lib/app/types";

/** Starter templates available to everyone. Offsets are days after the deal is created. */
export const BUILTIN_TEMPLATES: DealTemplate[] = [
  {
    id: "builtin:youtube-dedicated",
    name: "YouTube: dedicated video",
    platform: "YouTube",
    amount_cents: 0,
    notes: null,
    deliverables: [
      { title: "Script approved by brand", offset_days: 5 },
      { title: "Draft video sent for review", offset_days: 12 },
      { title: "Video published", offset_days: 20 },
    ],
    payments: [
      { label: "50% upfront", percent: 50, due_offset_days: 7 },
      { label: "50% after publish", percent: 50, due_offset_days: 50 },
    ],
  },
  {
    id: "builtin:youtube-integration",
    name: "YouTube: 60-90s integration",
    platform: "YouTube",
    amount_cents: 0,
    notes: null,
    deliverables: [
      { title: "Integration draft approved", offset_days: 8 },
      { title: "Video published", offset_days: 16 },
    ],
    payments: [{ label: "Full payment (net 30)", percent: 100, due_offset_days: 46 }],
  },
  {
    id: "builtin:instagram-reel",
    name: "Instagram: Reel",
    platform: "Instagram",
    amount_cents: 0,
    notes: null,
    deliverables: [
      { title: "Concept approved", offset_days: 4 },
      { title: "Reel draft approved", offset_days: 9 },
      { title: "Reel posted", offset_days: 14 },
    ],
    payments: [
      { label: "50% upfront", percent: 50, due_offset_days: 7 },
      { label: "50% after posting", percent: 50, due_offset_days: 44 },
    ],
  },
  {
    id: "builtin:tiktok-video",
    name: "TikTok: sponsored video",
    platform: "TikTok",
    amount_cents: 0,
    notes: null,
    deliverables: [
      { title: "Concept approved", offset_days: 3 },
      { title: "Video posted", offset_days: 10 },
    ],
    payments: [{ label: "Full payment (net 30)", percent: 100, due_offset_days: 40 }],
  },
  {
    id: "builtin:twitch-stream",
    name: "Twitch: sponsored stream",
    platform: "Twitch",
    amount_cents: 0,
    notes: null,
    deliverables: [
      { title: "Stream date and talking points confirmed", offset_days: 5 },
      { title: "Sponsored stream live", offset_days: 14 },
    ],
    payments: [{ label: "Full payment (net 30)", percent: 100, due_offset_days: 44 }],
  },
];

export function findTemplate(id: string, userTemplates: DealTemplate[]) {
  return [...userTemplates, ...BUILTIN_TEMPLATES].find((t) => t.id === id) ?? null;
}

/** Adds the template's deliverables and payments to a freshly created deal. */
export async function applyTemplate(
  db: SupabaseClient,
  dealId: string,
  tpl: DealTemplate,
  amountCents: number,
  today: string,
): Promise<{ deliverables: Deliverable[]; payments: Payment[] }> {
  const out = { deliverables: [] as Deliverable[], payments: [] as Payment[] };

  if (tpl.deliverables.length) {
    const { data } = await db
      .from("deliverables")
      .insert(tpl.deliverables.map((d) => ({ deal_id: dealId, title: d.title, due_date: d.offset_days == null ? null : addDays(today, d.offset_days) })))
      .select("id,deal_id,title,due_date,done");
    out.deliverables = (data ?? []) as Deliverable[];
  }

  if (tpl.payments.length && amountCents > 0) {
    const { data } = await db
      .from("payments")
      .insert(
        tpl.payments.map((p) => ({
          deal_id: dealId,
          label: p.label,
          amount_cents: Math.round((amountCents * p.percent) / 100),
          due_on: p.due_offset_days == null ? null : addDays(today, p.due_offset_days),
        })),
      )
      .select("*");
    out.payments = (data ?? []) as Payment[];
  }
  return out;
}
