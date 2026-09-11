import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { canEditMoney, canSeeMoney, getSessionUser } from "@/lib/session";
import { resolveUnit } from "@/lib/finance";
import { clientOf, getOrders, isOpenOrder, nextDate, orderTotal, type OrderListFilter } from "@/lib/orders";
import { daysLabel, formatDate, formatIDR } from "@/lib/format";
import { buildHref, first, type Search } from "@/lib/search";
import { unitLabel } from "@/lib/options";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/hub/EmptyState";
import { OrderStatusPill } from "@/components/hub/OrderStatusPill";
import { PageHeader } from "@/components/hub/PageHeader";
import { SearchForm } from "@/components/hub/SearchForm";
import { SegmentedLinks } from "@/components/hub/SegmentedLinks";
import { UnitTabs } from "@/components/hub/UnitTabs";
import { deadlineText, deadlineTone } from "@/components/hub/deadline";
import { buttonPrimary } from "@/components/hub/form";

export const metadata: Metadata = { title: "Pesanan" };
export const dynamic = "force-dynamic";

const filters: { label: string; value: OrderListFilter }[] = [
  { label: "Berjalan", value: "berjalan" },
  { label: "Dibayar", value: "dibayar" },
  { label: "Semua", value: "semua" },
];
const href = (base: Search, patch: Record<string, string | undefined> = {}) => buildHref("/orders", base, patch);
const rowGrid = "md:grid-cols-[minmax(0,2.2fr)_1fr_1.2fr_1fr_minmax(0,1.2fr)]";
const rowGridNoMoney = "md:grid-cols-[minmax(0,2.2fr)_1fr_1.2fr_1fr]";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const allowed = user.units;
  const money = canSeeMoney(user);
  const grid = money ? rowGrid : rowGridNoMoney;
  const sp = await searchParams;
  const unit = resolveUnit(first(sp.unit), allowed);
  const filter = filters.find((f) => f.value === first(sp.filter))?.value ?? "berjalan";
  const q = (first(sp.q) ?? "").trim();
  const base: Search = {
    unit: unit === "semua" ? undefined : unit,
    filter: filter === "berjalan" ? undefined : filter,
    q: q || undefined,
  };

  const orders = await getOrders({ unit, allowed, filter, q });
  const openValue = orders.filter(isOpenOrder).reduce((s, o) => s + orderTotal(o), 0);
  const subtitle = [
    `${orders.length} PO${filter === "berjalan" ? " berjalan" : filter === "dibayar" ? " dibayar" : ""}`,
    unit !== "semua" ? `di ${unitLabel.get(unit)}` : null,
    money && openValue ? `nilai berjalan ${formatIDR(openValue)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-5">
      <PageHeader title="Pesanan" subtitle={`${subtitle}.`}>
        {canEditMoney(user) && (
          <Link href="/orders/new" className={buttonPrimary}>
            <Plus className="size-4" />
            PO baru
          </Link>
        )}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <UnitTabs path="/orders" base={base} unit={unit} allowed={allowed} />
        <SegmentedLinks
          ariaLabel="Status"
          segments={filters.map((f) => ({
            label: f.label,
            href: href(base, { filter: f.value === "berjalan" ? undefined : f.value }),
            active: filter === f.value,
          }))}
        />
        <SearchForm action="/orders" hidden={{ unit: base.unit as string | undefined, filter: base.filter as string | undefined }} q={q} placeholder="Cari nomor PO, invoice, klien" />
      </div>

      {orders.length === 0 ? (
        <EmptyState title={`Belum ada PO${q ? ` untuk "${q}"` : filter === "berjalan" ? " yang berjalan" : ""}.`} hint="Setiap PO dari pembeli dicatat di sini beserta dokumennya." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className={cn("hidden gap-3 border-b border-line px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-muted md:grid", grid)}>
            <span>PO</span>
            <span>Tanggal PO</span>
            <span>Tenggat</span>
            <span>Status</span>
            {money && <span className="text-right">Nilai</span>}
          </div>
          <ul className="divide-y divide-line">
            {orders.map((o) => {
              const client = clientOf(o);
              const next = nextDate(o);
              return (
                <li key={o.id}>
                  <Link href={`/orders/${o.id}`} className={cn("grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 px-4 py-3 hover:bg-surface-soft md:items-center", grid)}>
                    <div className="min-w-0">
                      <p className="truncate font-bold">
                        {o.number}
                        {o.revision ? <span className="ml-1.5 rounded bg-surface-soft px-1.5 py-0.5 text-[10px] font-bold text-muted">rev {o.revision}</span> : null}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {client?.name ?? "klien terhapus"}
                        {allowed.length > 1 ? ` · ${unitLabel.get(o.unit)}` : ""}
                      </p>
                    </div>
                    {money ? <p className="text-right font-extrabold md:order-last">{formatIDR(orderTotal(o))}</p> : <span className="md:hidden" />}
                    <p className="hidden text-sm text-muted md:block">{formatDate(o.orderDate)}</p>
                    <p className={cn("text-xs md:text-sm", next ? deadlineText[deadlineTone(next.iso, 7)] : "text-muted")}>
                      {next ? `${next.label} ${daysLabel(next.iso)}` : "-"}
                    </p>
                    <div className="justify-self-end md:justify-self-start">
                      <OrderStatusPill status={o.status} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
