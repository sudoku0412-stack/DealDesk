import type { Deliverable, Stage } from "@/lib/app/types";

/** Shown when the database rejects a move to Delivered (the UI normally catches it first). */
export const DELIVERED_BLOCKED_MESSAGE = "Can't move to Delivered yet. Add this deal's deliverables and mark every one done first.";

/**
 * Why a deal can't move to `target` yet, or null if it can.
 * Mirrors the `enforce_stage_rules` trigger in supabase/app-schema.sql, which is the real enforcement.
 */
export function stageBlocker(target: Stage, deliverables: Pick<Deliverable, "title" | "done">[]): string | null {
  if (target !== "delivered") return null;

  if (deliverables.length === 0) {
    return "Can't move to Delivered yet: this deal has no deliverables. Add what you're delivering and mark it done first.";
  }
  const open = deliverables.filter((d) => !d.done);
  if (open.length > 0) {
    const names = open.slice(0, 3).map((d) => d.title).join(", ") + (open.length > 3 ? "…" : "");
    return `Can't move to Delivered yet: ${open.length} deliverable${open.length > 1 ? "s are" : " is"} not done (${names}). Mark ${open.length > 1 ? "them" : "it"} done first.`;
  }
  return null;
}
