import { cn } from "@/lib/cn";
import { prospectStatusLabel, type ProspectStatus } from "@/lib/options";

const tone: Record<ProspectStatus, string> = {
  baru: "bg-surface-soft text-muted",
  riset: "bg-primary-soft text-primary-dark",
  draf: "bg-amber-50 text-amber-700",
  terkirim: "bg-sky-50 text-sky-700",
  dibalas: "bg-secondary-soft text-secondary-dark",
  pertemuan: "bg-fuchsia-50 text-fuchsia-700",
  klien: "bg-secondary text-white",
  berhenti: "bg-surface-soft text-muted line-through",
};

export function ProspectStatusPill({ status, className }: { status: ProspectStatus; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold", tone[status], className)}>
      {prospectStatusLabel.get(status)}
    </span>
  );
}
