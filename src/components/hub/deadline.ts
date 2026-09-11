import { daysUntil } from "@/lib/format";

export type DeadlineTone = "late" | "soon" | "ok";

/** Late, due within warnDays, or fine. One rule for renewals, deliveries, and payments. */
export function deadlineTone(iso: string, warnDays: number): DeadlineTone {
  const d = daysUntil(iso);
  return d < 0 ? "late" : d <= warnDays ? "soon" : "ok";
}

export const deadlinePill: Record<DeadlineTone, string> = {
  late: "bg-red-50 text-red-700",
  soon: "bg-amber-50 text-amber-700",
  ok: "bg-surface-soft text-muted",
};

export const deadlineText: Record<DeadlineTone, string> = {
  late: "font-semibold text-red-600",
  soon: "font-semibold text-amber-700",
  ok: "text-muted",
};
