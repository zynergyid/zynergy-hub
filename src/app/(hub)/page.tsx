import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, CalendarClock, Users, Wallet } from "lucide-react";
import type { Client } from "@/payload-types";
import { getSessionUser } from "@/lib/session";
import {
  getCategoryBreakdown,
  getClientCounts,
  getLast12,
  getLedger,
  getRenewals,
  getUnitMonth,
  pctChange,
  type UnitFilter,
} from "@/lib/finance";
import { formatDate, formatIDR, formatMonthLong } from "@/lib/format";
import { categoryLabel, units } from "@/lib/options";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/hub/Avatar";
import { BarChart } from "@/components/hub/BarChart";
import { Card } from "@/components/hub/Card";
import { CategoryBars } from "@/components/hub/CategoryBars";
import { KpiCard } from "@/components/hub/KpiCard";
import { PageHeader } from "@/components/hub/PageHeader";
import { SegmentedLinks } from "@/components/hub/SegmentedLinks";

export const dynamic = "force-dynamic";

type Search = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const daysUntil = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);

function RenewalRow({ c }: { c: Client }) {
  const d = c.renewalDate ? daysUntil(c.renewalDate) : null;
  return (
    <li className="flex items-center gap-3 py-3">
      <Avatar name={c.name} />
      <div className="min-w-0 flex-1">
        <Link href={`/klien/${c.id}`} className="block truncate text-sm font-semibold hover:text-primary">
          {c.name}
        </Link>
        <p className="truncate text-xs text-muted">
          {c.package ?? "paket belum diisi"}
          {c.annualFee ? ` · ${formatIDR(c.annualFee)}/tahun` : ""}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold",
          d !== null && d < 0 ? "bg-red-50 text-red-700" : d !== null && d <= 7 ? "bg-amber-50 text-amber-700" : "bg-primary-soft text-primary-dark",
        )}
      >
        {d === null ? "tanpa tanggal" : d < 0 ? `lewat ${-d} hari` : d === 0 ? "hari ini" : `${d} hari`}
      </span>
    </li>
  );
}

