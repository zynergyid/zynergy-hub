"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPayloadClient } from "@/lib/payload";
import { getSessionUser } from "@/lib/session";
import { jobTitles, roles as roleOptions, units, type Role, type Unit } from "@/lib/options";

export interface MemberFormState {
  status: "idle" | "success" | "error";
  message?: string;
  id?: number;
}

const isRole = (v: string): v is Role => roleOptions.some((r) => r.value === v);
const pickUnits = (formData: FormData): Unit[] =>
  formData.getAll("units").map(String).filter((u): u is Unit => units.some((x) => x.value === u));
const pickTitle = (formData: FormData) => {
  const t = String(formData.get("title") ?? "");
  return (jobTitles as readonly string[]).includes(t) ? (t as (typeof jobTitles)[number]) : null;
};
const text = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/** Create or update a member. Admin only. Admins cannot change their own role or units here. */
export async function saveMember(_prev: MemberFormState, formData: FormData): Promise<MemberFormState> {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return { status: "error", message: "Hanya admin." };

  const id = Number(formData.get("id") || 0) || null;
  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const role = text(formData, "role");
  const memberUnits = pickUnits(formData);
  if (!name || !validEmail(email)) return { status: "error", message: "Nama dan email yang valid wajib diisi." };
  if (!isRole(role)) return { status: "error", message: "Peran tidak valid." };
  if (role !== "admin" && role !== "viewer" && memberUnits.length === 0) {
    return { status: "error", message: "Pilih minimal satu unit untuk finance, staf, atau anggota." };
  }

  try {
    const payload = await getPayloadClient();
    if (id) {
      const self = id === user.id;
      await payload.update({
        collection: "users",
        id,
        data: self ? { name, email, title: pickTitle(formData) } : { name, email, role, units: memberUnits, title: pickTitle(formData) },
      });
      revalidatePath("/team");
      return { status: "success", id };
    }
    const password = String(formData.get("password") ?? "");
    if (password.length < 8) return { status: "error", message: "Password sementara minimal 8 karakter." };
    const doc = await payload.create({
      collection: "users",
      data: { name, email, password, role, units: memberUnits, title: pickTitle(formData) },
    });
    revalidatePath("/team");
    return { status: "success", id: doc.id };
  } catch (error) {
    console.error("saveMember failed:", error);
    return { status: "error", message: "Gagal menyimpan. Email mungkin sudah dipakai." };
  }
}

export async function resetPassword(formData: FormData) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return;
  const id = Number(formData.get("id") || 0);
  const password = String(formData.get("password") ?? "");
  if (!id || password.length < 8) return;
  const payload = await getPayloadClient();
  await payload.update({ collection: "users", id, data: { password } });
  revalidatePath(`/team/${id}`);
}

export async function removeMember(formData: FormData) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return;
  const id = Number(formData.get("id") || 0);
  if (!id || id === user.id) return;
  const payload = await getPayloadClient();
  await payload.delete({ collection: "users", id });
  revalidatePath("/team");
  redirect("/team");
}
