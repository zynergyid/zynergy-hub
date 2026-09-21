"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { compressImage } from "@/lib/image";
import { cn } from "@/lib/cn";
import { Card } from "@/components/hub/Card";
import { ConfirmButton } from "@/components/hub/ConfirmButton";
import { ErrorText, buttonOutline } from "@/components/hub/form";
import { removeEventPhoto, setEventPhoto } from "./actions";

/** One photo per event, shrunk in the browser to 1 MB before it is sent. */
export function PhotoCard({ eventId, photoUrl, editable, post }: { eventId: number; photoUrl: string | null; editable: boolean; post: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const small = await compressImage(file);
      const fd = new FormData();
      fd.set("eventId", String(eventId));
      fd.set("file", small);
      const r = await setEventPhoto(fd);
      if (r.status === "error") setError(r.message);
      else start(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses foto.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <Card title={post ? "Foto unggahan" : "Foto dokumentasi"}>
      {photoUrl ? (
        <a href={photoUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl} alt={post ? "Unggahan" : "Dokumentasi"} className="max-h-80 w-full object-cover" />
        </a>
      ) : (
        <p className="text-sm text-muted">{post ? "Belum ada tangkapan layar unggahan." : "Belum ada foto dokumentasi."}</p>
      )}
      {editable && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input ref={input} type="file" accept="image/*" onChange={pick} className="hidden" aria-label="Pilih foto" />
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className={cn(buttonOutline)}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
            {busy ? "Memperkecil dan mengunggah..." : photoUrl ? "Ganti foto" : "Tambah foto"}
          </button>
          {photoUrl && (
            <form action={removeEventPhoto}>
              <input type="hidden" name="eventId" value={eventId} />
              <ConfirmButton message="Hapus foto ini?" className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
                <Trash2 className="size-4" />
                Hapus
              </ConfirmButton>
            </form>
          )}
          <ErrorText>{error}</ErrorText>
        </div>
      )}
    </Card>
  );
}
