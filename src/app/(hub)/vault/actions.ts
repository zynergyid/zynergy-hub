"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPayloadClient } from "@/lib/payload";
import { canEditMoney, getSessionUser } from "@/lib/session";
import { dateOrNull, pick, text } from "@/lib/form-data";
import { MAX_UPLOAD_BYTES, uploadFile } from "@/lib/uploads";
import { vaultCategories } from "@/lib/options";

export interface VaultFormState {
  status: "idle" | "success" | "error";
  message?: string;
  id?: number;
}

const err = (message: string): VaultFormState => ({ status: "error", message });

function revalidateVault(id?: number) {
  revalidatePath("/vault");
  revalidatePath("/");
  if (id) revalidatePath(`/vault/${id}`);
}

export async function saveVaultDocument(_prev: VaultFormState, formData: FormData): Promise<VaultFormState> {
  const user = await getSessionUser();
  if (!user) return err("Sesi habis, login lagi.");
  if (!canEditMoney(user)) return err("Hanya admin, finance, dan staf yang bisa mengelola brankas.");
  const id = Number(formData.get("id") || 0) || null;
  const title = text(formData, "title");
  if (!title) return err("Nama dokumen wajib diisi.");
  const category = pick(vaultCategories, text(formData, "category")) ?? "lainnya";
  const confidential = formData.get("confidential") === "on";
  const file = formData.get("file");
  const hasFile = file instanceof File && file.size > 0;
  if (!id && !hasFile) return err("Pilih berkas dokumennya.");
  if (hasFile && file.size > MAX_UPLOAD_BYTES) return err("Berkas maksimal 8MB.");

  try {
    const payload = await getPayloadClient();
    const existing = id ? await payload.findByID({ collection: "vault-documents", id, depth: 0, disableErrors: true }) : null;
    if (id && !existing) return err("Dokumen tidak ditemukan.");
    let fileId = existing && typeof existing.file === "number" ? existing.file : existing && typeof existing.file === "object" ? existing.file.id : undefined;
    if (hasFile) {
      const uploaded = await uploadFile(payload, "vault-files", { confidential }, file);
      if (fileId) await payload.delete({ collection: "vault-files", id: fileId }).catch(() => undefined);
      fileId = uploaded.id;
    } else if (fileId) {
      // Keep the file's confidentiality in step with the document.
      await payload.update({ collection: "vault-files", id: fileId, data: { confidential } });
    }
    const data = {
      title,
      category,
      number: text(formData, "number") || null,
      issuer: text(formData, "issuer") || null,
      issuedAt: dateOrNull(text(formData, "issuedAt")),
      expiresAt: dateOrNull(text(formData, "expiresAt")),
      confidential,
      notes: text(formData, "notes") || null,
      file: fileId as number,
    };
    const doc = id
      ? await payload.update({ collection: "vault-documents", id, data })
      : await payload.create({ collection: "vault-documents", data });
    revalidateVault(doc.id);
    return { status: "success", id: doc.id };
  } catch (error) {
    console.error("saveVaultDocument failed:", error);
    return err("Gagal menyimpan. Pastikan berkas PDF atau gambar yang utuh.");
  }
}

export async function deleteVaultDocument(formData: FormData) {
  const user = await getSessionUser();
  if (!user || !canEditMoney(user)) return;
  const id = Number(formData.get("id") || 0);
  if (!id) return;
  const payload = await getPayloadClient();
  const existing = await payload.findByID({ collection: "vault-documents", id, depth: 0, disableErrors: true });
  if (!existing) return;
  // The collection's afterDelete hook removes the file.
  await payload.delete({ collection: "vault-documents", id });
  revalidateVault();
  redirect("/vault");
}
