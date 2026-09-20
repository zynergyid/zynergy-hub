import { Check, X } from "lucide-react";
import type { HubEvent } from "@/payload-types";
import type { FollowUp } from "@/lib/calendar";
import { daysLabel, formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Card } from "@/components/hub/Card";
import { Input, Label, buttonOutline, fieldClass } from "@/components/hub/form";
import { Select } from "@/components/hub/Select";
import { deadlinePill, deadlineTone } from "@/components/hub/deadline";
import { addFollowUp, removeFollowUp, toggleFollowUp } from "./actions";

const relName = (v: number | { name: string } | null | undefined) => (typeof v === "object" && v ? v.name : null);

/** One follow-up line with its tick box; `returnTo` brings the person back where they ticked it. */
export function FollowUpRow({ eventId, rowId, text, ownerName, dueAt, doneAt, editable, returnTo, context }: { eventId: number; rowId: string; text: string; ownerName: string | null; dueAt: string | null; doneAt: string | null; editable: boolean; returnTo?: string; context?: string }) {
  const tone = dueAt && !doneAt ? deadlineTone(dueAt, 2) : "ok";
  return (
    <li className="flex items-start gap-3 py-2.5">
      <form action={toggleFollowUp} className="shrink-0 pt-0.5">
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="rowId" value={rowId} />
        {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
        <button type="submit" disabled={!editable} aria-label={doneAt ? "Tandai belum selesai" : "Tandai selesai"} className={cn("grid size-5 place-items-center rounded border", doneAt ? "border-secondary bg-secondary text-white" : "border-line bg-white hover:border-primary", !editable && "cursor-default opacity-70")}>
          {doneAt && <Check className="size-3.5" />}
        </button>
      </form>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm", doneAt ? "text-muted line-through" : "font-medium")}>{text}</p>
        <p className="text-xs text-muted">
          {[ownerName, context].filter(Boolean).join(" · ") || "belum ada penanggung jawab"}
          {doneAt ? ` · selesai ${formatDate(doneAt)}` : ""}
        </p>
      </div>
      {dueAt && !doneAt && <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold", deadlinePill[tone])}>{daysLabel(dueAt)}</span>}
      {editable && !returnTo && (
        <form action={removeFollowUp}>
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="rowId" value={rowId} />
          <button type="submit" aria-label="Hapus tindak lanjut" className="rounded p-1 text-muted hover:bg-red-50 hover:text-red-600">
            <X className="size-3.5" />
          </button>
        </form>
      )}
    </li>
  );
}

/** The meeting's follow-ups, plus what earlier team meetings left open. */
export function FollowUpsCard({ event, editable, users, previous }: { event: HubEvent; editable: boolean; users: { label: string; value: string }[]; previous: FollowUp[] }) {
  const rows = (event.followUps ?? []).filter((r) => r.id);
  const open = rows.filter((r) => !r.doneAt).length;
  return (
    <Card title="Tindak lanjut">
      {rows.length === 0 ? (
        <p className="text-sm text-muted">Belum ada tindak lanjut. Tulis siapa mengerjakan apa, sampai kapan.</p>
      ) : (
        <>
          <p className="mb-1 text-xs text-muted">{open ? `${open} belum selesai` : "Semua selesai"} dari {rows.length}.</p>
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <FollowUpRow key={r.id} eventId={event.id} rowId={r.id!} text={r.text} ownerName={relName(r.owner)} dueAt={r.dueAt ?? null} doneAt={r.doneAt ?? null} editable={editable} />
            ))}
          </ul>
        </>
      )}
      {editable && (
        <form action={addFollowUp} className="mt-4 space-y-3 border-t border-line pt-4">
          <input type="hidden" name="eventId" value={event.id} />
          <div>
            <Label htmlFor="fu-text">Tindak lanjut baru</Label>
            <Input id="fu-text" name="text" required placeholder="Contoh: kirim penawaran RULA ke klien" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label htmlFor="fu-owner">Siapa</Label>
              <Select id="fu-owner" name="owner" placeholder="Pilih anggota" options={users} />
            </div>
            <div>
              <Label htmlFor="fu-due">Tenggat</Label>
              <input id="fu-due" name="dueAt" type="date" className={cn(fieldClass, "px-2.5 py-2 text-sm")} />
            </div>
          </div>
          <button type="submit" className={buttonOutline}>Tambah</button>
        </form>
      )}
      {previous.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Belum selesai dari musyawarah sebelumnya</p>
          <ul className="divide-y divide-line">
            {previous.map((f) => (
              <FollowUpRow key={`${f.eventId}-${f.rowId}`} eventId={f.eventId} rowId={f.rowId} text={f.text} ownerName={f.ownerName} dueAt={f.dueAt} doneAt={f.doneAt} editable={editable} returnTo={`/calendar/${event.id}`} context={`${f.eventTitle}, ${formatDate(f.eventDate)}`} />
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
