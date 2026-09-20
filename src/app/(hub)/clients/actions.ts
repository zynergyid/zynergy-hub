"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPayloadClient } from "@/lib/payload";
import { canEditClients, getSessionUser } from "@/lib/session";
import { businessTypes, clientKinds, clientStatuses, packages, units } from "@/lib/options";
import { canWriteUnit } from "@/lib/access";
import { dateOrNull, digits, pick, text } from "@/lib/form-data";

export interface ClientFormState {
  status: "idle" | "success" | "error";
  message?: string;
  id?: number;
}

const err = (message: string): ClientFormState => ({ status: "error", message });

export async function saveClient(_prev: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const user = await getSessionUser();
  if (!user) return err("Sesi habis, login lagi.");
  if (!canEditClients(user)) return err("Peran Anda hanya bisa melihat.");

  const id = Number(formData.get("id") || 0) || null;
  const unit = pick(units, text(formData, "unit")) ?? "digital";
  const isSupply = unit === "supply";
  const kind = pick(clientKinds, text(formData, "kind")) ?? "usaha";
  // One person is the client: no separate PIC, no business sector, no legal entity data.
  const person = kind === "perorangan";
  const name = text(formData, "name");
  const whatsapp = text(formData, "whatsapp").replace(/[^\d+]/g, "");
  if (!name) return err("Nama wajib diisi.");
  // Supply buyers are companies reached by email; everyone else needs a WhatsApp number.
  if (!isSupply && whatsapp.length < 8) return err("Nomor WhatsApp wajib diisi.");
  if (whatsapp && whatsapp.length < 8) return err("Nomor WhatsApp tidak valid.");
  const email = text(formData, "email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err("Format email tidak valid.");
  const fee = Number(digits(text(formData, "annualFee")));
  const terms = text(formData, "paymentTermsDays");

  const data = {
    unit,
    kind,
    name,
    owner: person ? null : text(formData, "owner") || null,
    whatsapp: whatsapp || null,
    email: email || null,
    city: text(formData, "city") || null,
    businessType: person ? null : (pick(businessTypes, text(formData, "businessType")) ?? null),
    package: isSupply ? null : (pick(packages, text(formData, "package")) ?? null),
    annualFee: isSupply ? null : fee || null,
    startDate: isSupply ? null : dateOrNull(text(formData, "startDate")),
    renewalDate: isSupply ? null : dateOrNull(text(formData, "renewalDate")),
    status: pick(clientStatuses, text(formData, "status")) ?? "aktif",
    links: {
      website: text(formData, "website") || null,
      googleProfile: isSupply ? null : text(formData, "googleProfile") || null,
      instagram: isSupply ? null : text(formData, "instagram") || null,
    },
    supply: {
      legalName: isSupply && !person ? text(formData, "legalName") || null : null,
      npwp: isSupply ? text(formData, "npwp") || null : null,
      vendorNumber: isSupply && !person ? text(formData, "vendorNumber") || null : null,
      paymentTermsDays: isSupply && !person && terms !== "" ? Math.max(0, Number(terms) || 0) : null,
      billingAddress: isSupply ? text(formData, "billingAddress") || null : null,
    },
    notes: text(formData, "notes") || null,
  };

  if (!canWriteUnit(user, data.unit, "editClients")) return err("Anda tidak punya akses ke unit ini.");

  try {
    const payload = await getPayloadClient();
    if (id) {
      const existing = await payload.findByID({ collection: "clients", id, disableErrors: true });
      if (!existing || !canWriteUnit(user, existing.unit, "editClients")) {
        return err("Klien tidak ditemukan atau di luar unit Anda.");
      }
    }
    const doc = id
      ? await payload.update({ collection: "clients", id, data })
      : await payload.create({ collection: "clients", data });
    revalidatePath("/clients");
    revalidatePath("/");
    return { status: "success", id: doc.id };
  } catch (error) {
    console.error("saveClient failed:", error);
    return err("Gagal menyimpan. Coba lagi.");
  }
}

export async function deleteClient(formData: FormData) {
  const user = await getSessionUser();
  if (!user || !user.isAdmin) return;
  const id = Number(formData.get("id") || 0);
  if (!id) return;
  const payload = await getPayloadClient();
  // A client with POs stays: the POs reference it by name and number.
  const linked = await payload.count({ collection: "orders", where: { client: { equals: id } } });
  if (linked.totalDocs > 0) redirect(`/clients/${id}?blocked=${linked.totalDocs}`);
  await payload.delete({ collection: "clients", id });
  revalidatePath("/clients");
  revalidatePath("/");
  redirect("/clients");
}
