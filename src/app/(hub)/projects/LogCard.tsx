import type { Project } from "@/payload-types";
import { formatDate } from "@/lib/format";
import { projectLogLabel, projectLogTypes } from "@/lib/options";
import { Card } from "@/components/hub/Card";
import { Select } from "@/components/hub/Select";
import { buttonOutline, fieldClass } from "@/components/hub/form";
import { addProjectLog } from "./actions";

/** Dated decisions, change requests, and client feedback: the flow written as it happens. */
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
        <form action={addProjectLog} className="mt-3 grid gap-2 border-t border-line pt-3 sm:grid-cols-[10rem_1fr_auto]">
          <input type="hidden" name="projectId" value={project.id} />
          <Select name="type" defaultValue="catatan" options={addable} size="compact" />
          <input name="note" required className={`${fieldClass} py-2`} placeholder="Keputusan, permintaan perubahan, masukan klien" />
          <button type="submit" className={buttonOutline}>Catat</button>
        </form>
      )}
    </Card>
  );
}
