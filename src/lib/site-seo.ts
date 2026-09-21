/**
 * The pages of zynergy.co.id whose title and description the Hub edits.
 * Mirrors `src/content/seo.ts` in the site repo (the contract is the key);
 * change both when a page is added.
 */
export const siteSeoPages = [
  { key: "home", label: "Beranda", path: "/" },
  { key: "digital", label: "Digitalin", path: "/digital" },
  { key: "design", label: "Design", path: "/design" },
  { key: "supply", label: "Supply", path: "/supply" },
  { key: "racikFitur", label: "Cek & Racik Fitur", path: "/racik-fitur" },
  { key: "briefProject", label: "Brief Project", path: "/brief-project" },
  { key: "portofolio", label: "Portofolio", path: "/portofolio" },
  { key: "tentang", label: "Tentang", path: "/tentang" },
  { key: "blog", label: "Blog", path: "/blog" },
] as const;
export type SiteSeoPageKey = (typeof siteSeoPages)[number]["key"];

/**
 * Google shows about IDEAL characters and cuts longer text with an ellipsis;
 * below MIN the text is too thin to say anything. MAX is the hard limit the
 * editor accepts.
 */
export const TITLE_MIN = 20;
export const TITLE_IDEAL = 60;
export const TITLE_MAX = 70;
export const DESCRIPTION_MIN = 70;
export const DESCRIPTION_IDEAL = 160;
export const DESCRIPTION_MAX = 200;

export interface SeoPair {
  title: string;
  description: string;
}
/**
 * Public social profiles, shown in the site footer and as `sameAs` in the
 * Organization structured data. Mirrors `src/content/socials.ts` in the site
 * repo; the keys are the contract.
 */
export const socialPlatforms = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/zynergyid" },
  { key: "threads", label: "Threads", placeholder: "https://www.threads.net/@zynergyid" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/zynergyid" },
  { key: "whatsapp", label: "WhatsApp Business", placeholder: "https://wa.me/62..." },
  { key: "github", label: "GitHub", placeholder: "https://github.com/zynergyid" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/zynergyid" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@zynergyid" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@zynergyid" },
  { key: "x", label: "X", placeholder: "https://x.com/zynergyid" },
] as const;
export type SocialKey = (typeof socialPlatforms)[number]["key"];
export type Socials = Record<SocialKey, string>;

export interface SiteSeo {
  /** Google Business Profile link; empty until Danish creates the profile. */
  businessProfileUrl: string;
  socials: Socials;
  share: SeoPair;
  pages: Record<SiteSeoPageKey, SeoPair>;
}
