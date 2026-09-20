import { MAX_PHOTO_BYTES } from "@/lib/limits";

/**
 * Browser-only: shrink a photo to at most `maxSide` pixels and `maxBytes`,
 * as JPEG, honouring the camera orientation. Phone photos of 3 to 8 MB come
 * out around 200 to 500 KB with no visible loss on screen.
 */
export async function compressImage(file: File, opts: { maxSide?: number; maxBytes?: number } = {}): Promise<File> {
  const maxSide = opts.maxSide ?? 1600;
  const maxBytes = opts.maxBytes ?? MAX_PHOTO_BYTES;
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => null);
  if (!bitmap) throw new Error("Berkas bukan gambar yang bisa dibaca.");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Browser tidak mendukung pengecilan gambar.");
  let scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const name = `${file.name.replace(/\.[^.]+$/, "")}.jpg`;
  for (let attempt = 0; attempt < 5; attempt++) {
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.75, 0.65, 0.55]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && blob.size <= maxBytes) return new File([blob], name, { type: "image/jpeg" });
    }
    scale *= 0.75;
  }
  throw new Error("Foto tidak bisa diperkecil sampai 1 MB.");
}
