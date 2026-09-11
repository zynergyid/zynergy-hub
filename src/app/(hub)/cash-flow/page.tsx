import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Download, Scale, Wallet } from "lucide-react";
import { canEditMoney, canSeeMoney, getSessionUser } from "@/lib/session";
import { getPayloadClient } from "@/lib/payload";
import { fundingHint, getLedger, getUnitMonth, monthKey, parseMonth, pctChange, resolveUnit } from "@/lib/finance";
import { dateKey, dayLabel, formatDate, formatIDR, formatMonthLong } from "@/lib/format";
import { categoryLabel, transactionCategories, unitLabel, type Unit } from "@/lib/options";
import { cn } from "@/lib/cn";
import { buildHref, first, type Search } from "@/lib/search";
import { EmptyState } from "@/components/hub/EmptyState";
import { buttonOutline } from "@/components/hub/form";
import { UnitTabs } from "@/components/hub/UnitTabs";
import { KpiCard } from "@/components/hub/KpiCard";
import { PageHeader } from "@/components/hub/PageHeader";
import { Avatar } from "@/components/hub/Avatar";
import { clientOf, getOrderPayments, getOrders, orderTotal, toOrderOption } from "@/lib/orders";
import { QuickAdd, type EditingTx, type TxPreset } from "./QuickAdd";

export const metadata: Metadata = { title: "Arus Kas" };
export const dynamic = "force-dynamic";

const href = (base: Search, patch: Record<string, string | undefined> = {}) => buildHref("/cash-flow", base, patch);

