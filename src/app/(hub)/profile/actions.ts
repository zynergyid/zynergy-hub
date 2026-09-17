"use server";

import { revalidatePath } from "next/cache";
import { getPayloadClient } from "@/lib/payload";
import { getSessionUser } from "@/lib/session";

export interface ProfileState {
  status: "idle" | "success" | "error";
  message?: string;
}

/** Personal API key for the /outreach Claude Code skill. Shown on the profile page, never sent anywhere else. */
export async function generateApiKey() {
  const user = await getSessionUser();
  if (!user) return;
  const payload = await getPayloadClient();
  await payload.update({ collection: "users", id: user.id, data: { enableAPIKey: true, apiKey: crypto.randomUUID() } });
  revalidatePath("/profile");
}

export async function revokeApiKey() {
  const user = await getSessionUser();
  if (!user) return;
  const payload = await getPayloadClient();
  await payload.update({ collection: "users", id: user.id, data: { enableAPIKey: false, apiKey: null } });
  revalidatePath("/profile");
}

export async function saveProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await getSessionUser();
  if (!user) return { status: "error", message: "Sesi habis, login lagi." };
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { status: "error", message: "Nama dan email yang valid wajib diisi." };
  if (password && password.length < 8) return { status: "error", message: "Password baru minimal 8 karakter." };
  if (password && password !== confirm) return { status: "error", message: "Konfirmasi password tidak sama." };
  try {
    const payload = await getPayloadClient();
    await payload.update({ collection: "users", id: user.id, data: { name, email, ...(password ? { password } : {}) } });
    revalidatePath("/profile");
    revalidatePath("/team");
    return { status: "success", message: password ? "Profil dan password tersimpan." : "Profil tersimpan." };
  } catch (error) {
    console.error("saveProfile failed:", error);
    return { status: "error", message: "Gagal menyimpan. Email mungkin sudah dipakai." };
  }
}
