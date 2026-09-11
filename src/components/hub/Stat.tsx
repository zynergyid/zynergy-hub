import { cn } from "@/lib/cn";

export function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "in" | "out" | "neutral";
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 sm:p-5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-xl font-extrabold tracking-tight sm:text-2xl",
          tone === "in" && "text-secondary-dark",
          tone === "out" && "text-red-600",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
