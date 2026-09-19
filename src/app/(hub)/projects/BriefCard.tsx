"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Pencil } from "lucide-react";
import type { Project } from "@/payload-types";
import { formatDate } from "@/lib/format";
import { briefComplete } from "@/lib/project-rules";
import { cn } from "@/lib/cn";
import { Card } from "@/components/hub/Card";
import { AutoTextarea } from "@/components/hub/AutoTextarea";
import { MarkdownLite } from "@/components/hub/MarkdownLite";
import { Label, buttonOutline, buttonPrimary, fieldClass } from "@/components/hub/form";
import { saveBrief } from "./actions";

type BriefField = keyof NonNullable<Project["brief"]>;
const lines: { name: BriefField; label: string; placeholder: string; required?: boolean }[] = [
  { name: "goals", label: "Tujuan bisnis", placeholder: "Apa yang berubah untuk bisnis klien kalau proyek ini berhasil?", required: true },
  { name: "users", label: "Pengguna", placeholder: "Siapa yang memakai, di perangkat apa, seberapa sering.", required: true },
  { name: "currentFlow", label: "Alur sekarang", placeholder: "Langkah demi langkah cara kerja hari ini, termasuk yang manual.", required: true },
  { name: "targetFlow", label: "Alur yang diinginkan", placeholder: "Langkah demi langkah setelah aplikasi ada." },
  { name: "successMeasure", label: "Ukuran sukses", placeholder: "Angka atau kejadian yang bisa dicek 3 bulan setelah launch." },
  { name: "constraints", label: "Batasan", placeholder: "Tenggat, anggaran, data pribadi, sistem lain yang harus dipakai." },
  { name: "references", label: "Referensi", placeholder: "Aplikasi pembanding, standar atau metode, contoh laporan. Satu per baris: nama, tautan, apa yang bisa dipelajari." },
];
const wide = new Set<BriefField>(["currentFlow", "targetFlow", "references"]);
const valueOf = (brief: Project["brief"], name: BriefField) => (brief?.[name] as string | null | undefined) ?? "";

/**
 * The Discovery artifact: business analysis on one page. Read view by
 * default (lists, bold, and links rendered); the form opens on demand, or
 * straight away while the brief is still incomplete.
 */
export function BriefCard({ project, editable }: { project: Project; editable: boolean }) {
  const brief = project.brief ?? {};
  const complete = briefComplete(project);
  const confirmed = brief.confirmedAt ? formatDate(brief.confirmedAt) : null;
  const [editing, setEditing] = useState(editable && !complete);
  const status = confirmed ? `Dikonfirmasi klien ${confirmed}` : complete ? "Terisi, belum dikonfirmasi klien" : "Belum lengkap";
  const tone = confirmed ? "text-secondary-dark" : complete ? "text-amber-700" : "text-red-600";

  return (
    <Card title="Brief">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">
          Analisis bisnis satu halaman dari sesi discovery. <span className={cn("font-semibold", tone)}>{status}.</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {complete && !editing && (
            <Link href={`/projects/${project.id}/brief`} className={buttonOutline}>
              <FileText className="size-4" />
              Versi untuk klien
            </Link>
          )}
          {editable && !editing && (
            <button type="button" onClick={() => setEditing(true)} className={buttonOutline}>
              <Pencil className="size-4" />
              Ubah brief
            </button>
          )}
        </div>
      </div>
      {editing ? (
        <form action={saveBrief} className="space-y-3">
          <input type="hidden" name="projectId" value={project.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            {lines.map((l) => (
              <div key={l.name} className={wide.has(l.name) ? "sm:col-span-2" : undefined}>
                <Label htmlFor={`br-${l.name}`}>
                  {l.label}
                  {l.required ? " *" : ""}
                </Label>
                <AutoTextarea id={`br-${l.name}`} name={l.name} rows={wide.has(l.name) ? 4 : 2} defaultValue={valueOf(brief, l.name)} className={fieldClass} placeholder={l.placeholder} />
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="confirmed" defaultChecked={Boolean(brief.confirmedAt)} className="size-4 rounded border-line" />
            Klien sudah membaca dan mengonfirmasi brief ini
          </label>
          <p className="text-xs text-muted">Tiga kolom bertanda * wajib sebelum proyek boleh meninggalkan Discovery. Daftar dengan {"\"- \""} atau {"\"1. \""} dan **tebal** ditampilkan rapi.</p>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={buttonPrimary}>Simpan brief</button>
            {complete && (
              <button type="button" onClick={() => setEditing(false)} className={buttonOutline}>Batal</button>
            )}
          </div>
        </form>
      ) : (
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {lines.map((l) => {
            const v = valueOf(brief, l.name);
            return (
              <div key={l.name} className={wide.has(l.name) ? "sm:col-span-2" : undefined}>
                <dt className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">{l.label}</dt>
                <dd>{v ? <MarkdownLite text={v} /> : <span className="text-sm text-muted">-</span>}</dd>
              </div>
            );
          })}
        </dl>
      )}
    </Card>
  );
}
