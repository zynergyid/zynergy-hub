import { ArrowRight, Check } from "lucide-react";
import type { Project } from "@/payload-types";
import { daysLabel, daysUntil, formatDate, todayLocal } from "@/lib/format";
import { openProjectStages, projectHealth, projectStageHint, projectStageLabel, projectStages } from "@/lib/options";
import { actionOverdue, isOpenProject } from "@/lib/project-rules";
import { cn } from "@/lib/cn";
import { Card } from "@/components/hub/Card";
import { HealthPill } from "@/components/hub/ProjectPills";
import { Select } from "@/components/hub/Select";
import { ErrorText, Label, buttonOutline, buttonPrimary, fieldClass } from "@/components/hub/form";
import { deadlineText, deadlineTone } from "@/components/hub/deadline";
import { setStage, updateProjectStatus } from "./actions";

const steps = [...openProjectStages, "selesai"] as const;
const day = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");

/** The stepper: where the project is, what "done" means here, and the button to the next stage. */
export function StageCard({ project, editable, error }: { project: Project; editable: boolean; error?: string }) {
  const open = isOpenProject(project);
  const idx = steps.indexOf(project.stage as (typeof steps)[number]);
  const next = open ? steps[idx + 1] : null;
  const sinceDays = project.stageChangedAt ? Math.max(0, -daysUntil(project.stageChangedAt)) : null;
  return (
    <Card title="Tahap">
      <ol className="flex flex-wrap gap-1.5">
        {steps.map((s, i) => {
          const state = idx < 0 ? "todo" : i < idx ? "done" : i === idx ? "now" : "todo";
          return (
            <li
              key={s}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold",
                state === "done" && "border-secondary/30 bg-secondary-soft text-secondary-dark",
                state === "now" && "border-primary bg-primary text-white",
                state === "todo" && "border-line bg-white text-muted",
              )}
            >
              {state === "done" ? <Check className="size-3" /> : <span>{i + 1}</span>}
              {projectStageLabel.get(s)}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm">
        <span className="font-semibold">{projectStageLabel.get(project.stage)}</span>
        {project.stageChangedAt && sinceDays !== null && (
          <span className="text-muted">
            {" "}· sejak {formatDate(project.stageChangedAt)} ({sinceDays} hari)
          </span>
        )}
      </p>
      <p className="text-xs text-muted">{projectStageHint.get(project.stage)}</p>
      <ErrorText>{error === "brief" ? "Isi Brief dulu (minimal tujuan, pengguna, dan alur sekarang) sebelum meninggalkan Discovery." : null}</ErrorText>
      {editable && (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          {next && (
            <form action={setStage} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="projectId" value={project.id} />
              <input type="hidden" name="stage" value={next} />
              <div className="min-w-0 flex-1">
                <Label htmlFor="ps-note">Catatan (opsional)</Label>
                <input id="ps-note" name="note" className={fieldClass} placeholder="Misal: brief disetujui klien lewat WA" />
              </div>
              <button type="submit" className={buttonPrimary}>
                {next === "selesai" ? "Tutup proyek" : `Lanjut ke ${projectStageLabel.get(next)}`}
                <ArrowRight className="size-4" />
              </button>
            </form>
          )}
          <form action={setStage} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="projectId" value={project.id} />
            <div className="min-w-44">
              <Label htmlFor="ps-stage">Ubah tahap</Label>
              <Select id="ps-stage" name="stage" defaultValue={project.stage} options={projectStages.map(({ label, value }) => ({ label, value }))} size="compact" />
            </div>
            <div>
              <Label htmlFor="ps-since">Sejak (opsional)</Label>
              <input id="ps-since" name="since" type="date" max={todayLocal()} className={`${fieldClass} py-1.5 text-xs`} />
            </div>
            <button type="submit" className={buttonOutline}>Simpan tahap</button>
          </form>
          <p className="text-xs text-muted">Tahap yang sama dengan tanggal terisi hanya memundurkan tanggal mulainya, untuk proyek yang dimasukkan ke Hub setelah berjalan.</p>
        </div>
      )}
    </Card>
  );
}

/** The weekly line the owner fills: health flag, next step with its date, what we wait for. */
export function HealthCard({ project, editable }: { project: Project; editable: boolean }) {
  const overdue = actionOverdue(project);
  return (
    <Card title="Status mingguan">
      {editable ? (
        <form action={updateProjectStatus} className="space-y-3">
          <input type="hidden" name="projectId" value={project.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="ph-health">Kesehatan</Label>
              <Select id="ph-health" name="health" defaultValue={project.health} options={projectHealth} />
            </div>
            <div>
              <Label htmlFor="ph-blocker">Menunggu apa</Label>
              <input id="ph-blocker" name="blocker" defaultValue={project.blocker ?? ""} className={fieldClass} placeholder="Misal: foto produk dari klien" />
            </div>
            <div>
              <Label htmlFor="ph-next">Langkah berikutnya</Label>
              <input id="ph-next" name="nextAction" defaultValue={project.nextAction ?? ""} className={fieldClass} placeholder="Misal: kirim link staging untuk review" />
            </div>
            <div>
              <Label htmlFor="ph-date">Tenggat langkah</Label>
              <input id="ph-date" name="nextActionAt" type="date" defaultValue={day(project.nextActionAt)} className={fieldClass} />
              {project.nextActionAt && <p className={cn("mt-1 text-xs", deadlineText[deadlineTone(project.nextActionAt, 3)])}>{daysLabel(project.nextActionAt)}</p>}
            </div>
          </div>
          <p className="text-xs text-muted">Diisi sekali seminggu oleh penanggung jawab. Kesehatan dipilih, bukan dihitung.</p>
          <button type="submit" className={buttonPrimary}>Simpan status</button>
        </form>
      ) : (
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted">Kesehatan</dt>
            <dd className="mt-0.5"><HealthPill health={project.health} /></dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Menunggu apa</dt>
            <dd className="font-semibold">{project.blocker || "-"}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-muted">Langkah berikutnya</dt>
            <dd className={cn("font-semibold", overdue && "text-red-600")}>
              {project.nextAction || "-"}
              {project.nextActionAt ? ` (${daysLabel(project.nextActionAt)})` : ""}
            </dd>
          </div>
        </dl>
      )}
    </Card>
  );
}
