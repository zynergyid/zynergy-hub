import { cn } from "@/lib/cn";
import { daysLabel } from "@/lib/format";
import { expiryState } from "@/lib/vault";

/** "berlaku sampai" badge: red when expired, amber when within the warning window. */
export function ExpiryPill({ expiresAt, className }: { expiresAt?: string | null; className?: string }) {
  const state = expiryState({ expiresAt });
  if (!state || !expiresAt) return null;
  const tone = state === "lewat" ? "bg-red-50 text-red-700" : state === "segera" ? "bg-amber-50 text-amber-700" : "bg-surface-soft text-muted";
  const text = state === "lewat" ? `kedaluwarsa, ${daysLabel(expiresAt)}` : `berlaku ${daysLabel(expiresAt)}`;
  return <span className={cn("inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold", tone, className)}>{text}</span>;
}
