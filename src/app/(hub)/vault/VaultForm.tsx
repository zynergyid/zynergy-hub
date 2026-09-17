"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import type { VaultDocument } from "@/payload-types";
import { vaultCategories } from "@/lib/options";
import { makeThumbnail } from "@/lib/thumbnail";
import { ErrorText, Label, buttonPrimary, fieldClass } from "@/components/hub/form";
import { FileInput } from "@/components/hub/FileInput";
import { ConfirmButton } from "@/components/hub/ConfirmButton";
import { Select } from "@/components/hub/Select";
import { deleteVaultDocument, saveVaultDocument, type VaultFormState } from "./actions";

const initial: VaultFormState = { status: "idle" };
const day = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");

export function VaultForm({ doc, currentFile, readOnly = false }: { doc?: VaultDocument; currentFile?: { url: string; filename: string } | null; readOnly?: boolean }) {
  const router = useRouter();
  // Preview of the picked file, rendered in the browser and sent along with the form.
  const [thumb, setThumb] = useState<Blob | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const showThumb = (blob: Blob | null) => {
    setThumbUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return blob ? URL.createObjectURL(blob) : null;
    });
    setThumb(blob);
  };
  // Release the last object URL when the form goes away.
  useEffect(() => () => showThumb(null), []);
  const onFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    showThumb(null);
    if (!file || !e.target.checkValidity()) return;
    setRendering(true);
    showThumb(await makeThumbnail(file));
    setRendering(false);
  };
  const [state, formAction, pending] = useActionState(
    async (prev: VaultFormState, fd: FormData) => {
      if (thumb) fd.set("thumbnail", thumb, "pratinjau.png");
      const r = await saveVaultDocument(prev, fd);
      if (r.status === "success" && r.id) {
        router.push(`/vault/${r.id}`);
        router.refresh();
      }
      return r;
    },
    initial,
  );

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,27,51,0.04)] sm:p-6">
      {doc && <input type="hidden" name="id" value={doc.id} />}
      <fieldset disabled={readOnly} className="space-y-5 disabled:opacity-90">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="vf-title">Nama dokumen</Label>
            <input id="vf-title" name="title" required defaultValue={doc?.title} className={fieldClass} placeholder="Contoh: NIB PT Sinergi Mitra Abadi Jaya" />
          </div>
          <div>
            <Label htmlFor="vf-category">Kategori</Label>
            <Select id="vf-category" name="category" defaultValue={doc?.category ?? "lainnya"} options={vaultCategories} />
          </div>
          <div>
            <Label htmlFor="vf-number">Nomor dokumen</Label>
            <input id="vf-number" name="number" defaultValue={doc?.number ?? ""} className={fieldClass} />
          </div>
          <div>
            <Label htmlFor="vf-issuer">Penerbit</Label>
            <input id="vf-issuer" name="issuer" defaultValue={doc?.issuer ?? ""} className={fieldClass} placeholder="Contoh: Kemenkumham, OSS, KPP Pratama" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="vf-issued">Tanggal terbit</Label>
              <input id="vf-issued" name="issuedAt" type="date" defaultValue={day(doc?.issuedAt)} className={fieldClass} />
            </div>
            <div>
              <Label htmlFor="vf-expires">Berlaku sampai</Label>
              <input id="vf-expires" name="expiresAt" type="date" defaultValue={day(doc?.expiresAt)} className={fieldClass} />
            </div>
          </div>
          <div>
            <Label htmlFor="vf-file">{doc ? "Ganti berkas" : "Berkas (PDF atau gambar)"}</Label>
            <FileInput id="vf-file" name="file" accept="application/pdf,image/*" required={!doc} onChange={onFilePicked} />
            {(rendering || thumbUrl) && (
              <div className="mt-2 flex items-center gap-3">
                <div className="grid h-20 w-14 place-items-center overflow-hidden rounded-lg border border-line bg-surface-soft">
                  {thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumbUrl} alt="Pratinjau halaman pertama" className="size-full object-cover object-top" />
                  ) : (
                    <Loader2 className="size-4 animate-spin text-muted" />
                  )}
                </div>
                <p className="text-xs text-muted">{rendering ? "Membuat pratinjau..." : "Pratinjau halaman pertama ikut disimpan."}</p>
              </div>
            )}
            {currentFile && (
              <p className="mt-1 text-xs text-muted">
                Berkas saat ini:{" "}
                <a href={currentFile.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">{currentFile.filename}</a>
              </p>
            )}
          </div>
          <label htmlFor="vf-confidential" className="flex cursor-pointer items-start gap-2.5 self-end pb-2 text-sm">
            <input id="vf-confidential" name="confidential" type="checkbox" defaultChecked={doc?.confidential ?? false} className="mt-0.5 size-4 shrink-0 rounded border-line accent-primary" />
            <span>
              <span className="font-semibold">Rahasia</span>
              <span className="block text-xs text-muted">Hanya admin, finance, dan staf. Untuk KTP pengurus, akta, rekening.</span>
            </span>
          </label>
          <div className="sm:col-span-2">
            <Label htmlFor="vf-notes">Catatan</Label>
            <textarea id="vf-notes" name="notes" rows={2} defaultValue={doc?.notes ?? ""} className={fieldClass} placeholder="Misal: versi terbaru setelah perubahan direksi 2026" />
          </div>
        </div>
      </fieldset>

      <ErrorText>{state.status === "error" ? state.message : null}</ErrorText>

      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <button type="submit" disabled={pending} className={buttonPrimary}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {doc ? "Simpan perubahan" : "Simpan dokumen"}
          </button>
          {doc && (
            <ConfirmButton message={`Hapus ${doc.title} beserta berkasnya?`} formAction={deleteVaultDocument} formNoValidate className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
              <Trash2 className="size-4" />
              Hapus
            </ConfirmButton>
          )}
        </div>
      )}
    </form>
  );
}
