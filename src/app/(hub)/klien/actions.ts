"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPayloadClient } from "@/lib/payload";
import { getSessionUser } from "@/lib/session";
import { businessTypes, clientStatuses, packages, units } from "@/lib/options";
import { canWriteUnit } from "@/lib/access";

export interface ClientFormState {
  status: "idle" | "success" | "error";
  message?: string;
  id?: number;
}

const pick = <T extends readonly { value: string }[]>(opts: T, v: string) =>
  opts.some((o) => o.value === v) ? (v as T[number]["value"]) : undefined;
const text = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const dateOrNull = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T12:00:00`).toISOString() : null);

export async function saveClient(_prev: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const user = await getSessionUser();
  if (!user) return { status: "error", message: "Sesi habis, login lagi." };
  if (user.role === "viewer") return { status: "error", message: "Pengawas hanya bisa melihat." };

  const id = Number(formData.get("id") || 0) || null;
  const name = text(formData, "name");
  const whatsapp = text(formData, "whatsapp").replace(/[^\d+]/g, "");
  if (!name) return { status: "error", message: "Nama usaha wajib diisi." };
  if (whatsapp.length < 8) return { status: "error", message: "Nomor WhatsApp wajib diisi." };
  const email = text(formData, "email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { status: "error", message: "Format email tidak valid." };
  const fee = Number(text(formData, "annualFee").replace(/\D/g, ""));

  const data = {
    unit: pick(units, text(formData, "unit")) ?? "digital",
    name,
    owner: text(formData, "owner") || null,
    whatsapp,
    email: email || null,
    city: text(formData, "city") || null,
    businessType: pick(businessTypes, text(formData, "businessType")) ?? null,
    package: pick(packages, text(formData, "package")) ?? null,
    annualFee: fee || null,
    startDate: dateOrNull(text(formData, "startDate")),
    renewalDate: dateOrNull(text(formData, "renewalDate")),
    status: pick(clientStatuses, text(formData, "status")) ?? "aktif",
    links: {
      website: text(formData, "website") || null,
      googleProfile: text(formData, "googleProfile") || null,
      instagram: text(formData, "instagram") || null,
    },
    notes: text(formData, "notes") || null,
  };

  if (!canWriteUnit(user, data.unit, false)) return { status: "error", message: "Anda tidak punya akses ke unit ini." };

  try {
    const payload = await getPayloadClient();
    if (id) {
      const existing = await payload.findByID({ collection: "clients", id, disableErrors: true });
      if (!existing || !canWriteUnit(user, existing.unit, false)) {
        return { status: "error", message: "Klien tidak ditemukan atau di luar unit Anda." };
      }
    }
    const doc = id
      ? await payload.update({ collection: "clients", id, data })
      : await payload.create({ collection: "clients", data });
    revalidatePath("/klien");
    revalidatePath("/");
    return { status: "success", id: doc.id };
  } catch (error) {
    console.error("saveClient failed:", error);
    return { status: "error", message: "Gagal menyimpan. Coba lagi." };
  }
}

export async function deleteClient(formData: FormData) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return;
  const id = Number(formData.get("id") || 0);
  if (!id) return;
  const payload = await getPayloadClient();
  await payload.delete({ collection: "clients", id });
  revalidatePath("/klien");
  revalidatePath("/");
  redirect("/klien");
}
