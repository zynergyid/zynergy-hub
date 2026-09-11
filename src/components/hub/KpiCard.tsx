import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  /** Percent change vs previous period; null hides the badge. */
  delta?: number | null;
  /** For costs, an increase is bad. */
  upIsGood?: boolean;
  tone?: "primary" | "in" | "out" | "neutral";
}

const iconTone: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  primary: "bg-primary-soft text-primary",
  in: "bg-secondary-soft text-secondary-dark",
  out: "bg-red-50 text-red-600",
  neutral: "bg-surface-soft text-muted",
};

export function KpiCard({ icon: Icon, label, value, hint, delta, upIsGood = true, tone = "neutral" }: KpiCardProps) {
  const up = delta !== null && delta !== undefined && delta >= 0;
  const good = delta === null || delta === undefined ? null : up === upIsGood;
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,27,51,0.04)] sm:p-5">
      <div className="flex items-center justify-between">
        <span className={cn("grid size-9 place-items-center rounded-xl", iconTone[tone])}>
          <Icon className="size-4" aria-hidden />
        </span>
        {delta !== null && delta !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold",
              good ? "bg-secondary-soft text-secondary-dark" : "bg-red-50 text-red-600",
            )}
          >
            {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(delta).toFixed(0)}%
          </span>
        )}
      </div>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 text-xl font-extrabold tracking-tight text-ink sm:text-2xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
