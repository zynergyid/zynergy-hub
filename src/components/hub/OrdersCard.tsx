import Link from "next/link";
import { clientOf, nextDate, orderTotal, type OrderSummary } from "@/lib/orders";
import { daysLabel, formatIDR } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Avatar } from "./Avatar";
import { Card } from "./Card";
import { OrderStatusPill } from "./OrderStatusPill";
import { deadlinePill, deadlineTone } from "./deadline";

function Stat({ label, value, hint, alert = false }: { label: string; value: string; hint: string; alert?: boolean }) {
  return (
    <div className="rounded-xl bg-surface-soft p-3">
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-base font-extrabold">{value}</dd>
      <dd className={cn("truncate", alert ? "font-semibold text-red-600" : "text-muted")}>{hint}</dd>
    </div>
  );
}

/** Dashboard card: open POs, receivables, upcoming deliveries. */
export function OrdersCard({ summary, href, showMoney = true }: { summary: OrderSummary; href: string; showMoney?: boolean }) {
  return (
    <Card title="Pesanan berjalan" action={{ label: "Semua pesanan", href }}>
      <dl className={cn("grid gap-3 text-xs", showMoney ? "grid-cols-3" : "grid-cols-2")}>
        <Stat label="PO berjalan" value={String(summary.openCount)} hint={showMoney ? formatIDR(summary.openValue) : "di unit Anda"} />
        {showMoney && (
          <Stat
            label="Piutang ditagih"
            value={formatIDR(summary.receivable)}
            hint={summary.overdueCount ? `${summary.overdueCount} lewat jatuh tempo` : "tidak ada yang lewat"}
            alert={summary.overdueCount > 0}
          />
        )}
        <Stat label="Kirim 7 hari ke depan" value={String(summary.shippingSoon)} hint="PO belum dikirim" />
      </dl>
      {summary.upcoming.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Tidak ada PO berjalan.</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {summary.upcoming.map((o) => {
            const next = nextDate(o);
            const buyer = clientOf(o);
            return (
              <li key={o.id} className="flex items-center gap-3 py-3">
                <Avatar name={buyer?.name ?? o.number} />
                <div className="min-w-0 flex-1">
                  <Link href={`/orders/${o.id}`} className="block truncate text-sm font-semibold hover:text-primary">{o.number}</Link>
                  <p className="truncate text-xs text-muted">{buyer?.name ?? "klien terhapus"}{showMoney ? ` · ${formatIDR(orderTotal(o))}` : ""}</p>
                </div>
                {next && (
                  <span className={cn("hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline-flex", deadlinePill[deadlineTone(next.iso, 7)])}>
                    {next.label} {daysLabel(next.iso)}
                  </span>
                )}
                <OrderStatusPill status={o.status} />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
