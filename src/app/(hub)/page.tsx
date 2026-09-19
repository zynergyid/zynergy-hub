import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, CalendarClock, Download, Users, Wallet } from "lucide-react";
import type { Client } from "@/payload-types";
import { canEdit, canSeeMoney, getSessionUser } from "@/lib/session";
import {
  getCategoryBreakdown,
  getClientCounts,
  getLast12,
  getLedger,
  getRenewals,
  fundingHint,
  getUnitMonth,
  monthKey,
  pctChange,
  resolveUnit,
} from "@/lib/finance";
import { daysLabel, formatDate, formatIDR, formatMonthLong } from "@/lib/format";
import { getOrderSummary } from "@/lib/orders";
import { getProjectSummary, projectUnitsOf } from "@/lib/projects";
import { getOutreachSummary } from "@/lib/outreach";
import { getVaultSummary } from "@/lib/vault";
import { getWebSummary, webAnalyticsConfigured } from "@/lib/web-analytics";
import { first, type Search } from "@/lib/search";
import { categoryLabel, unitLabel } from "@/lib/options";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/hub/Avatar";
import { BarChart } from "@/components/hub/BarChart";
import { Card } from "@/components/hub/Card";
import { CategoryBars } from "@/components/hub/CategoryBars";
import { KpiCard } from "@/components/hub/KpiCard";
import { OrdersCard } from "@/components/hub/OrdersCard";
import { ProjectsCard } from "@/components/hub/ProjectsCard";
import { OutreachCard } from "@/components/hub/OutreachCard";
import { VaultCard } from "@/components/hub/VaultCard";
import { WebCard } from "@/components/hub/WebCard";
import { PageHeader } from "@/components/hub/PageHeader";
import { UnitTabs } from "@/components/hub/UnitTabs";
import { deadlinePill, deadlineTone } from "@/components/hub/deadline";
import { buttonOutline } from "@/components/hub/form";

export const dynamic = "force-dynamic";


function RenewalRow({ c }: { c: Client }) {
  const tone = c.renewalDate ? deadlineTone(c.renewalDate, 7) : "ok";
  return (
    <li className="flex items-center gap-3 py-3">
      <Avatar name={c.name} />
      <div className="min-w-0 flex-1">
        <Link href={`/clients/${c.id}`} className="block truncate text-sm font-semibold hover:text-primary">
          {c.name}
        </Link>
        <p className="truncate text-xs text-muted">
          {c.package ?? "paket belum diisi"}
          {c.annualFee ? ` · ${formatIDR(c.annualFee)}/tahun` : ""}
        </p>
      </div>
      <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold", deadlinePill[tone])}>
        {c.renewalDate ? daysLabel(c.renewalDate) : "tanpa tanggal"}
      </span>
    </li>
  );
}

