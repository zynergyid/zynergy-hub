import type { Project } from "@/payload-types";
import { formatDate } from "@/lib/format";
import { briefComplete } from "@/lib/projects";
import { Card } from "@/components/hub/Card";
import { Label, buttonPrimary, fieldClass } from "@/components/hub/form";
import { saveBrief } from "./actions";

const lines: { name: keyof NonNullable<Project["brief"]>; label: string; placeholder: string; required?: boolean }[] = [
  { name: "goals", label: "Tujuan bisnis", placeholder: "Apa yang berubah untuk bisnis klien kalau proyek ini berhasil?", required: true },
  { name: "users", label: "Pengguna", placeholder: "Siapa yang memakai, di perangkat apa, seberapa sering.", required: true },
  { name: "currentFlow", label: "Alur sekarang", placeholder: "Langkah demi langkah cara kerja hari ini, termasuk yang manual.", required: true },
  { name: "targetFlow", label: "Alur yang diinginkan", placeholder: "Langkah demi langkah setelah aplikasi ada." },
  { name: "successMeasure", label: "Ukuran sukses", placeholder: "Angka atau kejadian yang bisa dicek 3 bulan setelah launch." },
  { name: "constraints", label: "Batasan", placeholder: "Tenggat, anggaran, data pribadi, sistem lain yang harus dipakai." },
];

/**
 * The Discovery artifact: business analysis on one page, written in the Hub
 * so the stage gate can check it and the client can confirm it before DP.
 */
export function BriefCard({ project, editable }: { project: Project; editable: boolean }) {
  const brief = project.brief ?? {};
  const complete = briefComplete(project);
  const confirmed = brief.confirmedAt ? formatDate(brief.confirmedAt) : null;
  const status = confirmed ? `Dikonfirmasi klien ${confirmed}` : complete ? "Terisi, belum dikonfirmasi klien" : "Belum lengkap";
  return (
    <Card title="Brief">
      <p className="mb-3 text-xs text-muted">
        Analisis bisnis satu halaman dari sesi discovery. <span className={confirmed ? "font-semibold text-secondary-dark" : complete ? "font-semibold text-amber-700" : "font-semibold text-red-600"}>{status}.</span>
      </p>
      {editable ? (
        <form action={saveBrief} className="space-y-3">
          <input type="hidden" name="projectId" value={project.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            {lines.map((l) => (
              <div key={l.name} className={l.name === "currentFlow" || l.name === "targetFlow" ? "sm:col-span-2" : undefined}>
                <Label htmlFor={`br-${l.name}`}>
                  {l.label}
                  {l.required ? " *" : ""}
                </Label>
                <textarea id={`br-${l.name}`} name={l.name} rows={l.name === "currentFlow" || l.name === "targetFlow" ? 4 : 2} defaultValue={(brief[l.name] as string | null | undefined) ?? ""} className={fieldClass} placeholder={l.placeholder} />
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="confirmed" defaultChecked={Boolean(brief.confirmedAt)} className="size-4 rounded border-line" />
            Klien sudah membaca dan mengonfirmasi brief ini
          </label>
          <p className="text-xs text-muted">Tiga kolom bertanda * wajib sebelum proyek boleh meninggalkan Discovery.</p>
          <button type="submit" className={buttonPrimary}>Simpan brief</button>
        </form>
      ) : (
        <dl className="space-y-3 text-sm">
          {lines.map((l) => (
            <div key={l.name}>
              <dt className="text-xs text-muted">{l.label}</dt>
              <dd className="whitespace-pre-wrap">{(brief[l.name] as string | null | undefined) || "-"}</dd>
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
}
