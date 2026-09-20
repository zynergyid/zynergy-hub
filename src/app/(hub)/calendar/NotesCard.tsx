"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { HubEvent } from "@/payload-types";
import { Card } from "@/components/hub/Card";
import { AutoTextarea } from "@/components/hub/AutoTextarea";
import { MarkdownLite } from "@/components/hub/MarkdownLite";
import { Label, buttonOutline, buttonPrimary, fieldClass } from "@/components/hub/form";
import { saveNotes } from "./actions";

/** Agenda before the meeting, notes after it. Read view by default; the form opens on demand or while empty. */
export function NotesCard({ event, editable, hasProject }: { event: HubEvent; editable: boolean; hasProject: boolean }) {
  const post = event.kind === "konten";
  const agenda = event.agenda ?? "";
  const notes = event.notes ?? "";
  const [editing, setEditing] = useState(editable && !notes);
  return (
    <Card title={post ? "Brief dan caption" : "Agenda dan catatan"}>
      {editing ? (
        <form action={saveNotes} className="space-y-3">
          <input type="hidden" name="eventId" value={event.id} />
          <div>
            <Label htmlFor="nt-agenda">{post ? "Ide atau brief singkat" : "Agenda pembahasan"}</Label>
            <AutoTextarea id="nt-agenda" name="agenda" rows={3} defaultValue={agenda} className={fieldClass} placeholder={post ? "Pesan utama, format, referensi." : "Satu topik per baris."} />
          </div>
          <div>
            <Label htmlFor="nt-notes">{post ? "Caption dan catatan revisi" : "Catatan"}</Label>
            <AutoTextarea id="nt-notes" name="notes" rows={6} defaultValue={notes} className={fieldClass} placeholder={post ? "Caption final, hashtag, catatan revisi dari tim." : "Apa yang dibahas dan disepakati. Tindak lanjut ditulis di kartu sebelah, bukan di sini."} />
          </div>
          <p className="text-xs text-muted">
            Daftar dengan {"\"- \""} atau {"\"1. \""} dan **tebal** ditampilkan rapi.
            {hasProject ? " Catatan ikut masuk log proyek sebagai Pertemuan, jadi /brief membacanya." : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={buttonPrimary}>Simpan</button>
            {notes && <button type="button" onClick={() => setEditing(false)} className={buttonOutline}>Batal</button>}
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {agenda ? (
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted">{post ? "Brief" : "Agenda"}</p>
              <MarkdownLite text={agenda} />
            </div>
          ) : null}
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted">{post ? "Caption" : "Catatan"}</p>
            {notes ? <MarkdownLite text={notes} /> : <p className="text-sm text-muted">{post ? "Belum ada caption." : "Belum ada catatan."}</p>}
          </div>
          {editable && (
            <button type="button" onClick={() => setEditing(true)} className={buttonOutline}>
              <Pencil className="size-4" />
              {notes ? (post ? "Ubah caption" : "Ubah catatan") : post ? "Tulis caption" : "Tulis catatan"}
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
