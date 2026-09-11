"use server";

import { revalidatePath } from "next/cache";
import { getPayloadClient } from "@/lib/payload";
import { getSessionUser } from "@/lib/session";

export interface MemberFormState {
  status: "idle" | "success" | "error";
  message?: string;
}

const roles = ["admin", "finance", "member"] as const;
type Role = (typeof roles)[number];
const isRole = (v: string): v is Role => (roles as readonly string[]).includes(v);

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
  try {
    const payload = await getPayloadClient();
    await payload.create({ collection: "users", data: { name, email, password, role } });
    revalidatePath("/tim");
    return { status: "success" };
  } catch (error) {
    console.error("addMember failed:", error);
    return { status: "error", message: "Gagal menambah. Email mungkin sudah dipakai." };
  }
}

export async function setRole(formData: FormData) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return;
  const id = Number(formData.get("id") || 0);
  const role = String(formData.get("role") ?? "");
  if (!id || !isRole(role) || id === user.id) return;
  const payload = await getPayloadClient();
  await payload.update({ collection: "users", id, data: { role } });
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