export default async function HubHome({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const allowed = user.units;
  const sp = await searchParams;
  const unit = resolveUnit(first(sp.unit), allowed);
  const now = new Date();
  const hasSupply = unit === "supply" || (unit === "semua" && allowed.includes("supply"));
  const hasProjects = unit === "semua" ? projectUnitsOf(allowed).length > 0 : projectUnitsOf([unit]).length > 0;

  const [counts, renewals, orderSummary, projectSummary, outreach, vault, web] = await Promise.all([
    getClientCounts(allowed),
    getRenewals(allowed, 30),
    hasSupply ? getOrderSummary(unit, allowed) : null,
    hasProjects ? getProjectSummary(unit, allowed) : null,
    getOutreachSummary(unit, allowed),
    getVaultSummary(canEdit(user)),
    webAnalyticsConfigured() ? getWebSummary(7) : Promise.resolve(null),
  ]);
  const ordersHref = unit === "semua" ? "/orders" : `/orders?unit=${unit}`;
  const projectsHref = unit === "semua" ? "/projects" : `/projects?unit=${unit}`;
  const outreachHref = unit === "semua" ? "/outreach" : `/outreach?unit=${unit}`;
  const money = canSeeMoney(user)
    ? await Promise.all([
        getUnitMonth(unit, allowed, now),
        getLast12(unit, allowed),
        getCategoryBreakdown(unit, allowed, now),
        getLedger({ unit, allowed, month: now }),
        Promise.all(allowed.map(async (u) => ({ unit: u, ...(await getUnitMonth(u, allowed, now)) }))),
      ])
    : null;

  return (
    <div className="space-y-6">
      <PageHeader title={`Halo, ${user.name.split(" ")[0]}`} subtitle={`Ringkasan ${formatMonthLong(now)}.`}>
        {money && <UnitTabs path="/" unit={unit} allowed={allowed} />}
        {money && (
          <a href={`/api/export/financial-report?unit=${unit}&month=${monthKey(now)}`} className={buttonOutline} title="Laporan keuangan ringkas bulan ini (Excel): laba rugi basis kas, posisi kas, piutang PO, arus kas">
            <Download className="size-4" />
            Laporan Excel
          </a>
        )}
      </PageHeader>

      {money ? (
        (() => {
          const [m, last12, categories, ledger, perUnit] = money;
          const dueSoon = renewals.filter((c) => c.renewalDate && deadlineTone(c.renewalDate, 30) !== "ok").length;
          const saldoHint =
            unit === "semua" && perUnit.length > 1
              ? perUnit.map((p) => `${unitLabel.get(p.unit)} ${formatIDR(p.balance)}`).join(" · ")
              : "semua waktu";
          return (
            <>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <KpiCard icon={Wallet} label="Saldo" value={formatIDR(m.balance)} hint={saldoHint} tone="primary" />
                <KpiCard icon={ArrowDownLeft} label="Masuk bulan ini" value={formatIDR(m.masuk)} delta={pctChange(m.masuk, m.masukPrev)} tone="in" hint={fundingHint(m.fundingMasuk)} />
                <KpiCard icon={ArrowUpRight} label="Keluar bulan ini" value={formatIDR(m.keluar)} delta={pctChange(m.keluar, m.keluarPrev)} upIsGood={false} tone="out" hint={fundingHint(m.fundingKeluar)} />
                <KpiCard icon={Users} label="Klien aktif" value={String(counts.aktif)} hint={dueSoon ? `${dueSoon} jatuh tempo 30 hari` : `${counts.prospek} prospek`} />
              </div>

              <OutreachCard summary={outreach} href={outreachHref} />
              {orderSummary && <OrdersCard summary={orderSummary} href={ordersHref} />}
              {projectSummary && <ProjectsCard summary={projectSummary} href={projectsHref} />}
              {webAnalyticsConfigured() && <WebCard summary={web} />}
              <VaultCard docs={vault.expiring} total={vault.total} />

              <div className="grid gap-4 lg:grid-cols-5">
                <Card title="Arus kas 12 bulan" action={{ label: "Buka arus kas", href: `/cash-flow?unit=${unit}` }} className="min-w-0 lg:col-span-3">
                  <BarChart points={last12} />
                </Card>
                <Card title="Pengeluaran bulan ini" className="min-w-0 lg:col-span-2">
                  <CategoryBars items={categories} />
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-5">
                <Card title="Perpanjangan terdekat" action={{ label: "Semua klien", href: "/clients" }} className="min-w-0 lg:col-span-2">
                  {renewals.length === 0 ? (
                    <p className="text-sm text-muted">Tidak ada perpanjangan dalam 30 hari.</p>
                  ) : (
                    <ul className="divide-y divide-line">
                      {renewals.slice(0, 5).map((c) => <RenewalRow key={c.id} c={c} />)}
                    </ul>
                  )}
                </Card>
                <Card title="Transaksi terbaru" action={{ label: "Semua", href: `/cash-flow?unit=${unit}` }} className="min-w-0 lg:col-span-3">
                  {ledger.rows.length === 0 ? (
                    <p className="text-sm text-muted">Belum ada transaksi bulan ini.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="text-left text-[11px] uppercase tracking-wider text-muted">
                        <tr>
                          <th className="w-full pb-2 font-bold">Transaksi</th>
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
                              <td className="w-full max-w-0 py-2.5 pr-3">
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
                              <td className={cn("whitespace-nowrap py-2.5 text-right font-extrabold", tx.type === "masuk" ? "text-secondary-dark" : "text-red-600")}>
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
          <OutreachCard summary={outreach} href={outreachHref} />
          {orderSummary && <OrdersCard summary={orderSummary} href={ordersHref} showMoney={false} />}
          {projectSummary && <ProjectsCard summary={projectSummary} href={projectsHref} showMoney={false} />}
          {webAnalyticsConfigured() && <WebCard summary={web} />}
          <VaultCard docs={vault.expiring} total={vault.total} />
          <Card title="Perpanjangan terdekat" action={{ label: "Semua klien", href: "/clients" }}>
            {renewals.length === 0 ? <p className="text-sm text-muted">Tidak ada perpanjangan dalam 30 hari.</p> : (
              <ul className="divide-y divide-line">{renewals.map((c) => <RenewalRow key={c.id} c={c} />)}</ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
