"use server";

import { revalidatePath } from "next/cache";
import { getPayloadClient } from "@/lib/payload";
import { canEditTeam, getSessionUser } from "@/lib/session";
import { dateOrNull, digits, text } from "@/lib/form-data";
import { REFLECTIONS, REPORT_INDICATORS, STAGES } from "@/content/perintis";
import type { ReportKey } from "@/lib/perintis";

export interface PerintisState {
  status: "idle" | "success" | "error";
  message?: string;
}
const err = (message: string): PerintisState => ({ status: "error", message });
const reportKeys = STAGES.filter((s) => s.months).map((s) => s.key) as ReportKey[];
const numOrNull = (v: string) => (v.trim() === "" ? null : Number(digits(v)) || 0);

/** Team facts: business name, group number, leader, which unit counts as the team business. */
export async function savePerintisTeam(_prev: PerintisState, formData: FormData): Promise<PerintisState> {
  const user = await getSessionUser();
  if (!user || !canEditTeam(user)) return err("Peran Anda tidak bisa mengubah data PERINTIS.");
  const unit = text(formData, "unit");
  try {
    const payload = await getPayloadClient();
    await payload.updateGlobal({
      slug: "perintis",
      data: {
        teamName: text(formData, "teamName") || "Zynergy",
        businessName: text(formData, "businessName") || null,
        groupNumber: numOrNull(text(formData, "groupNumber")),
        leader: text(formData, "leader") || null,
        unit: ["digital", "apps", "supply", "semua"].includes(unit) ? (unit as "digital" | "apps" | "supply" | "semua") : "digital",
      },
    });
  } catch (error) {
    console.error("saveTeam failed:", error);
    return err("Gagal menyimpan.");
  }
  revalidatePath("/perintis");
  return { status: "success", message: "Data kelompok tersimpan." };
}

/** One report's targets, manual realisation, reflections, and submission date. */
export async function savePerintisReport(_prev: PerintisState, formData: FormData): Promise<PerintisState> {
  const user = await getSessionUser();
  if (!user || !canEditTeam(user)) return err("Peran Anda tidak bisa mengubah data PERINTIS.");
  const key = text(formData, "report") as ReportKey;
  if (!reportKeys.includes(key)) return err("Laporan tidak dikenal.");
  const targets = Object.fromEntries(REPORT_INDICATORS.map((i) => [i.key, numOrNull(text(formData, `target.${i.key}`))]));
  const actualOverride = Object.fromEntries(REPORT_INDICATORS.map((i) => [i.key, numOrNull(text(formData, `actual.${i.key}`))]));
  const reflections = Object.fromEntries(REFLECTIONS.map((r) => [r.key, text(formData, r.key).replace(/\r\n?/g, "\n") || null]));
  try {
    const payload = await getPayloadClient();
    await payload.updateGlobal({ slug: "perintis", data: { reports: { [key]: { targets, actualOverride, ...reflections, submittedAt: dateOrNull(text(formData, "submittedAt")) } } } });
  } catch (error) {
    console.error("saveReport failed:", error);
    return err("Gagal menyimpan laporan.");
  }
  revalidatePath("/perintis");
  return { status: "success", message: "Laporan tersimpan." };
}
