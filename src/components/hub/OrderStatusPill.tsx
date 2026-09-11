import { cn } from "@/lib/cn";
import { orderStatusLabel, type OrderStatus } from "@/lib/options";

const tone: Record<OrderStatus, string> = {
  diterima: "bg-primary-soft text-primary-dark",
  sourcing: "bg-amber-50 text-amber-700",
  dikirim: "bg-sky-50 text-sky-700",
  ditagih: "bg-fuchsia-50 text-fuchsia-700",
  dibayar: "bg-secondary-soft text-secondary-dark",
  batal: "bg-surface-soft text-muted",
};

export function OrderStatusPill({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold", tone[status], className)}>
      {orderStatusLabel.get(status)}
    </span>
  );
}
