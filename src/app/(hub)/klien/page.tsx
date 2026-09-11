import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle, Plus } from "lucide-react";
import { canEditClients, getSessionUser } from "@/lib/session";
import { getPayloadClient } from "@/lib/payload";
import { daysUntil, formatIDR } from "@/lib/format";
import { first, type Search } from "@/lib/search";
import { clientStatuses, unitLabel } from "@/lib/options";
import { cn } from "@/lib/cn";
import { SegmentedLinks } from "@/components/hub/SegmentedLinks";

export const metadata: Metadata = { title: "Klien" };
export const dynamic = "force-dynamic";


const statusTone: Record<string, string> = {
  prospek: "bg-primary-soft text-primary-dark",
  aktif: "bg-secondary-soft text-secondary-dark",
  "jatuh-tempo": "bg-amber-50 text-amber-700",
  berhenti: "bg-surface-soft text-muted",
};


export default async function KlienPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getSessionUser();
  if (!user) redirect("/masuk");
  const sp = await searchParams;
  const status = first(sp.status) ?? "";
  const q = (first(sp.q) ?? "").trim();

  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "clients",
    limit: 500,
    sort: "renewalDate",
    where: {
      and: [
        { unit: { in: user.units.length ? user.units : ["none"] } },
        status ? { status: { equals: status } } : {},
        q ? { or: [{ name: { contains: q } }, { owner: { contains: q } }, { city: { contains: q } }] } : {},
      ],
    },
  });

  const href = (s: string) => `/klien?${new URLSearchParams({ ...(s ? { status: s } : {}), ...(q ? { q } : {}) })}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Klien</h1>
          <p className="text-sm text-muted">{docs.length} klien{status ? ` dengan status ${status}` : ""}.</p>
        </div>
        {canEditClients(user) && (
          <Link href="/klien/baru" className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark">
            <Plus className="size-4" />
            Klien baru
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SegmentedLinks
          ariaLabel="Status"
          segments={[
            { label: "Semua", href: href(""), active: !status },
            ...clientStatuses.map((s) => ({ label: s.label, href: href(s.value), active: status === s.value })),
          ]}
        />
        <form className="flex gap-2" action="/klien">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Cari nama, pemilik, kota" className="rounded-xl border border-line bg-white px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          <button type="submit" className="rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-semibold hover:border-primary/40">Cari</button>
        </form>
      </div>

      {docs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
          <p className="font-semibold">Belum ada klien{q ? ` untuk "${q}"` : ""}.</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((c) => {
            const d = c.renewalDate ? daysUntil(c.renewalDate) : null;
            return (
              <li key={c.id} className="flex flex-col rounded-2xl border border-line bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/klien/${c.id}`} className="block truncate font-bold hover:text-primary">{c.name}</Link>
                    <p className="truncate text-xs text-muted">{[c.owner, c.city].filter(Boolean).join(" · ") || "belum ada detail"}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold", statusTone[c.status])}>
                    {clientStatuses.find((s) => s.value === c.status)?.label}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-muted">Unit · paket</dt>
                    <dd className="font-semibold">{unitLabel.get(c.unit)}{c.package ? ` · ${c.package}` : ""}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Per tahun</dt>
                    <dd className="font-semibold">{c.annualFee ? formatIDR(c.annualFee) : "-"}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted">Perpanjangan</dt>
                    <dd className={cn("font-semibold", d !== null && d < 0 && "text-red-600", d !== null && d >= 0 && d <= 30 && "text-amber-700")}>
                      {d === null ? "belum diatur" : d < 0 ? `lewat ${-d} hari` : d === 0 ? "hari ini" : `${d} hari lagi`}
                    </dd>
                  </div>
                </dl>
                <div className="mt-3 flex gap-2 border-t border-line pt-3">
                  <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-secondary-soft px-3 py-1.5 text-xs font-bold text-secondary-dark hover:bg-secondary/20">
                    <MessageCircle className="size-3.5" />
                    WhatsApp
                  </a>
                  {(user.role === "admin" || user.role === "finance" || user.role === "viewer") && (
                    <Link href={`/arus-kas?unit=${c.unit}&q=${encodeURIComponent(c.name)}`} className="inline-flex items-center rounded-lg bg-surface-soft px-3 py-1.5 text-xs font-bold text-ink hover:bg-line">
                      Transaksi
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
