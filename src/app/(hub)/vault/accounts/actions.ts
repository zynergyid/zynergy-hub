"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPayloadClient } from "@/lib/payload";
import { canEditVault, getSessionUser } from "@/lib/session";
import { pick, text } from "@/lib/form-data";
import { accountPlatforms, accountStatuses } from "@/lib/options";

export interface AccountFormState {
  status: "idle" | "success" | "error";
  message?: string;
  id?: number;
}
const err = (message: string): AccountFormState => ({ status: "error", message });
const idOrNull = (v: string) => (Number(v) > 0 ? Number(v) : null);

export async function saveAccount(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const user = await getSessionUser();
  if (!user) return err("Sesi habis, login lagi.");
  if (!canEditVault(user)) return err("Peran Anda tidak mengelola Brankas.");
  const id = idOrNull(text(formData, "id"));
  const name = text(formData, "name");
  const url = text(formData, "url");
  if (!name) return err("Nama akun wajib diisi.");
  if (url && !/^https?:\/\/\S+$/.test(url)) return err("Tautan harus diawali https://.");
  const data = {
    platform: pick(accountPlatforms, text(formData, "platform")) ?? "lainnya",
    status: pick(accountStatuses, text(formData, "status")) ?? "belum",
    name,
    url: url || null,
    holder: idOrNull(text(formData, "holder")),
    loginEmail: text(formData, "loginEmail") || null,
    phone: text(formData, "phone") || null,
    twoFactor: text(formData, "twoFactor") || null,
    passwordWhere: text(formData, "passwordWhere") || null,
    notes: text(formData, "notes") || null,
  };
  try {
    const payload = await getPayloadClient();
    const doc = id ? await payload.update({ collection: "accounts", id, data }) : await payload.create({ collection: "accounts", data });
    revalidatePath("/vault/accounts");
    return { status: "success", id: doc.id };
  } catch (error) {
    console.error("saveAccount failed:", error);
    return err("Gagal menyimpan. Coba lagi.");
  }
}

export async function deleteAccount(formData: FormData) {
  const user = await getSessionUser();
  if (!user || !canEditVault(user)) return;
  const id = Number(formData.get("id") || 0);
  if (!id) return;
  const payload = await getPayloadClient();
  await payload.delete({ collection: "accounts", id });
  revalidatePath("/vault/accounts");
  redirect("/vault/accounts");
}