export default async function HubHome({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const canSeeMoney = user.role === "admin" || user.role === "finance";
  const sp = await searchParams;
  const unitParam = first(sp.unit);
  const unit: UnitFilter = unitParam === "digital" || unitParam === "supply" ? unitParam : "semua";
  const now = new Date();

  const [counts, renewals] = await Promise.all([getClientCounts(), getRenewals(30)]);
  const money = canSeeMoney
    ? await Promise.all([
        getUnitMonth(unit, now),
        getLast12(unit),
        getCategoryBreakdown(unit, now),
        getLedger({ unit, month: now }),
        getUnitMonth("digital", now),
        getUnitMonth("supply", now),
      ])
    : null;

  return (
    <div className="space-y-6">
      <PageHeader title={`Halo, ${user.name.split(" ")[0]}`} subtitle={`Ringkasan ${formatMonthLong(now)}.`}>
        {canSeeMoney && (
          <SegmentedLinks
            ariaLabel="Unit bisnis"
            segments={[
              { label: "Semua", href: "/", active: unit === "semua" },
              ...units.map((u) => ({ label: u.label, href: `/?unit=${u.value}`, active: unit === u.value })),
            ]}
          />
        )}
      </PageHeader>

      {money ? (
        (() => {
          const [m, last12, categories, ledger, digital, supply] = money;
          const dueSoon = renewals.filter((c) => c.renewalDate && daysUntil(c.renewalDate) <= 30).length;
          return (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <KpiCard icon={Wallet} label="Saldo" value={formatIDR(m.balance)} hint={unit === "semua" ? `Digital ${formatIDR(digital.balance)} · Supply ${formatIDR(supply.balance)}` : "semua waktu"} tone="primary" />
                <KpiCard icon={ArrowDownLeft} label="Masuk bulan ini" value={formatIDR(m.masuk)} delta={pctChange(m.masuk, m.masukPrev)} tone="in" hint="vs bulan lalu" />
                <KpiCard icon={ArrowUpRight} label="Keluar bulan ini" value={formatIDR(m.keluar)} delta={pctChange(m.keluar, m.keluarPrev)} upIsGood={false} tone="out" hint="vs bulan lalu" />
                <KpiCard icon={Users} label="Klien aktif" value={String(counts.aktif)} hint={dueSoon ? `${dueSoon} jatuh tempo 30 hari` : `${counts.prospek} prospek`} />
              </div>

              <div className="grid gap-4 lg:grid-cols-5">
                <Card title="Arus kas 12 bulan" action={{ label: "Buka arus kas", href: `/arus-kas?unit=${unit === "semua" ? "digital" : unit}` }} className="lg:col-span-3">
                  <BarChart points={last12} />
                </Card>
                <Card title="Pengeluaran bulan ini" className="lg:col-span-2">
                  <CategoryBars items={categories} />
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-5">
                <Card title="Perpanjangan terdekat" action={{ label: "Semua klien", href: "/klien" }} className="lg:col-span-2">
                  {renewals.length === 0 ? (
                    <p className="text-sm text-muted">Tidak ada perpanjangan dalam 30 hari.</p>
                  ) : (
                    <ul className="divide-y divide-line">
                      {renewals.slice(0, 5).map((c) => <RenewalRow key={c.id} c={c} />)}
                    </ul>
                  )}
                </Card>
                <Card title="Transaksi terbaru" action={{ label: "Semua", href: `/arus-kas?unit=${unit}` }} className="lg:col-span-3">
                  {ledger.rows.length === 0 ? (
                    <p className="text-sm text-muted">Belum ada transaksi bulan ini.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="text-left text-[11px] uppercase tracking-wider text-muted">
                        <tr>
                          <th className="pb-2 font-bold">Transaksi</th>
                          <th className="hidden pb-2 font-bold sm:table-cell">Tanggal</th>
                          <th className="hidden pb-2 font-bold md:table-cell">Bukti</th>
                          <th className="pb-2 text-right font-bold">Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {ledger.rows.slice(0, 6).map(({ tx }) => {
                          const clientName = typeof tx.client === "object" && tx.client ? tx.client.name : null;
                          const hasReceipt = Boolean(typeof tx.receipt === "object" ? tx.receipt : tx.receipt);
                          return (
                            <tr key={tx.id}>
                              <td className="py-2.5 pr-3">
                                <div className="flex items-center gap-3">
                                  <Avatar name={clientName ?? categoryLabel.get(tx.category) ?? "?"} className="size-8 text-[10px]" />
                                  <div className="min-w-0">
                                    <p className="truncate font-semibold">{tx.reference || categoryLabel.get(tx.category)}</p>
                                    <p className="truncate text-xs text-muted">{categoryLabel.get(tx.category)}{clientName ? ` · ${clientName}` : ""}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="hidden py-2.5 pr-3 text-muted sm:table-cell">{formatDate(tx.date)}</td>
                              <td className="hidden py-2.5 pr-3 md:table-cell">
                                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", hasReceipt ? "bg-secondary-soft text-secondary-dark" : "bg-surface-soft text-muted")}>
                                  {hasReceipt ? "Ada bukti" : "Tanpa bukti"}
                                </span>
                              </td>
                              <td className={cn("py-2.5 text-right font-extrabold", tx.type === "masuk" ? "text-secondary-dark" : "text-red-600")}>
                                {tx.type === "masuk" ? "+" : "-"}{formatIDR(tx.amount)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </Card>
              </div>
            </>
          );
        })()
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <KpiCard icon={Users} label="Klien aktif" value={String(counts.aktif)} tone="primary" />
            <KpiCard icon={CalendarClock} label="Jatuh tempo 30 hari" value={String(renewals.length)} tone={renewals.length ? "out" : "neutral"} />
            <KpiCard icon={Users} label="Prospek" value={String(counts.prospek)} />
          </div>
          <Card title="Perpanjangan terdekat" action={{ label: "Semua klien", href: "/klien" }}>
            {renewals.length === 0 ? <p className="text-sm text-muted">Tidak ada perpanjangan dalam 30 hari.</p> : (
              <ul className="divide-y divide-line">{renewals.map((c) => <RenewalRow key={c.id} c={c} />)}</ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
