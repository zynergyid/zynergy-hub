import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { canEditClients, getSessionUser } from "@/lib/session";
import { resolveUnit } from "@/lib/finance";
import { followUpDue, getProspects, nextAction, ownerOf, primaryContact } from "@/lib/outreach";
import { daysLabel } from "@/lib/format";
import { buildHref, first, type Search } from "@/lib/search";
import { prospectSectors, prospectStatuses, unitLabel, type ProspectStatus } from "@/lib/options";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/hub/Avatar";
import { EmptyState } from "@/components/hub/EmptyState";
import { ProspectStatusPill } from "@/components/hub/ProspectStatusPill";
import { PageHeader } from "@/components/hub/PageHeader";
import { SearchForm } from "@/components/hub/SearchForm";
import { SegmentedLinks } from "@/components/hub/SegmentedLinks";
import { UnitTabs } from "@/components/hub/UnitTabs";
import { buttonPrimary } from "@/components/hub/form";

export const metadata: Metadata = { title: "Outreach" };
export const dynamic = "force-dynamic";

type Filter = ProspectStatus | "aktif" | "semua";
const filters: { label: string; value: Filter }[] = [
  { label: "Aktif", value: "aktif" },
  { label: "Perlu riset", value: "baru" },
  { label: "Draf siap", value: "draf" },
  { label: "Menunggu", value: "terkirim" },
  { label: "Dibalas", value: "dibalas" },
  { label: "Semua", value: "semua" },
];
const href = (base: Search, patch: Record<string, string | undefined> = {}) => buildHref("/outreach", base, patch);
const rowGrid = "md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_1.2fr_minmax(0,1.4fr)_auto]";

export default async function OutreachPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const allowed = user.units;
  const sp = await searchParams;
  const unit = resolveUnit(first(sp.unit), allowed);
  const filter = filters.find((f) => f.value === first(sp.status))?.value ?? "aktif";
  const q = (first(sp.q) ?? "").trim();
  const base: Search = { unit: unit === "semua" ? undefined : unit, status: filter === "aktif" ? undefined : filter, q: q || undefined };
  const rows = await getProspects({ unit, allowed, status: filter, q });
  const due = rows.filter(followUpDue).length;
  const sectorLabel = new Map<string, string>(prospectSectors.map((s) => [s.value, s.label]));

  return (
    <div className="space-y-5">
      <PageHeader title="Outreach" subtitle={`${rows.length} target${filter !== "aktif" && filter !== "semua" ? ` ${prospectStatuses.find((s) => s.value === filter)?.label.toLowerCase()}` : ""}${due ? ` · ${due} tindak lanjut jatuh tempo` : ""}.`}>
        {canEditClients(user) && (
          <Link href={unit === "semua" ? "/outreach/new" : `/outreach/new?unit=${unit}`} className={buttonPrimary}>
            <Plus className="size-4" />
            Target baru
          </Link>
        )}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <UnitTabs path="/outreach" base={base} unit={unit} allowed={allowed} />
        <SegmentedLinks ariaLabel="Status" segments={filters.map((f) => ({ label: f.label, href: href(base, { status: f.value === "aktif" ? undefined : f.value }), active: filter === f.value }))} />
        <SearchForm action="/outreach" hidden={{ unit: base.unit as string | undefined, status: base.status as string | undefined }} q={q} placeholder="Cari perusahaan, kota, kontak" />
      </div>

      {canEditClients(user) && <p className="text-xs text-muted">Riset dan draf diisi otomatis dengan menjalankan <span className="font-semibold">/outreach</span> di Claude Code; di sini Anda memeriksa, mengirim sendiri, dan mencatat.</p>}

      {rows.length === 0 ? (
        <EmptyState title={`Belum ada target${q ? ` untuk "${q}"` : ""}.`} hint="Tambahkan usaha atau orang yang ingin didekati; klien lama cocok untuk mulai." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className={cn("hidden gap-3 border-b border-line px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-muted md:grid", rowGrid)}>
            <span>Target</span>
            <span>Kontak</span>
            <span>Status</span>
            <span>Langkah berikutnya</span>
            <span />
          </div>
          <ul className="divide-y divide-line">
            {rows.map((p) => {
              const c = primaryContact(p);
              const owner = ownerOf(p);
              const isDue = followUpDue(p);
              return (
                <li key={p.id}>
                  <Link href={`/outreach/${p.id}`} className={cn("grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 px-4 py-3 hover:bg-surface-soft md:items-center", rowGrid)}>
                    <div className="min-w-0">
                      <p className="truncate font-bold">
                        {p.company}
                        {p.client ? <span className="ml-1.5 rounded bg-secondary-soft px-1.5 py-0.5 text-[10px] font-bold text-secondary-dark">klien</span> : null}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {[p.sector ? sectorLabel.get(p.sector) : null, p.city, allowed.length > 1 ? unitLabel.get(p.unit) : null].filter(Boolean).join(" · ") || "belum ada detail"}
                      </p>
                    </div>
                    <div className="justify-self-end md:order-none md:justify-self-start">
                      <ProspectStatusPill status={p.status} />
                    </div>
                    <p className="col-span-2 truncate text-xs text-muted md:col-span-1 md:text-sm">{c ? `${c.name}${c.role ? `, ${c.role}` : ""}` : "belum ada kontak"}</p>
                    <p className={cn("col-span-2 text-xs md:col-span-1 md:text-sm", isDue ? "font-semibold text-red-600" : "text-muted")}>
                      {nextAction(p)}
                      {isDue && p.nextFollowUpAt ? ` (${daysLabel(p.nextFollowUpAt)})` : ""}
                    </p>
                    <div className="hidden md:block">{owner && <Avatar name={owner.name} className="size-7 text-[10px]" />}</div>
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
