"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { compressImage } from "@/lib/image";
import { cn } from "@/lib/cn";
import { Label, buttonOutline } from "@/components/hub/form";

/**
 * Picks one photo while creating an event: shrinks it in the browser at once
 * and hands the small file up, so the form can append it on submit.
 */
export function PhotoPicker({ onChange, post }: { onChange: (file: File | null) => void; post: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const small = await compressImage(file);
      onChange(small);
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(small);
      });
      setName(`${Math.round(small.size / 1024)} KB`);
    } catch (err) {
      onChange(null);
      setError(err instanceof Error ? err.message : "Gagal memproses foto.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  function clear() {
    onChange(null);
    setPreview(null);
    setName(null);
  }

  return (
    <div>
      <Label htmlFor="pp-file">{post ? "Foto unggahan" : "Foto dokumentasi"}</Label>
      <input ref={input} id="pp-file" type="file" accept="image/*" capture="environment" onChange={pick} className="hidden" />
      <div className="flex items-center gap-3">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="size-14 shrink-0 rounded-lg border border-line object-cover" />
        )}
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className={cn(buttonOutline, "text-xs")}>
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
          {busy ? "Memperkecil..." : preview ? "Ganti foto" : "Tambah foto"}
        </button>
        {preview && (
          <button type="button" onClick={clear} aria-label="Batalkan foto" className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600">
            <X className="size-4" />
          </button>
        )}
        <span className="text-xs text-muted">{error ?? name ?? "Satu foto, maksimal 1 MB, diperkecil otomatis."}</span>
      </div>
    </div>
  );
}
