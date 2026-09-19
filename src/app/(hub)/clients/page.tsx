import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, MessageCircle, Plus } from "lucide-react";
import type { Client } from "@/payload-types";
import { canEdit, canSeeMoney, getSessionUser } from "@/lib/session";
import { getPayloadClient } from "@/lib/payload";
import { resolveUnit, scopeUnits } from "@/lib/finance";
import { daysLabel, formatIDR } from "@/lib/format";
import { buildHref, first, type Search } from "@/lib/search";
import { clientStatuses, unitLabel, units } from "@/lib/options";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/hub/EmptyState";
import { SearchForm } from "@/components/hub/SearchForm";
import { SegmentedLinks } from "@/components/hub/SegmentedLinks";
import { UnitTabs } from "@/components/hub/UnitTabs";
import { deadlineText, deadlineTone } from "@/components/hub/deadline";
import { buttonPrimary } from "@/components/hub/form";

export const metadata: Metadata = { title: "Klien" };
export const dynamic = "force-dynamic";

const statusTone: Record<string, string> = {
  prospek: "bg-primary-soft text-primary-dark",
  aktif: "bg-secondary-soft text-secondary-dark",
  "jatuh-tempo": "bg-amber-50 text-amber-700",
  berhenti: "bg-surface-soft text-muted",
};
const href = (base: Search, patch: Record<string, string | undefined> = {}) => buildHref("/clients", base, patch);

function ClientCard({ c, money }: { c: Client; money: boolean }) {
  const isSupply = c.unit === "supply";
  return (
    <li className="flex flex-col rounded-2xl border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/clients/${c.id}`} className="block truncate font-bold hover:text-primary">{c.name}</Link>
          <p className="truncate text-xs text-muted">{[c.owner, c.city].filter(Boolean).join(" · ") || "belum ada detail"}</p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold", statusTone[c.status])}>
          {clientStatuses.find((s) => s.value === c.status)?.label}
        </span>
      </div>
      {isSupply ? (
        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div>
            <dt className="text-muted">Termin</dt>
            <dd className="font-semibold">Net {c.supply?.paymentTermsDays ?? 30} hari</dd>
          </div>
          <div>
            <dt className="text-muted">Nomor vendor</dt>
            <dd className="font-semibold">{c.supply?.vendorNumber || "-"}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted">Badan hukum</dt>
            <dd className="truncate font-semibold">{c.supply?.legalName || "belum diisi"}</dd>
          </div>
        </dl>
      ) : (
        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div>
            <dt className="text-muted">Paket</dt>
            <dd className="font-semibold">{c.package ?? "belum ditentukan"}</dd>
          </div>
          <div>
            <dt className="text-muted">Per tahun</dt>
            <dd className="font-semibold">{c.annualFee ? formatIDR(c.annualFee) : "-"}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted">Perpanjangan</dt>
            <dd className={cn("font-semibold", c.renewalDate && deadlineText[deadlineTone(c.renewalDate, 30)])}>
              {c.renewalDate ? daysLabel(c.renewalDate) : "belum diatur"}
            </dd>
          </div>
        </dl>
      )}
      <div className="mt-3 flex gap-2 border-t border-line pt-3">
        {c.whatsapp && (
          <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-secondary-soft px-3 py-1.5 text-xs font-bold text-secondary-dark hover:bg-secondary/20">
            <MessageCircle className="size-3.5" />
            WhatsApp
          </a>
        )}
        {money && isSupply && (
          <Link href={`/orders?unit=supply&filter=semua&q=${encodeURIComponent(c.name)}`} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary-dark hover:bg-primary/15">
            <ClipboardList className="size-3.5" />
            Pesanan
          </Link>
        )}
        {money && (
          <Link href={`/cash-flow?unit=${c.unit}&q=${encodeURIComponent(c.name)}`} className="inline-flex items-center rounded-lg bg-surface-soft px-3 py-1.5 text-xs font-bold text-ink hover:bg-line">
            Transaksi
          </Link>
        )}
      </div>
    </li>
  );
}

export default async function KlienPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const allowed = user.units;
  const sp = await searchParams;
  const unit = resolveUnit(first(sp.unit), allowed);
  const status = clientStatuses.some((s) => s.value === first(sp.status)) ? (first(sp.status) as string) : "";
  const q = (first(sp.q) ?? "").trim();
  const money = canSeeMoney(user);
  const base: Search = { unit: unit === "semua" ? undefined : unit, status: status || undefined, q: q || undefined };
  const scoped = scopeUnits(unit, allowed);

  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "clients",
    limit: 500,
    sort: ["renewalDate", "name"],
    where: {
      and: [
        { unit: { in: scoped.length ? scoped : ["none"] } },
        status ? { status: { equals: status } } : {},
        q ? { or: [{ name: { contains: q } }, { owner: { contains: q } }, { city: { contains: q } }] } : {},
      ],
    },
  });

  // "Semua" shows one section per unit so the lines never blend into one list.
  const groups =
    unit === "semua"
      ? units.filter((u) => allowed.includes(u.value)).map((u) => ({ unit: u.value, label: u.label, docs: docs.filter((c) => c.unit === u.value) }))
      : [{ unit, label: unitLabel.get(unit) ?? unit, docs }];
  const statusLabel = clientStatuses.find((s) => s.value === status)?.label;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Klien</h1>
          <p className="text-sm text-muted">
            {docs.length} klien{unit !== "semua" ? ` di ${unitLabel.get(unit)}` : ""}{statusLabel ? ` dengan status ${statusLabel}` : ""}.
          </p>
        </div>
        {canEdit(user) && (
          <Link href={unit === "semua" ? "/clients/new" : `/clients/new?unit=${unit}`} className={buttonPrimary}>
            <Plus className="size-4" />
            Klien baru
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <UnitTabs path="/clients" base={base} unit={unit} allowed={allowed} />
        <SegmentedLinks
          ariaLabel="Status"
          segments={[
            { label: "Semua", href: href(base, { status: undefined }), active: !status },
            ...clientStatuses.map((s) => ({ label: s.label, href: href(base, { status: s.value }), active: status === s.value })),
          ]}
        />
        <SearchForm action="/clients" hidden={{ unit: base.unit as string | undefined, status: status || undefined }} q={q} placeholder="Cari nama, pemilik, kota" />
      </div>

      {docs.length === 0 ? (
        <EmptyState title={`Belum ada klien${q ? ` untuk "${q}"` : ""}${unit !== "semua" ? ` di ${unitLabel.get(unit)}` : ""}.`} />
      ) : (
        groups
          .filter((g) => g.docs.length > 0)
          .map((g) => (
            <section key={g.unit} className="space-y-3">
              {unit === "semua" && (
                <h2 className="flex items-baseline gap-2 text-sm font-bold uppercase tracking-wider text-muted">
                  {g.label}
                  <span className="text-xs font-semibold normal-case tracking-normal">{g.docs.length} klien</span>
                </h2>
              )}
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.docs.map((c) => (
                  <ClientCard key={c.id} c={c} money={money} />
                ))}
              </ul>
            </section>
          ))
      )}
    </div>
  );
}
