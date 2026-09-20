import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { canEditProjects, canSeeMoney, getSessionUser } from "@/lib/session";
import { resolveUnit } from "@/lib/finance";
import { actionOverdue, clientOfProject, getProjects, isOpenProject, projectUnitsOf, type ProjectListFilter } from "@/lib/projects";
import { daysLabel, formatIDR } from "@/lib/format";
import { buildHref, first, type Search } from "@/lib/search";
import { projectStageLabel, unitLabel } from "@/lib/options";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/hub/EmptyState";
import { PageHeader } from "@/components/hub/PageHeader";
import { HealthPill, ProjectStagePill } from "@/components/hub/ProjectPills";
import { SearchForm } from "@/components/hub/SearchForm";
import { SegmentedLinks } from "@/components/hub/SegmentedLinks";
import { UnitTabs } from "@/components/hub/UnitTabs";
import { deadlineText, deadlineTone } from "@/components/hub/deadline";
import { buttonPrimary } from "@/components/hub/form";

export const metadata: Metadata = { title: "Proyek" };
export const dynamic = "force-dynamic";

const filters: { label: string; value: ProjectListFilter }[] = [
  { label: "Berjalan", value: "berjalan" },
  { label: "Selesai", value: "selesai" },
  { label: "Semua", value: "semua" },
];
const href = (base: Search, patch: Record<string, string | undefined> = {}) => buildHref("/projects", base, patch);
const rowGrid = "md:grid-cols-[minmax(0,2.2fr)_1fr_1fr_minmax(0,1.6fr)_minmax(0,1fr)]";
const rowGridNoMoney = "md:grid-cols-[minmax(0,2.2fr)_1fr_1fr_minmax(0,1.6fr)]";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const allowed = projectUnitsOf(user.units);
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

  const projects = await getProjects({ unit, allowed, filter, q });
  const open = projects.filter(isOpenProject);
  const openValue = open.reduce((s, p) => s + (p.value ?? 0), 0);
  const attention = open.filter((p) => p.health !== "lancar").length;
  const subtitle = [
    `${projects.length} proyek${filter === "berjalan" ? " berjalan" : filter === "selesai" ? " selesai" : ""}`,
    unit !== "semua" ? `di ${unitLabel.get(unit)}` : null,
    attention ? `${attention} perlu perhatian` : null,
    money && openValue ? `nilai berjalan ${formatIDR(openValue)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-5">
      <PageHeader title="Proyek" subtitle={`${subtitle}.`}>
        {canEditProjects(user) && allowed.length > 0 && (
          <Link href={unit === "semua" ? "/projects/new" : `/projects/new?unit=${unit}`} className={buttonPrimary}>
            <Plus className="size-4" />
            Proyek baru
          </Link>
        )}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <UnitTabs path="/projects" base={base} unit={unit} allowed={allowed} />
        <SegmentedLinks
          ariaLabel="Status"
          segments={filters.map((f) => ({
            label: f.label,
            href: href(base, { filter: f.value === "berjalan" ? undefined : f.value }),
            active: filter === f.value,
          }))}
        />
        <SearchForm action="/projects" hidden={{ unit: base.unit as string | undefined, filter: base.filter as string | undefined }} q={q} placeholder="Cari nama proyek, klien" />
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title={allowed.length === 0 ? "Proyek hanya ada di unit Digital dan Apps." : `Belum ada proyek${q ? ` untuk "${q}"` : filter === "berjalan" ? " yang berjalan" : ""}.`}
          hint={allowed.length === 0 ? "Pesanan Supply dicatat di menu Pesanan." : "Satu proyek per pekerjaan klien, dari discovery sampai serah terima."}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className={cn("hidden gap-3 border-b border-line px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-muted md:grid", grid)}>
            <span>Proyek</span>
            <span>Tahap</span>
            <span>Kesehatan</span>
            <span>Langkah berikutnya</span>
            {money && <span className="text-right">Nilai</span>}
          </div>
          <ul className="divide-y divide-line">
            {projects.map((p) => {
              const client = clientOfProject(p);
              const overdue = actionOverdue(p);
              return (
                <li key={p.id}>
                  <Link href={`/projects/${p.id}`} className={cn("grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 px-4 py-3 hover:bg-surface-soft md:items-center", grid)}>
                    <div className="min-w-0">
                      <p className="truncate font-bold">{p.name}</p>
                      <p className="truncate text-xs text-muted">
                        {client?.name ?? "klien terhapus"}
                        {allowed.length > 1 ? ` · ${unitLabel.get(p.unit)}` : ""}
                        <span className="md:hidden"> · {projectStageLabel.get(p.stage)}</span>
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <ProjectStagePill stage={p.stage} />
                    </div>
                    <div className="justify-self-end md:justify-self-start">
                      <HealthPill health={p.health} />
                    </div>
                    <p className={cn("col-span-2 truncate text-xs md:col-span-1 md:text-sm", overdue ? "font-semibold text-red-600" : p.nextActionAt ? deadlineText[deadlineTone(p.nextActionAt, 3)] : "text-muted")}>
                      {p.nextAction || (isOpenProject(p) ? "belum diisi" : "-")}
                      {p.nextActionAt && isOpenProject(p) ? ` (${daysLabel(p.nextActionAt)})` : ""}
                    </p>
                    {money && <p className="col-span-2 text-sm font-extrabold md:col-span-1 md:text-right">{p.value ? formatIDR(p.value) : "-"}</p>}
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
