"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { getPayloadClient } from "@/lib/payload";
import { uploadFile } from "@/lib/uploads";
import { canEditClients, getSessionUser } from "@/lib/session";

export interface ProfileState {
  status: "idle" | "success" | "error";
  message?: string;
}

/** Personal API key for the /outreach Claude Code skill. Shown on the profile page, never sent anywhere else. */
export async function generateApiKey() {
  const user = await getSessionUser();
  if (!user || !canEditClients(user)) return;
  const payload = await getPayloadClient();
  await payload.update({ collection: "users", id: user.id, data: { enableAPIKey: true, apiKey: crypto.randomUUID() } });
  revalidatePath("/profile");
}

export async function revokeApiKey() {
  const user = await getSessionUser();
  if (!user || !canEditClients(user)) return;
  const payload = await getPayloadClient();
  await payload.update({ collection: "users", id: user.id, data: { enableAPIKey: false, apiKey: null } });
  revalidatePath("/profile");
}

/** Personal read-only calendar feed. Anyone may subscribe; rotating the token cuts off the old link. */
export async function generateCalendarToken() {
  const user = await getSessionUser();
  if (!user) return;
  const payload = await getPayloadClient();
  await payload.update({ collection: "users", id: user.id, data: { calendarToken: crypto.randomBytes(24).toString("hex") } });
  revalidatePath("/profile");
}

export async function revokeCalendarToken() {
  const user = await getSessionUser();
  if (!user) return;
  const payload = await getPayloadClient();
  await payload.update({ collection: "users", id: user.id, data: { calendarToken: null } });
  revalidatePath("/profile");
}

export async function saveProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await getSessionUser();
  if (!user) return { status: "error", message: "Sesi habis, login lagi." };
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const whatsapp = String(formData.get("whatsapp") ?? "").replace(/[^\d+]/g, "");
  const bio = String(formData.get("bio") ?? "").trim().slice(0, 120);
  if (whatsapp && whatsapp.length < 8) return { status: "error", message: "Nomor WhatsApp tidak valid." };
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { status: "error", message: "Nama dan email yang valid wajib diisi." };
  if (password && password.length < 8) return { status: "error", message: "Password baru minimal 8 karakter." };
  if (password && password !== confirm) return { status: "error", message: "Konfirmasi password tidak sama." };
  try {
    const payload = await getPayloadClient();
    await payload.update({ collection: "users", id: user.id, data: { name, email, whatsapp: whatsapp || null, bio: bio || null, ...(password ? { password } : {}) } });
    revalidatePath("/profile");
    revalidatePath("/team");
    return { status: "success", message: password ? "Profil dan password tersimpan." : "Profil tersimpan." };
  } catch (error) {
    console.error("saveProfile failed:", error);
    return { status: "error", message: "Gagal menyimpan. Email mungkin sudah dipakai." };
  }
}

const relId = (v: number | { id: number } | null | undefined) => (typeof v === "object" && v ? v.id : (v ?? null));

export type PhotoResult = { status: "ok" } | { status: "error"; message: string };

/** Replaces the profile photo; the old file is deleted so Blob keeps one per person. */
export async function setProfilePhoto(formData: FormData): Promise<PhotoResult> {
  const user = await getSessionUser();
  if (!user) return { status: "error", message: "Sesi habis, login lagi." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0 || !file.type.startsWith("image/")) return { status: "error", message: "Pilih berkas gambar." };
  if (file.size > 200_000) return { status: "error", message: "Foto terlalu besar setelah diperkecil. Coba foto lain." };
  try {
    const payload = await getPayloadClient();
    const me = await payload.findByID({ collection: "users", id: user.id, depth: 0 });
    const uploaded = await uploadFile(payload, "avatars", {}, file);
    await payload.update({ collection: "users", id: user.id, data: { photo: uploaded.id } });
    const previous = relId(me.photo);
    if (previous) await payload.delete({ collection: "avatars", id: previous }).catch(() => undefined);
  } catch (error) {
    console.error("setProfilePhoto failed:", error);
    return { status: "error", message: "Gagal mengunggah foto. Coba lagi." };
  }
  revalidatePath("/", "layout");
  return { status: "ok" };
}

export async function removeProfilePhoto() {
  const user = await getSessionUser();
  if (!user) return;
  const payload = await getPayloadClient();
  const me = await payload.findByID({ collection: "users", id: user.id, depth: 0 });
  const previous = relId(me.photo);
  await payload.update({ collection: "users", id: user.id, data: { photo: null } });
  if (previous) await payload.delete({ collection: "avatars", id: previous }).catch(() => undefined);
  revalidatePath("/", "layout");
}
