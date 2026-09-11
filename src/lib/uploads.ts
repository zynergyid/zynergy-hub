import type { Payload } from "payload";
import type { Unit } from "@/lib/options";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/** Store a file in an upload collection (Vercel Blob in prod, local disk in dev). */
export async function uploadFile(payload: Payload, collection: "receipts" | "documents", unit: Unit, file: File) {
  return payload.create({
    collection,
    data: { unit },
    file: {
      data: Buffer.from(await file.arrayBuffer()),
      name: file.name,
      mimetype: file.type,
      size: file.size,
    },
  });
}
