"use server";

import { revalidatePath } from "next/cache";
import { canEditSeo, getSessionUser } from "@/lib/session";
import { saveSiteSeo, siteCmsConfigured } from "@/lib/site-cms";
import { DESCRIPTION_MAX, TITLE_MAX, siteSeoPages, socialPlatforms, type SeoPair, type SiteSeo, type Socials } from "@/lib/site-seo";
import { runSeoAudit } from "@/lib/seo-audit";
import { text } from "@/lib/form-data";

export interface SeoFormState {
  status: "idle" | "success" | "error";
  message?: string;
}

const validUrl = (v: string) => v === "" || /^https:\/\/\S+$/.test(v);
const err = (message: string): SeoFormState => ({ status: "error", message });
const tooLong = (p: SeoPair) => p.title.length > TITLE_MAX || p.description.length > DESCRIPTION_MAX;

/** Writes titles and descriptions to the site CMS. Admin only. */
export async function updateSiteSeo(_prev: SeoFormState, formData: FormData): Promise<SeoFormState> {
  const user = await getSessionUser();
  if (!user || !canEditSeo(user)) return { status: "error", message: "Peran Anda tidak boleh mengubah SEO." };
  if (!siteCmsConfigured()) return { status: "error", message: "Hub belum terhubung ke CMS situs." };

  const pair = (prefix: string): SeoPair => ({ title: text(formData, `${prefix}.title`), description: text(formData, `${prefix}.description`) });
  const socials = Object.fromEntries(socialPlatforms.map((p) => [p.key, text(formData, `socials.${p.key}`)])) as Socials;
  const badSocial = socialPlatforms.find((p) => !validUrl(socials[p.key]));
  if (badSocial) return err(`Tautan ${badSocial.label} harus diawali https://.`);
  const seo: SiteSeo = {
    businessProfileUrl: text(formData, "businessProfileUrl"),
    socials,
    share: pair("share"),
    pages: Object.fromEntries(siteSeoPages.map((p) => [p.key, pair(`pages.${p.key}`)])) as SiteSeo["pages"],
  };
  if (!validUrl(seo.businessProfileUrl)) return { status: "error", message: "Tautan Business Profile harus diawali https://." };
  if ([seo.share, ...Object.values(seo.pages)].some(tooLong)) return { status: "error", message: `Judul maksimal ${TITLE_MAX} karakter, deskripsi ${DESCRIPTION_MAX}.` };
  try {
    await saveSiteSeo(seo);
  } catch (error) {
    console.error("updateSiteSeo failed:", error);
    return { status: "error", message: "Gagal menyimpan ke situs. Coba lagi sebentar." };
  }
  revalidatePath("/seo");
  return { status: "success", message: "Tersimpan. Situs memakai teks baru paling lama 5 menit lagi." };
}

/** Re-runs the technical checks on every page. Admin only. */
export async function runAuditNow(): Promise<void> {
  const user = await getSessionUser();
  if (!user || !canEditSeo(user)) return;
  await runSeoAudit();
  revalidatePath("/seo");
}
