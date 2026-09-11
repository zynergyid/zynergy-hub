import Link from "next/link";
import { redirect } from "next/navigation";
import type { Client } from "@/payload-types";
import { getSessionUser } from "@/lib/session";
import { getClientCounts, getLast12, getLedger, getRenewals, getUnitMonth } from "@/lib/finance";
import { formatIDR, formatMonth, formatMonthLong } from "@/lib/format";
import { categoryLabel } from "@/lib/options";
import { Stat } from "@/components/hub/Stat";

export const dynamic = "force-dynamic";

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

function Renewals({ clients }: { clients: Client[] }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">Jatuh tempo 30 hari ke depan</h2>
        <Link href="/klien" className="text-sm font-semibold text-primary hover:underline">
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
                    {c.package ?? "paket belum diisi"}
                    {c.annualFee ? ` · ${formatIDR(c.annualFee)}/tahun` : ""}
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
  const canSeeMoney = user.role === "admin" || user.role === "finance";
  const now = new Date();

  const [counts, renewals] = await Promise.all([getClientCounts(), getRenewals(30)]);
  const [digital, supply, last12, recent] = canSeeMoney
    ? await Promise.all([
        getUnitMonth("digital", now),
        getUnitMonth("supply", now),
        getLast12("semua"),
        getLedger({ unit: "semua", month: now }),
      ])
    : [null, null, null, null];
  const maxBar = last12 ? Math.max(1, ...last12.flatMap((p) => [p.masuk, p.keluar])) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Halo, {user.name}</p>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Ringkasan</h1>
        </div>
        <p className="text-sm text-muted">{formatMonthLong(now)}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Klien aktif" value={String(counts.aktif)} />
        <Stat label="Prospek" value={String(counts.prospek)} />
        <Stat label="Total klien" value={String(counts.total)} />
      </div>

      {digital && supply && (
        <div className="grid gap-4 lg:grid-cols-2">
          {[
            { key: "digital", label: "Zynergy Digital", data: digital },
            { key: "supply", label: "Zynergy Supply", data: supply },
          ].map((u) => (
            <section key={u.key} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold">{u.label}</h2>
                <Link href={`/arus-kas?unit=${u.key}`} className="text-sm font-semibold text-primary hover:underline">
                  Arus kas
                </Link>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-3">
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted">Masuk</dt>
                  <dd className="mt-1 font-extrabold text-secondary-dark">{formatIDR(u.data.masuk)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted">Keluar</dt>
                  <dd className="mt-1 font-extrabold text-red-600">{formatIDR(u.data.keluar)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted">Saldo</dt>
                  <dd className="mt-1 font-extrabold">{formatIDR(u.data.balance)}</dd>
                </div>
              </dl>
            </section>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Renewals clients={renewals} />

        {last12 && (
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-base font-bold">12 bulan terakhir, semua unit</h2>
            <div className="mt-4 flex h-36 items-end gap-1.5 sm:gap-2">
              {last12.map((p) => (
                <div key={p.label.toISOString()} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-28 w-full items-end justify-center gap-0.5">
                    <div className="w-1/2 rounded-t bg-secondary" style={{ height: `${(p.masuk / maxBar) * 100}%` }} title={`Masuk ${formatIDR(p.masuk)}`} />
                    <div className="w-1/2 rounded-t bg-red-400" style={{ height: `${(p.keluar / maxBar) * 100}%` }} title={`Keluar ${formatIDR(p.keluar)}`} />
                  </div>
                  <span className="text-[10px] text-muted">{formatMonth(p.label)}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">Hijau masuk, merah keluar.</p>
          </section>
        )}
      </div>

      {recent && (
        <section className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Transaksi bulan ini</h2>
            <Link href="/arus-kas?unit=semua" className="text-sm font-semibold text-primary hover:underline">
              Semua
            </Link>
          </div>
          {recent.rows.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Belum ada transaksi bulan ini.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {recent.rows.slice(0, 6).map(({ tx }) => {
                const clientName = typeof tx.client === "object" && tx.client ? tx.client.name : null;
                return (
                  <li key={tx.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{tx.reference || categoryLabel.get(tx.category)}</p>
                      <p className="text-xs text-muted">
                        {tx.unit === "supply" ? "Supply" : "Digital"} · {categoryLabel.get(tx.category)}
                        {clientName ? ` · ${clientName}` : ""}
                      </p>
                    </div>
                    <span className={"shrink-0 font-bold " + (tx.type === "masuk" ? "text-secondary-dark" : "text-red-600")}>
                      {tx.type === "masuk" ? "+" : "-"}
                      {formatIDR(tx.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
