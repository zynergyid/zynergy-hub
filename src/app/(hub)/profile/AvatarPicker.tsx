"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { compressAvatar } from "@/lib/image";
import { Avatar } from "@/components/hub/Avatar";
import { ConfirmButton } from "@/components/hub/ConfirmButton";
import { ErrorText, buttonOutline } from "@/components/hub/form";
import { removeProfilePhoto, setProfilePhoto } from "./actions";

/** Big avatar with change and remove; the photo is cropped square and shrunk before upload. */
export function AvatarPicker({ name, photoUrl }: { name: string; photoUrl: string | null }) {
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
      const small = await compressAvatar(file);
      const fd = new FormData();
      fd.set("file", small);
      const r = await setProfilePhoto(fd);
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
    <div className="flex items-center gap-4">
      <Avatar name={name} src={photoUrl} className="size-20 text-xl" />
      <div className="space-y-2">
        <input ref={input} type="file" accept="image/*" onChange={pick} className="hidden" aria-label="Pilih foto profil" />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className={buttonOutline}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
            {busy ? "Mengunggah..." : photoUrl ? "Ganti foto" : "Tambah foto"}
          </button>
          {photoUrl && (
            <form action={removeProfilePhoto}>
              <ConfirmButton message="Hapus foto profil?" className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
                <Trash2 className="size-4" />
                Hapus
              </ConfirmButton>
            </form>
          )}
        </div>
        <ErrorText>{error}</ErrorText>
      </div>
    </div>
  );
}
