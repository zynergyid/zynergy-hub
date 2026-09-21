import type { Payload } from "payload";

export { MAX_UPLOAD_BYTES, MAX_UPLOAD_MESSAGE } from "@/lib/limits";

type UploadCollection = "receipts" | "documents" | "vault-files" | "event-photos" | "avatars";

/** Store a file in an upload collection (Vercel Blob in prod, local disk in dev). */
export async function uploadFile(payload: Payload, collection: UploadCollection, data: Record<string, unknown>, file: File) {
  return payload.create({
    collection,
    data,
    file: {
      data: Buffer.from(await file.arrayBuffer()),
      name: file.name,
      mimetype: file.type,
      size: file.size,
    },
  });
}
