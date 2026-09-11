import Link from "next/link";
import { redirect } from "next/navigation";
import type { Client } from "@/payload-types";
import { getSessionUser } from "@/lib/session";
import { getClientCounts, getFinanceSummary, getRenewals } from "@/lib/finance";
import { formatDate, formatIDR, formatMonth } from "@/lib/format";
import { transactionCategories } from "@/collections/Transactions";

export const dynamic = "force-dynamic";

const categoryLabel = new Map<string, string>(
  transactionCategories.map((c) => [c.value, c.label]),
);

function Stat({ label, value, tone }: { label: string; value: string; tone?: "in" | "out" }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p
        className={
          "mt-2 text-2xl font-extrabold tracking-tight " +
          (tone === "in" ? "text-secondary-dark" : tone === "out" ? "text-red-600" : "text-ink")
        }
      >
        {value}
      </p>
    </div>
  );
}

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

function Renewals({ clients }: { clients: Client[] }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">Jatuh tempo 30 hari ke depan</h2>
        <Link href="/admin/collections/clients" className="text-sm font-semibold text-primary hover:underline">
          Semua klien
        </Link>
      </div>
      {clients.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Tidak ada perpanjangan dalam 30 hari.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {clients.map((c) => {
            const d = c.renewalDate ? daysUntil(c.renewalDate) : null;
            return (
              <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link href={`/admin/collections/clients/${c.id}`} className="block truncate font-semibold hover:text-primary">
                    {c.name}
                  </Link>
                  <p className="text-xs text-muted">
                    {c.package ?? "paket belum diisi"}{c.annualFee ? ` · ${formatIDR(c.annualFee)}/tahun` : ""}
                  </p>
                </div>
                <span
                  className={
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold " +
                    (d !== null && d < 0
                      ? "bg-red-50 text-red-700"
                      : d !== null && d <= 7
                        ? "bg-amber-50 text-amber-700"
                        : "bg-primary-soft text-primary-dark")
                  }
                >
                  {d === null ? "tanpa tanggal" : d < 0 ? `lewat ${-d} hari` : d === 0 ? "hari ini" : `${d} hari`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default async function HubHome() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  const [counts, renewals] = await Promise.all([getClientCounts(), getRenewals(30)]);
  const canSeeMoney = user.role === "admin" || user.role === "finance";
  const finance = canSeeMoney ? await getFinanceSummary() : null;
  const maxBar = finance ? Math.max(1, ...finance.last12.flatMap((p) => [p.masuk, p.keluar])) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Halo, {user.name}</p>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Ringkasan</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/collections/clients/create" className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold hover:border-primary/40">
            + Klien
          </Link>
          {canSeeMoney && (
            <Link href="/admin/collections/transactions/create" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
              + Transaksi
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Klien aktif" value={String(counts.aktif)} />
        <Stat label="Prospek" value={String(counts.prospek)} />
        <Stat label="Total klien" value={String(counts.total)} />
      </div>

      {finance && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Masuk bulan ini" value={formatIDR(finance.monthIn)} tone="in" />
            <Stat label="Keluar bulan ini" value={formatIDR(finance.monthOut)} tone="out" />
            <Stat label="Saldo (semua waktu)" value={formatIDR(finance.balance)} />
          </div>

          <section className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">12 bulan terakhir</h2>
              {/* File download, not a page: keep a plain anchor. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/api/export/transactions" className="text-sm font-semibold text-primary hover:underline">
                Ekspor CSV
              </a>
            </div>
            <div className="mt-4 flex h-40 items-end gap-1.5 sm:gap-2">
              {finance.last12.map((p) => (
                <div key={p.label.toISOString()} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-32 w-full items-end justify-center gap-0.5">
                    <div
                      className="w-1/2 rounded-t bg-secondary"
                      style={{ height: `${(p.masuk / maxBar) * 100}%` }}
                      title={`Masuk ${formatIDR(p.masuk)}`}
                    />
                    <div
                      className="w-1/2 rounded-t bg-red-400"
                      style={{ height: `${(p.keluar / maxBar) * 100}%` }}
                      title={`Keluar ${formatIDR(p.keluar)}`}
                    />
                  </div>
                  <span className="text-[10px] text-muted">{formatMonth(p.label)}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">Hijau masuk, merah keluar.</p>
          </section>
        </>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Renewals clients={renewals} />

        {finance && (
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-base font-bold">Pengeluaran bulan ini per kategori</h2>
            {finance.byCategory.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Belum ada pengeluaran bulan ini.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {finance.byCategory.map((c) => (
                  <li key={c.category} className="flex items-center justify-between text-sm">
                    <span>{categoryLabel.get(c.category) ?? c.category}</span>
                    <span className="font-semibold">{formatIDR(c.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      {finance && (
        <section className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Transaksi terbaru</h2>
            <Link href="/admin/collections/transactions" className="text-sm font-semibold text-primary hover:underline">
              Semua transaksi
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {finance.recent.map((t) => {
              const clientName = typeof t.client === "object" && t.client ? t.client.name : null;
              return (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{t.reference || categoryLabel.get(t.category)}</p>
                    <p className="text-xs text-muted">
                      {formatDate(t.date)} · {categoryLabel.get(t.category)}{clientName ? ` · ${clientName}` : ""}
                    </p>
                  </div>
                  <span className={"shrink-0 font-bold " + (t.type === "masuk" ? "text-secondary-dark" : "text-red-600")}>
                    {t.type === "masuk" ? "+" : "-"}{formatIDR(t.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
