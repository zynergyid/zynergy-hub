"use client";

import { useActionState, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { REFLECTIONS, REPORT_INDICATORS } from "@/content/perintis";
import type { Figures, ReflectionKey, ReportData, ReportKey } from "@/lib/perintis";
import { AutoTextarea } from "@/components/hub/AutoTextarea";
import { ErrorText, Input, Label, buttonPrimary, fieldClass } from "@/components/hub/form";
import { savePerintisReport, type PerintisState } from "./actions";

const initial: PerintisState = { status: "idle" };
const num = (v: number | null | undefined) => (typeof v === "number" ? String(v) : "");
const plain = new Intl.NumberFormat("id-ID");

/**
 * Targets set at the start of the period, manual realisation when Arus Kas is
 * not the source, and the written parts of FORM-04. Placeholders show what the
 * Hub already knows; the draft buttons fill a reflection from Hub records.
 */
export function ReportForm({ reportKey, data, computed, previous, drafts }: { reportKey: ReportKey; data?: ReportData; computed: Figures; previous?: Figures; drafts?: Partial<Record<ReflectionKey, string>> }) {
  const [state, action, pending] = useActionState(savePerintisReport, initial);
  const [text, setText] = useState<Record<ReflectionKey, string>>(() => Object.fromEntries(REFLECTIONS.map((r) => [r.key, data?.[r.key] ?? ""])) as Record<ReflectionKey, string>);
  const applyDraft = (key: ReflectionKey) => {
    const draft = drafts?.[key];
    if (!draft) return;
    setText((t) => ({ ...t, [key]: t[key].trim() ? `${t[key].trimEnd()}\n${draft}` : draft }));
  };
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="report" value={reportKey} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="pb-2 pr-3 font-medium">Indikator</th>
              <th className="pb-2 pr-3 font-medium">Target awal</th>
              <th className="pb-2 font-medium">Realisasi (kosongkan untuk memakai hitungan Hub)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {REPORT_INDICATORS.map((i) => {
              const prev = previous?.[i.key];
              const auto = computed[i.key];
              return (
                <tr key={i.key}>
                  <td className="py-2 pr-3">{i.label}</td>
                  <td className="py-2 pr-3">
                    <Input name={`target.${i.key}`} inputMode="numeric" defaultValue={num(data?.targets?.[i.key])} placeholder={typeof prev === "number" ? `Periode lalu ${plain.format(prev)}` : undefined} aria-label={`Target ${i.label}`} className="px-2.5 py-1.5 text-sm" />
                  </td>
                  <td className="py-2">
                    <Input name={`actual.${i.key}`} inputMode="numeric" defaultValue={num(data?.actualOverride?.[i.key])} placeholder={auto === null ? "Tidak dihitung otomatis" : `Dari Hub: ${plain.format(auto)}`} aria-label={`Realisasi ${i.label}`} className="px-2.5 py-1.5 text-sm" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {REFLECTIONS.map((r) => (
          <div key={r.key} className={r.key === "innovation" ? "sm:col-span-2" : undefined}>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`rp-${r.key}`}>{r.label}</Label>
              {drafts?.[r.key] && !text[r.key].includes(drafts[r.key]!) && (
                <button type="button" onClick={() => applyDraft(r.key)} className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  <Sparkles className="size-3.5" />
                  {text[r.key].trim() ? "Tambah dari Hub" : "Isi dari Hub"}
                </button>
              )}
            </div>
            <AutoTextarea id={`rp-${r.key}`} name={r.key} rows={2} value={text[r.key]} onChange={(e) => setText((t) => ({ ...t, [r.key]: e.target.value }))} className={fieldClass} />
          </div>
        ))}
        <div>
          <Label htmlFor="rp-sent">Dikirim ke panitia pada</Label>
          <input id="rp-sent" name="submittedAt" type="date" defaultValue={data?.submittedAt ? data.submittedAt.slice(0, 10) : ""} className={fieldClass} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Simpan laporan
        </button>
        {state.status === "error" && <ErrorText>{state.message}</ErrorText>}
        {state.status === "success" && <p className="text-sm text-secondary-dark">{state.message}</p>}
      </div>
    </form>
  );
}
