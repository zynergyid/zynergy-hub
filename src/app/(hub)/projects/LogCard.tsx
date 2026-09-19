import type { Project } from "@/payload-types";
import { formatDate, todayLocal } from "@/lib/format";
import { projectLogLabel, projectLogTypes } from "@/lib/options";
import { AutoTextarea } from "@/components/hub/AutoTextarea";
import { Card } from "@/components/hub/Card";
import { Select } from "@/components/hub/Select";
import { Label, buttonOutline, fieldClass } from "@/components/hub/form";
import { addProjectLog } from "./actions";

/** Dated meetings, decisions, change requests, and client feedback: the flow written as it happens. Meeting notes feed /brief. */
export function LogCard({ project, editable }: { project: Project; editable: boolean }) {
  const log = [...(project.log ?? [])].reverse();
  const addable = projectLogTypes.filter((t) => t.value !== "tahap" && t.value !== "status");
  return (
    <Card title="Riwayat">
      {log.length === 0 ? (
        <p className="text-sm text-muted">Belum ada catatan.</p>
      ) : (
        <ul className="divide-y divide-line">
          {log.map((l) => (
            <li key={l.id ?? `${l.date}-${l.type}`} className="flex items-start gap-3 py-2.5 text-sm">
              <span className="mt-0.5 shrink-0 rounded-full bg-surface-soft px-2 py-0.5 text-[11px] font-bold text-muted">{projectLogLabel.get(l.type) ?? l.type}</span>
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap">{l.note || "-"}</p>
                <p className="text-xs text-muted">{formatDate(l.date)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editable && (
        <form action={addProjectLog} className="mt-3 space-y-2 border-t border-line pt-3">
          <input type="hidden" name="projectId" value={project.id} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="lg-type">Jenis</Label>
              <Select id="lg-type" name="type" defaultValue="catatan" options={addable} size="compact" />
            </div>
            <div>
              <Label htmlFor="lg-date">Tanggal</Label>
              <input id="lg-date" name="date" type="date" max={todayLocal()} className={`${fieldClass} px-2.5 py-1.5 text-xs`} />
            </div>
          </div>
          <AutoTextarea name="note" required rows={2} className={`${fieldClass} py-2`} placeholder="Catatan pertemuan (apa yang klien lakukan sekarang, siapa, berapa sering, apa yang sering salah), keputusan, permintaan perubahan, masukan klien" />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted">Catatan berjenis Pertemuan dibaca /brief saat menyusun brief. Tanggal kosong = hari ini.</p>
            <button type="submit" className={buttonOutline}>Catat</button>
          </div>
        </form>
      )}
    </Card>
  );
}
