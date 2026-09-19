import { siteSeoPages, type SeoPair, type SiteSeo, type SiteSeoPageKey } from "@/lib/site-seo";

/**
 * The site's own CMS (Payload on zynergy.co.id) holds the site content; the
 * Hub edits it through the REST API as the site user "hub" with an API key.
 * SITE_API_URL is the site's `/api` base; SITE_API_KEY the user's key.
 */
export const siteCmsConfigured = () => Boolean(process.env.SITE_API_URL && process.env.SITE_API_KEY);
export const siteUrl = () => (process.env.SITE_API_URL ?? "https://zynergy.co.id/api").replace(/\/api\/?$/, "");

const headers = () => ({ Authorization: `users API-Key ${process.env.SITE_API_KEY}`, "Content-Type": "application/json" });

type RawPair = { title?: string | null; description?: string | null } | null | undefined;
const pair = (raw: RawPair): SeoPair => ({ title: raw?.title ?? "", description: raw?.description ?? "" });

/** Current settings, with empty strings where nothing has been edited yet. */
export async function getSiteSeo(): Promise<SiteSeo | null> {
  if (!siteCmsConfigured()) return null;
  try {
    const res = await fetch(`${process.env.SITE_API_URL}/globals/site-settings?depth=0`, { headers: headers(), cache: "no-store" });
    if (!res.ok) throw new Error(`site-settings ${res.status}`);
    const data = (await res.json()) as { businessProfileUrl?: string | null; share?: RawPair; pages?: Partial<Record<SiteSeoPageKey, RawPair>> };
    return {
      businessProfileUrl: data.businessProfileUrl ?? "",
      share: pair(data.share),
      pages: Object.fromEntries(siteSeoPages.map((p) => [p.key, pair(data.pages?.[p.key])])) as SiteSeo["pages"],
    };
  } catch (error) {
    console.error("getSiteSeo failed:", error);
    return null;
  }
}

/** Writes the whole SEO block; empty strings mean "use the site's default". */
export async function saveSiteSeo(seo: SiteSeo): Promise<void> {
  const res = await fetch(`${process.env.SITE_API_URL}/globals/site-settings`, { method: "POST", headers: headers(), body: JSON.stringify(seo), cache: "no-store" });
  if (!res.ok) throw new Error(`site-settings save ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

/** How many articles are live on the site, and when the latest went out. */
export async function getPublishedPosts(): Promise<{ total: number; latestAt: string | null } | null> {
  if (!siteCmsConfigured()) return null;
  try {
    const res = await fetch(`${process.env.SITE_API_URL}/posts?where[_status][equals]=published&sort=-publishedAt&limit=1&depth=0`, { headers: headers(), cache: "no-store" });
    if (!res.ok) throw new Error(`posts ${res.status}`);
    const data = (await res.json()) as { totalDocs?: number; docs?: { publishedAt?: string | null }[] };
    return { total: data.totalDocs ?? 0, latestAt: data.docs?.[0]?.publishedAt ?? null };
  } catch (error) {
    console.error("getPublishedPosts failed:", error);
    return null;
  }
}
