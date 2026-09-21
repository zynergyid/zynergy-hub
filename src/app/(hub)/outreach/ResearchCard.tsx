"use client";

import { useRef, useState } from "react";
import { ExternalLink, Pencil, ListChecks } from "lucide-react";
import { parseResearch, shortUrl } from "@/lib/research";
import { researchTemplates } from "@/lib/options";
import { Card } from "@/components/hub/Card";
import { Linkify } from "@/components/hub/Linkify";
import { buttonOutline, buttonPrimary, fieldClass } from "@/components/hub/form";
import { saveResearch } from "./actions";

/** Research as tidy sections and source links; the raw text is only shown while editing. */
export function ResearchCard({ id, kind, research, researchedAt, editable }: { id: number; kind?: string | null; research: string; researchedAt: string | null; editable: boolean }) {
  const [editing, setEditing] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);
  const parsed = parseResearch(research);
  // A person and a company need different questions answered, so the blank page starts with the right headings.
  const template = researchTemplates[kind === "perorangan" ? "perorangan" : "usaha"];
  const useTemplate = () => {
    const el = box.current;
    if (!el) return;
    el.value = el.value.trim() ? `${el.value.trimEnd()}\n${template}` : template;
    el.focus();
  };

  if (editable && (editing || !research)) {
    return (
      <Card title="Hasil riset">
        <form action={saveResearch} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          <textarea ref={box} name="research" rows={12} defaultValue={research} className={`${fieldClass} font-mono text-xs`} placeholder={"Kosong. Tekan Pakai kerangka untuk judul bagiannya, jalankan /outreach di Claude Code untuk mengisi otomatis, atau tulis sendiri."} />
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className={buttonPrimary}>Simpan riset</button>
            <button type="button" onClick={useTemplate} className={buttonOutline}>
              <ListChecks className="size-4" />
              Pakai kerangka
            </button>
            {research && (
              <button type="button" onClick={() => setEditing(false)} className={buttonOutline}>Batal</button>
            )}
          </div>
        </form>
      </Card>
    );
  }

  return (
    <Card title="Hasil riset">
      {!research ? (
        <p className="text-sm text-muted">Belum ada riset.</p>
      ) : (
        <div className="space-y-4">
          {parsed.sections.map((s, i) => (
            <section key={`${s.title}-${i}`}>
              {s.title && <h3 className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted">{s.title}</h3>}
              <Linkify text={s.body} />
            </section>
          ))}
          {parsed.sources.length > 0 && (
            <section>
              <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">Sumber</h3>
              <ul className="flex flex-wrap gap-1.5">
                {parsed.sources.map((url) => (
                  <li key={url}>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 rounded-full border border-line bg-surface-soft px-2.5 py-1 text-xs font-medium text-ink hover:border-primary/40 hover:text-primary">
                      <ExternalLink className="size-3 shrink-0 text-muted" />
                      <span className="truncate">{shortUrl(url)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3">
            {editable && (
              <button type="button" onClick={() => setEditing(true)} className={buttonOutline}>
                <Pencil className="size-4" /> Ubah
              </button>
            )}
            {researchedAt && <span className="text-xs text-muted">Riset {researchedAt}</span>}
          </div>
        </div>
      )}
    </Card>
  );
}
