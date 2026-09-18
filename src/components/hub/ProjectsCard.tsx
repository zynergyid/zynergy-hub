import Link from "next/link";
import { clientOfProject, type ProjectSummary } from "@/lib/projects";
import { daysLabel, formatIDR } from "@/lib/format";
import { projectStageLabel } from "@/lib/options";
import { cn } from "@/lib/cn";
import { Avatar } from "./Avatar";
import { Card } from "./Card";
import { HealthPill } from "./ProjectPills";
import { deadlinePill, deadlineTone } from "./deadline";

function Stat({ label, value, hint, alert = false }: { label: string; value: string; hint: string; alert?: boolean }) {
  return (
    <div className="rounded-xl bg-surface-soft p-3">
      <dt className="text-muted">{label}</dt>
      <dd className={cn("mt-0.5 truncate text-base font-extrabold", alert && "text-red-600")}>{value}</dd>
      <dd className="truncate text-muted">{hint}</dd>
    </div>
  );
}

/** Dashboard card: the running Digital and Apps projects, the ones that need a hand first. */
export function ProjectsCard({ summary, href, showMoney = true }: { summary: ProjectSummary; href: string; showMoney?: boolean }) {
  return (
    <Card title="Proyek berjalan" action={{ label: "Semua proyek", href }}>
      <dl className="grid grid-cols-3 gap-3 text-xs">
        <Stat label="Proyek berjalan" value={String(summary.openCount)} hint={showMoney ? formatIDR(summary.openValue) : "di unit Anda"} />
        <Stat label="Perlu perhatian" value={String(summary.attention)} hint="berisiko atau terhambat" alert={summary.attention > 0} />
        <Stat label="Lewat tenggat" value={String(summary.overdue)} hint="langkah berikutnya" alert={summary.overdue > 0} />
      </dl>
      {summary.upcoming.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Tidak ada proyek berjalan.</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {summary.upcoming.map((p) => {
            const client = clientOfProject(p);
            return (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <Avatar name={client?.name ?? p.name} />
                <div className="min-w-0 flex-1">
                  <Link href={`/projects/${p.id}`} className="block truncate text-sm font-semibold hover:text-primary">{p.name}</Link>
                  <p className="truncate text-xs text-muted">
                    {client?.name ?? "klien terhapus"} · {projectStageLabel.get(p.stage)}
                    {p.nextAction ? ` · ${p.nextAction}` : ""}
                  </p>
                </div>
                {p.nextActionAt && (
                  <span className={cn("hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline-flex", deadlinePill[deadlineTone(p.nextActionAt, 3)])}>
                    {daysLabel(p.nextActionAt)}
                  </span>
                )}
                <HealthPill health={p.health} />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
