"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import type { HubEvent } from "@/payload-types";
import { contentPlatforms, contentStatuses, eventKinds, type EventKind } from "@/lib/options";
import { toLocalInput } from "@/lib/calendar-dates";
import type { EventFormOptions } from "@/lib/calendar";
import { AutoTextarea } from "@/components/hub/AutoTextarea";
import { ConfirmButton } from "@/components/hub/ConfirmButton";
import { ErrorText, Input, Label, buttonOutline, buttonPrimary, fieldClass } from "@/components/hub/form";
import { MultiSelect } from "@/components/hub/MultiSelect";
import { Select } from "@/components/hub/Select";
import { deleteEvent, saveEvent, type EventFormState } from "./actions";
import { FollowUpRows } from "./FollowUpRows";
import { PhotoPicker } from "./PhotoPicker";

const initial: EventFormState = { status: "idle" };
const relId = (v: number | { id: number } | null | undefined) => (typeof v === "object" && v ? v.id : (v ?? null));

export interface EventDefaults {
  kind?: string;
  startAt?: string;
  participants?: number[];
  client?: number | null;
  project?: number | null;
  prospect?: number | null;
}

/** Create or edit an event. Notes and follow-ups live on the event page, not here. */
export function EventForm({ event, options, defaults = {}, onCancel, currentUserId }: { event?: HubEvent; options: EventFormOptions; defaults?: EventDefaults; onCancel?: () => void; currentUserId?: number }) {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [state, action, pending] = useActionState(async (prev: EventFormState, fd: FormData) => {
    if (!event && photo) fd.set("photo", photo);
    const r = await saveEvent(prev, fd);
    if (r.status === "success" && r.id) {
      if (onCancel) onCancel();
      router.push(`/calendar/${r.id}`);
      router.refresh();
    }
    return r;
  }, initial);
  const [kind, setKind] = useState<EventKind>(event?.kind ?? (eventKinds.find((k) => k.value === defaults.kind)?.value ?? "rapat-tim"));
  const post = kind === "konten";
  const participants = (event?.participants ?? defaults.participants ?? []).map((p) => String(relId(p)));
  const linked = (v: number | { id: number } | null | undefined, fallback?: number | null) => {
    const id = event ? relId(v) : fallback;
    return id ? String(id) : undefined;
  };

  return (
    <form action={action} className="space-y-4">
      {event && <input type="hidden" name="id" value={event.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="ev-title">{post ? "Judul unggahan" : "Judul"}</Label>
          <Input id="ev-title" name="title" required defaultValue={event?.title} placeholder={post ? "Contoh: Reel 3 tanda website UMKM perlu diperbarui" : kind === "fokus" ? "Contoh: Siapkan presentasi RULA" : "Contoh: Musyawarah tim mingguan, Meeting RULA discovery"} />
        </div>
        <div>
          <Label htmlFor="ev-kind">Jenis</Label>
          <Select id="ev-kind" name="kind" value={kind} onValueChange={(v) => setKind(v as EventKind)} options={eventKinds} />
        </div>
        {post ? (
          <>
            <div>
              <Label htmlFor="ev-platform">Platform</Label>
              <Select id="ev-platform" name="platform" defaultValue={event?.content?.platform ?? "instagram"} options={contentPlatforms} />
            </div>
            <div>
              <Label htmlFor="ev-status">Status</Label>
              <Select id="ev-status" name="status" defaultValue={event?.content?.status ?? "ide"} options={contentStatuses} />
            </div>
            <div>
              <Label htmlFor="ev-design">Tautan desain (Canva, Drive)</Label>
              <Input id="ev-design" name="designUrl" type="url" defaultValue={event?.content?.designUrl ?? ""} placeholder="https://" />
            </div>
            <div>
              <Label htmlFor="ev-post">Tautan unggahan (setelah tayang)</Label>
              <Input id="ev-post" name="postUrl" type="url" defaultValue={event?.content?.postUrl ?? ""} placeholder="https://" />
            </div>
          </>
        ) : (
          <div>
            <Label htmlFor="ev-location">Tempat atau tautan</Label>
            <Input id="ev-location" name="location" defaultValue={event?.location ?? ""} placeholder="Kantor, Google Meet, alamat klien" />
          </div>
        )}
        <div>
          <Label htmlFor="ev-start">{post ? "Tayang" : "Mulai"}</Label>
          <input id="ev-start" name="startAt" type="datetime-local" required defaultValue={toLocalInput(event?.startAt) || defaults.startAt || ""} className={fieldClass} />
        </div>
        {!post && (
          <div>
            <Label htmlFor="ev-end">Selesai</Label>
            <input id="ev-end" name="endAt" type="datetime-local" defaultValue={toLocalInput(event?.endAt)} className={fieldClass} />
          </div>
        )}
        <div className="sm:col-span-2">
          <Label htmlFor="ev-participants">{post ? "Penanggung jawab" : "Peserta"}</Label>
          <MultiSelect name="participants" options={options.users} defaultValue={participants} placeholder="Pilih anggota tim" />
        </div>
        <div>
          <Label htmlFor="ev-client">Klien</Label>
          <Select id="ev-client" name="client" defaultValue={linked(event?.client, defaults.client)} placeholder="Tidak terkait klien" options={[{ label: "Tidak terkait klien", value: "0" }, ...options.clients]} />
        </div>
        <div>
          <Label htmlFor="ev-project">Proyek</Label>
          <Select id="ev-project" name="project" defaultValue={linked(event?.project, defaults.project)} placeholder="Tidak terkait proyek" options={[{ label: "Tidak terkait proyek", value: "0" }, ...options.projects]} />
        </div>
        <div>
          <Label htmlFor="ev-prospect">Target outreach</Label>
          <Select id="ev-prospect" name="prospect" defaultValue={linked(event?.prospect, defaults.prospect)} placeholder="Tidak terkait target" options={[{ label: "Tidak terkait target", value: "0" }, ...options.prospects]} />
        </div>
        {!event && (
          <>
            <div className="sm:col-span-2">
              <Label htmlFor="ev-agenda">{post ? "Ide atau brief singkat" : "Agenda pembahasan"}</Label>
              <AutoTextarea id="ev-agenda" name="agenda" rows={3} className={fieldClass} placeholder={post ? "Pesan utama, format (reel, carousel, foto), referensi." : "Satu topik per baris. Bisa diisi nanti."} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="ev-notes">{post ? "Caption" : "Catatan"}</Label>
              <AutoTextarea id="ev-notes" name="notes" rows={4} className={fieldClass} placeholder={post ? "Caption dan hashtag. Bisa diisi nanti." : "Apa yang dibahas dan disepakati. Bisa diisi nanti."} />
            </div>
            {!post && (
              <div className="sm:col-span-2">
                <FollowUpRows users={options.users} defaultOwner={currentUserId ? String(currentUserId) : ""} />
              </div>
            )}
            <div className="sm:col-span-2">
              <PhotoPicker onChange={setPhoto} post={post} />
            </div>
          </>
        )}
      </div>
      <p className="text-xs text-muted">{post ? "Ganti status di sini saat draf siap atau sudah tayang." : event ? "Catatan dan tindak lanjut diubah di kartu masing-masing di halaman acara." : "Semua bisa ditambah atau diubah lagi di halaman acara. Acara yang ditautkan ke proyek mengirim catatannya ke log proyek."}</p>
      <ErrorText>{state.status === "error" ? state.message : null}</ErrorText>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={pending} className={buttonPrimary}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {event ? "Simpan perubahan" : "Simpan acara"}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className={buttonOutline}>Batal</button>
          )}
        </div>
        {event && (
          <ConfirmButton message={`Hapus acara ${event.title}? Catatan dan tindak lanjutnya ikut terhapus.`} formAction={deleteEvent} formNoValidate className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
            <Trash2 className="size-4" />
            Hapus
          </ConfirmButton>
        )}
      </div>
    </form>
  );
}
