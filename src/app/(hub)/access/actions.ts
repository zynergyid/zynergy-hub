"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/session";
import { saveGrantsToGlobal } from "@/lib/permissions";
import { capabilities, roles, type Capability, type RoleGrants } from "@/lib/options";

export interface GrantsState {
  status: "idle" | "success" | "error";
  message?: string;
}

/** Saves the capability grid. Admin only; the admin flag is never part of the form. */
export async function saveGrants(_prev: GrantsState, formData: FormData): Promise<GrantsState> {
  const user = await getSessionUser();
  if (!user || !user.isAdmin) return { status: "error", message: "Hanya admin." };
  const grants = Object.fromEntries(
    roles.map((r) => [r.value, capabilities.map((c) => c.key).filter((c): c is Capability => formData.get(`${r.value}.${c}`) === "on")]),
  ) as RoleGrants;
  try {
    await saveGrantsToGlobal(grants);
  } catch (error) {
    console.error("saveGrants failed:", error);
    return { status: "error", message: "Gagal menyimpan. Coba lagi." };
  }
  revalidatePath("/", "layout");
  return { status: "success", message: "Hak akses tersimpan dan langsung berlaku." };
}
