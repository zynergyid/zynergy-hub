"use client";

import { createContext, useActionState, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { contentPlatforms, contentStatuses, eventKinds, type EventKind } from "@/lib/options";
import { formatDayLong, todayWib } from "@/lib/calendar-dates";
import type { EventFormOptions } from "@/lib/calendar";
import { AutoTextarea } from "@/components/hub/AutoTextarea";
import { ErrorText, Label, buttonOutline, buttonPrimary, fieldClass } from "@/components/hub/form";
import { FollowUpRows } from "./FollowUpRows";
import { PhotoPicker } from "./PhotoPicker";
import { MultiSelect } from "@/components/hub/MultiSelect";
import { Select } from "@/components/hub/Select";
import { saveEvent, type EventFormState } from "./actions";

/**
 * Google-Calendar-style quick add: any day cell, the list's "Tambah", or the
 * header button opens one small dialog on the same page. Saving refreshes
 * the grid in place; "Pilihan lengkap" goes to the full form.
 */
const Ctx = createContext<{ open: (date?: string) => void; enabled: boolean }>({ open: () => undefined, enabled: false });
export const useQuickAdd = () => useContext(Ctx);

const initial: EventFormState = { status: "idle" };
const kindLabel: Record<EventKind, string> = { "rapat-tim": "Musyawarah tim", "meeting-klien": "Meeting klien", mentoring: "Mentoring", konten: "Konten", fokus: "Fokus", lainnya: "Lain" };

function QuickAddDialog({ date, options, currentUserId, onClose }: { date: string; options: EventFormOptions; currentUserId: number; onClose: () => void }) {
  const router = useRouter();
  const [kind, setKind] = useState<EventKind>("rapat-tim");
  const post = kind === "konten";
  const [photo, setPhoto] = useState<File | null>(null);
  const [state, action, pending] = useActionState(async (prev: EventFormState, fd: FormData) => {
    if (photo) fd.set("photo", photo);
    const r = await saveEvent(prev, fd);
    if (r.status === "success") {
      onClose();
      router.refresh();
    }
    return r;
  }, initial);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const fullHref = `/calendar/new?tanggal=${date}&jenis=${kind}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 sm:items-center" role="dialog" aria-modal="true" aria-label="Acara baru">
      <button type="button" className="absolute inset-0" aria-label="Tutup" onClick={onClose} />
      <form action={action} className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:max-w-lg sm:rounded-2xl sm:pb-5">
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="date" value={date} />
        <div className="flex items-start justify-between gap-3">
          <input name="title" required autoFocus placeholder={post ? "Judul unggahan" : kind === "fokus" ? "Apa yang dikerjakan, misalnya Siapkan presentasi RULA" : "Tambah judul"} className="w-full border-0 border-b border-line bg-transparent px-0 py-1.5 text-lg font-semibold placeholder:font-normal placeholder:text-muted focus:border-primary focus:outline-none" />
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-surface-soft" aria-label="Tutup">
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {eventKinds.map((k) => (
            <button key={k.value} type="button" onClick={() => setKind(k.value)} className={cn("rounded-full px-3 py-1 text-xs font-semibold", kind === k.value ? "bg-primary-soft text-primary-dark" : "text-muted hover:bg-surface-soft")}>
              {kindLabel[k.value]}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm font-medium">{formatDayLong(date)}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {post ? (
            <>
              <div>
                <Label htmlFor="qa-platform">Platform</Label>
                <Select id="qa-platform" name="platform" defaultValue="instagram" options={contentPlatforms} />
              </div>
              <div>
                <Label htmlFor="qa-status">Status</Label>
                <Select id="qa-status" name="status" defaultValue="ide" options={contentStatuses} />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="qa-start">Mulai</Label>
                <input id="qa-start" name="startTime" type="time" defaultValue="10:00" className={fieldClass} />
              </div>
              <div>
                <Label htmlFor="qa-end">Selesai</Label>
                <input id="qa-end" name="endTime" type="time" className={fieldClass} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="qa-location">Tempat atau tautan</Label>
                <input id="qa-location" name="location" className={fieldClass} placeholder="Kantor, Google Meet, alamat klien" />
              </div>
            </>
          )}
          <div className="sm:col-span-2">
            <Label htmlFor="qa-participants">{post ? "Penanggung jawab" : "Peserta"}</Label>
            <MultiSelect name="participants" options={options.users} defaultValue={[String(currentUserId)]} placeholder="Pilih anggota tim" />
          </div>
          {kind === "meeting-klien" && (
            <>
              <div>
                <Label htmlFor="qa-client">Klien</Label>
                <Select id="qa-client" name="client" placeholder="Pilih klien" options={options.clients} />
              </div>
              <div>
                <Label htmlFor="qa-project">Proyek</Label>
                <Select id="qa-project" name="project" placeholder="Pilih proyek" options={options.projects} />
              </div>
            </>
          )}
          <div className="sm:col-span-2">
            <Label htmlFor="qa-notes">{post ? "Caption" : "Catatan"}</Label>
            <AutoTextarea id="qa-notes" name="notes" rows={3} className={fieldClass} placeholder={post ? "Caption dan hashtag. Bisa diisi nanti." : "Apa yang dibahas dan disepakati. Bisa diisi nanti."} />
          </div>
          {!post && (
            <div className="sm:col-span-2">
              <FollowUpRows users={options.users} defaultOwner={String(currentUserId)} />
            </div>
          )}
          <div className="sm:col-span-2">
            <PhotoPicker onChange={setPhoto} post={post} />
          </div>
        </div>
        <ErrorText>{state.status === "error" ? state.message : null}</ErrorText>
        <div className="mt-4 flex items-center justify-between gap-3">
          <Link href={fullHref} className="text-sm font-semibold text-primary hover:underline">Pilihan lengkap</Link>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={buttonOutline}>Batal</button>
            <button type="submit" disabled={pending} className={buttonPrimary}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Simpan
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export function QuickAddProvider({ options, currentUserId, enabled, children }: { options: EventFormOptions | null; currentUserId: number; enabled: boolean; children: React.ReactNode }) {
  const [date, setDate] = useState<string | null>(null);
  const open = (d?: string) => setDate(d ?? todayWib());
  const close = () => setDate(null);
  return (
    <Ctx.Provider value={{ open, enabled: enabled && Boolean(options) }}>
      {children}
      {date && enabled && options && <QuickAddDialog key={date} date={date} options={options} currentUserId={currentUserId} onClose={close} />}
    </Ctx.Provider>
  );
}

/** A button or text link that opens the dialog for one day. */
export function QuickAddTrigger({ date, className, children }: { date?: string; className?: string; children: React.ReactNode }) {
  const { open, enabled } = useQuickAdd();
  if (!enabled) return null;
  return (
    <button type="button" onClick={() => open(date)} className={className}>
      {children}
    </button>
  );
}
