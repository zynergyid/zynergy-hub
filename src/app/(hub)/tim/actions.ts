"use server";

import { revalidatePath } from "next/cache";
import { getPayloadClient } from "@/lib/payload";
import { getSessionUser } from "@/lib/session";

export interface MemberFormState {
  status: "idle" | "success" | "error";
  message?: string;
}

import { jobTitles, roles as roleOptions, units, type Role, type Unit } from "@/lib/options";

const isRole = (v: string): v is Role => roleOptions.some((r) => r.value === v);
const pickUnits = (formData: FormData): Unit[] =>
  formData.getAll("units").map(String).filter((u): u is Unit => units.some((x) => x.value === u));
const pickTitle = (formData: FormData) => {
  const t = String(formData.get("title") ?? "");
  return (jobTitles as readonly string[]).includes(t) ? (t as (typeof jobTitles)[number]) : null;
};

export async function addMember(_prev: MemberFormState, formData: FormData): Promise<MemberFormState> {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return { status: "error", message: "Hanya admin." };
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "member");
  if (!name || !email) return { status: "error", message: "Nama dan email wajib diisi." };
  if (password.length < 8) return { status: "error", message: "Password sementara minimal 8 karakter." };
  if (!isRole(role)) return { status: "error", message: "Peran tidak valid." };
  const memberUnits = pickUnits(formData);
  if ((role === "finance" || role === "member") && memberUnits.length === 0) {
    return { status: "error", message: "Pilih minimal satu unit untuk finance atau anggota." };
  }
  try {
    const payload = await getPayloadClient();
    await payload.create({ collection: "users", data: { name, email, password, role, units: memberUnits, title: pickTitle(formData) } });
    revalidatePath("/tim");
    return { status: "success" };
  } catch (error) {
    console.error("addMember failed:", error);
    return { status: "error", message: "Gagal menambah. Email mungkin sudah dipakai." };
  }
}

export async function updateMember(formData: FormData) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return;
  const id = Number(formData.get("id") || 0);
  const role = String(formData.get("role") ?? "");
  if (!id || !isRole(role) || id === user.id) return;
  const payload = await getPayloadClient();
  await payload.update({ collection: "users", id, data: { role, units: pickUnits(formData), title: pickTitle(formData) } });
  revalidatePath("/tim");
}

export async function removeMember(formData: FormData) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return;
  const id = Number(formData.get("id") || 0);
  if (!id || id === user.id) return;
  const payload = await getPayloadClient();
  await payload.delete({ collection: "users", id });
  revalidatePath("/tim");
}

export async function resetPassword(formData: FormData) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return;
  const id = Number(formData.get("id") || 0);
  const password = String(formData.get("password") ?? "");
  if (!id || password.length < 8) return;
  const payload = await getPayloadClient();
  await payload.update({ collection: "users", id, data: { password } });
  revalidatePath("/tim");
}
