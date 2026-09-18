import { Plus, Square, SquareCheckBig, Trash2 } from "lucide-react";
import type { Project } from "@/payload-types";
import { formatDate } from "@/lib/format";
import { deliverableProgress } from "@/lib/projects";
import { cn } from "@/lib/cn";
import { Card } from "@/components/hub/Card";
import { ConfirmButton } from "@/components/hub/ConfirmButton";
import { buttonOutline, fieldClass } from "@/components/hub/form";
import { addDeliverable, removeDeliverable, toggleDeliverable } from "./actions";

/** The checklist copied from the signed scope; ticking it is what "progress" means. */
export function DeliverablesCard({ project, editable }: { project: Project; editable: boolean }) {
  const rows = project.deliverables ?? [];
  const { done, total } = deliverableProgress(project);
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <Card title="Deliverable">
      {total > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{done} dari {total} selesai</span>
            <span>{pct}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-soft">
            <div className="h-full rounded-full bg-secondary" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
      {rows.length === 0 ? (
        <p className="text-sm text-muted">Belum ada deliverable. Salin daftar dari scope yang disetujui.</p>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((d) => (
            <li key={d.id ?? d.title} className="flex items-center gap-2 py-2 text-sm">
              {editable && d.id ? (
                <form action={toggleDeliverable} className="flex">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="rowId" value={d.id} />
                  <button type="submit" aria-label={d.done ? "Tandai belum selesai" : "Tandai selesai"} className={cn("rounded-md p-0.5", d.done ? "text-secondary-dark" : "text-muted hover:text-ink")}>
                    {d.done ? <SquareCheckBig className="size-4" /> : <Square className="size-4" />}
                  </button>
                </form>
              ) : d.done ? (
                <SquareCheckBig className="size-4 shrink-0 text-secondary-dark" aria-hidden />
              ) : (
                <Square className="size-4 shrink-0 text-muted" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <p className={cn("truncate", d.done && "text-muted line-through")}>{d.title}</p>
                {d.done && d.doneAt && <p className="text-xs text-muted">{formatDate(d.doneAt)}</p>}
              </div>
              {editable && d.id && (
                <form action={removeDeliverable}>
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="rowId" value={d.id} />
                  <ConfirmButton message={`Hapus "${d.title}"?`} aria-label="Hapus deliverable" className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="size-4" />
                  </ConfirmButton>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
      {editable && (
        <form action={addDeliverable} className="mt-3 flex gap-2 border-t border-line pt-3">
          <input type="hidden" name="projectId" value={project.id} />
          <input name="title" required className={`${fieldClass} py-2`} placeholder="Tambah deliverable" />
          <button type="submit" className={buttonOutline}>
            <Plus className="size-4" />
            Tambah
          </button>
        </form>
      )}
    </Card>
  );
}