export default async function ArusKasPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const allowed = user.units;
  if (!canSeeMoney(user) || allowed.length === 0) redirect("/");
  const editable = canEditMoney(user);

  const sp = await searchParams;
  const unit = resolveUnit(first(sp.unit), allowed);
  const month = parseMonth(first(sp.month));
  const q = first(sp.q) ?? "";
  const category = first(sp.category) ?? "";

  const prev = new Date(month.getFullYear(), month.getMonth() - 1, 1);
  const next = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const base: Search = { unit, month: monthKey(month), q: q || undefined, category: category || undefined };

  const payload = await getPayloadClient();
  const [ledger, clientsRes, um, openOrders] = await Promise.all([
    getLedger({ unit, allowed, month, q, category }),
    payload.find({ collection: "clients", limit: 500, sort: "name", select: { name: true, unit: true } }),
    getUnitMonth(unit, allowed, month),
    getOrders({ unit, allowed, filter: "berjalan" }),
  ]);
  const editId = editable ? Number(first(sp.edit) || 0) : 0;
  const clientOptions = clientsRes.docs
    .filter((c) => allowed.includes(c.unit) && (unit === "semua" || c.unit === unit || Boolean(editId)))
    .map((c) => ({ id: c.id, name: c.name, unit: c.unit as Unit }));
  const quickAddUnit: Unit = unit === "semua" ? allowed[0] : unit;
  const orderOptions = openOrders.map(toOrderOption);

  let editing: EditingTx | null = null;
  if (editId) {
    const t = await payload.findByID({ collection: "transactions", id: editId, depth: 1, disableErrors: true });
    if (t && allowed.includes(t.unit)) {
      editing = {
        id: t.id,
        type: t.type,
        amount: t.amount,
        date: t.date,
        unit: t.unit,
        category: t.category,
        method: t.method ?? null,
        client: typeof t.client === "object" && t.client ? t.client.id : (t.client ?? null),
        order: typeof t.order === "object" && t.order ? t.order.id : (t.order ?? null),
        reference: t.reference ?? null,
        notes: t.notes ?? null,
        receiptUrl: typeof t.receipt === "object" && t.receipt ? (t.receipt.url ?? null) : null,
      };
      // A closed PO is not in the open list; keep its option so editing does not drop the link.
      const linked = t.order;
      if (typeof linked === "object" && linked && !orderOptions.some((o) => o.id === linked.id)) orderOptions.push(toOrderOption(linked));
    }
  }

  // "Catat pembayaran" from a PO page: open the sheet with the remaining amount filled in.
  let prefill: TxPreset | null = null;
  const addOrderId = editable && !editing && first(sp.add) ? Number(first(sp.order) || 0) : 0;
  if (addOrderId) {
    const o = await payload.findByID({ collection: "orders", id: addOrderId, depth: 1, disableErrors: true });
    if (o && allowed.includes(o.unit)) {
      const { paid } = await getOrderPayments(o.id);
      const c = clientOf(o);
      prefill = {
        unit: o.unit,
        type: "masuk",
        category: "penjualan-barang",
        client: c?.id ?? null,
        order: o.id,
        amount: Math.max(orderTotal(o) - paid, 0),
        reference: o.invoiceNumber || o.number,
      };
      if (!orderOptions.some((x) => x.id === o.id)) orderOptions.push(toOrderOption(o));
      if (c && !clientOptions.some((x) => x.id === c.id)) clientOptions.push({ id: c.id, name: c.name, unit: c.unit });
    }
  }
  const closeHref = href(base, { edit: undefined });

  const groups = new Map<string, typeof ledger.rows>();
  for (const row of ledger.rows) {
    const k = dateKey(row.tx.date);
    groups.set(k, [...(groups.get(k) ?? []), row]);
  }
  const usedCategories = new Set(ledger.rows.map((r) => r.tx.category));

  return (
    <div className="space-y-5">
      <PageHeader title="Arus Kas" subtitle="Uang masuk dan keluar per unit bisnis.">
        <a href={`/api/export/cash-flow?unit=${unit}&month=${monthKey(month)}`} className={buttonOutline} title="Laporan Excel bulan ini, siap cetak">
          <Download className="size-4" />
          Excel
        </a>
        <a href={`/api/export/transactions?unit=${unit}&month=${monthKey(month)}`} className="text-xs font-semibold text-muted hover:text-primary" title="Data mentah untuk impor ke software akuntansi">
          CSV
        </a>
        {editable && (
          <QuickAdd key={editing?.id ?? (prefill ? `po-${prefill.order}` : "new")} unit={quickAddUnit} units={allowed} clients={clientOptions} orders={orderOptions} editing={editing} prefill={prefill} closeHref={closeHref} />
        )}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <UnitTabs path="/cash-flow" base={base} unit={unit} allowed={allowed} />
        <div className="inline-flex items-center rounded-xl border border-line bg-white">
          <Link href={href(base, { month: monthKey(prev) })} aria-label="Bulan sebelumnya" className="p-2 text-muted hover:text-ink">
            <ChevronLeft className="size-4" />
          </Link>
          <span className="min-w-36 text-center text-sm font-semibold">{formatMonthLong(month)}</span>
          <Link href={href(base, { month: monthKey(next) })} aria-label="Bulan berikutnya" className="p-2 text-muted hover:text-ink">
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={ArrowDownLeft} label="Masuk" value={formatIDR(ledger.masuk)} delta={pctChange(um.masuk, um.masukPrev)} tone="in" hint={fundingHint(ledger.fundingMasuk)} />
        <KpiCard icon={ArrowUpRight} label="Keluar" value={formatIDR(ledger.keluar)} delta={pctChange(um.keluar, um.keluarPrev)} upIsGood={false} tone="out" hint={fundingHint(ledger.fundingKeluar)} />
        <KpiCard icon={Scale} label="Selisih" value={formatIDR(ledger.masuk - ledger.keluar)} tone={ledger.masuk - ledger.keluar >= 0 ? "in" : "out"} hint="operasional bulan ini" />
        <KpiCard icon={Wallet} label="Saldo akhir bulan" value={formatIDR(ledger.closing)} hint={`Awal bulan ${formatIDR(ledger.opening)}`} tone="primary" />
      </div>

      <form className="flex flex-wrap items-center gap-2" action="/cash-flow">
        <input type="hidden" name="unit" value={unit} />
        <input type="hidden" name="month" value={monthKey(month)} />
        {category && <input type="hidden" name="category" value={category} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Cari keterangan, klien, catatan"
          className="w-full flex-1 rounded-xl border border-line bg-white px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:max-w-sm"
        />
        <button type="submit" className="rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-semibold hover:border-primary/40">Cari</button>
      </form>

      {usedCategories.size > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <Link href={href(base, { category: undefined })} className={cn("rounded-full border px-3 py-1 text-xs font-semibold", !category ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:text-ink")}>
            Semua kategori
          </Link>
          {transactionCategories.filter((c) => usedCategories.has(c.value) || c.value === category).map((c) => (
            <Link key={c.value} href={href(base, { category: c.value })} className={cn("rounded-full border px-3 py-1 text-xs font-semibold", category === c.value ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:text-ink")}>
              {c.label}
            </Link>
          ))}
        </div>
      )}

      {ledger.rows.length === 0 ? (
        <EmptyState
          title={`Belum ada transaksi ${formatMonthLong(month)} untuk ${unit === "semua" ? "semua unit" : `Zynergy ${unitLabel.get(unit)}`}.`}
          hint={editable ? 'Tekan "Catat" untuk menambah, atau pindah bulan.' : "Pindah bulan untuk melihat periode lain."}
        />
      ) : (
        <>
          {/* Desktop: table with running balance */}
          <div className="hidden overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,27,51,0.04)] md:block">
            <table className="w-full text-sm">
              <thead className="bg-surface-soft text-left text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-bold">Transaksi</th>
                  <th className="px-3 py-2.5 font-bold">Klien</th>
                  <th className="px-3 py-2.5 font-bold">Tanggal</th>
                  <th className="px-3 py-2.5 font-bold">Metode</th>
                  <th className="px-3 py-2.5 font-bold">Bukti</th>
                  <th className="px-3 py-2.5 text-right font-bold">Nominal</th>
                  {!ledger.filtered && <th className="px-4 py-2.5 text-right font-bold">Saldo</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ledger.rows.map(({ tx, balance }) => {
                  const clientName = typeof tx.client === "object" && tx.client ? tx.client.name : null;
                  const hasReceipt = Boolean(tx.receipt);
                  return (
                    <tr key={tx.id} className="hover:bg-surface-soft/60">
                      <td className="px-4 py-3">
                        <Link href={editable ? href(base, { edit: String(tx.id) }) : "#"} aria-disabled={!editable} className={cn("flex items-center gap-3", !editable && "pointer-events-none")}>
                          <span className={cn("grid size-8 shrink-0 place-items-center rounded-full text-sm font-extrabold", tx.type === "masuk" ? "bg-secondary-soft text-secondary-dark" : "bg-red-50 text-red-600")}>
                            {tx.type === "masuk" ? "+" : "-"}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold hover:text-primary">{tx.reference || categoryLabel.get(tx.category)}</span>
                            <span className="block truncate text-xs text-muted">
                              {categoryLabel.get(tx.category)}{unit === "semua" ? ` · ${tx.unit === "supply" ? "Supply" : "Digital"}` : ""}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        {clientName ? (
                          <span className="inline-flex items-center gap-2"><Avatar name={clientName} className="size-7 text-[10px]" /><span className="truncate">{clientName}</span></span>
                        ) : <span className="text-muted">-</span>}
                      </td>
                      <td className="px-3 py-3 text-muted">{formatDate(tx.date)}</td>
                      <td className="px-3 py-3 capitalize text-muted">{tx.method ?? "-"}</td>
                      <td className="px-3 py-3">
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", hasReceipt ? "bg-secondary-soft text-secondary-dark" : "bg-surface-soft text-muted")}>
                          {hasReceipt ? "Ada" : "Belum"}
                        </span>
                      </td>
                      <td className={cn("px-3 py-3 text-right font-extrabold", tx.type === "masuk" ? "text-secondary-dark" : "text-red-600")}>
                        {tx.type === "masuk" ? "+" : "-"}{formatIDR(tx.amount)}
                      </td>
                      {!ledger.filtered && <td className="px-4 py-3 text-right text-muted">{formatIDR(balance)}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: grouped by day */}
          <div className="overflow-hidden rounded-2xl border border-line bg-white md:hidden">
            {[...groups.entries()].map(([day, rows]) => (
              <section key={day}>
                <h2 className="border-b border-line bg-surface-soft px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
                  {dayLabel(rows[0].tx.date)}
                </h2>
                <ul className="divide-y divide-line">
                  {rows.map(({ tx, balance }) => {
                    const clientName = typeof tx.client === "object" && tx.client ? tx.client.name : null;
                    return (
                      <li key={tx.id}>
                        <Link href={editable ? href(base, { edit: String(tx.id) }) : "#"} aria-disabled={!editable} className={cn("flex items-center gap-3 px-4 py-3 active:bg-surface-soft", !editable && "pointer-events-none")}>
                          <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-sm font-extrabold", tx.type === "masuk" ? "bg-secondary-soft text-secondary-dark" : "bg-red-50 text-red-600")}>
                            {tx.type === "masuk" ? "+" : "-"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{tx.reference || categoryLabel.get(tx.category)}</p>
                            <p className="truncate text-xs text-muted">
                              {categoryLabel.get(tx.category)}{clientName ? ` · ${clientName}` : ""}{unit === "semua" ? ` · ${tx.unit === "supply" ? "Supply" : "Digital"}` : ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={cn("text-sm font-extrabold", tx.type === "masuk" ? "text-secondary-dark" : "text-red-600")}>
                              {tx.type === "masuk" ? "+" : "-"}{formatIDR(tx.amount)}
                            </p>
                            {!ledger.filtered && <p className="text-[11px] text-muted">saldo {formatIDR(balance)}</p>}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
