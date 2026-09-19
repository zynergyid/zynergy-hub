import type { SeoAudit } from "@/payload-types";
import { getPayloadClient } from "@/lib/payload";
import { siteUrl } from "@/lib/site-cms";
import { siteSeoPages } from "@/lib/site-seo";
import { extractSignals, runChecks, scoreChecks, type SeoCheck } from "@/lib/seo-checks";

type AuditData = Omit<SeoAudit, "id" | "createdAt" | "updatedAt">;
type Payload = Awaited<ReturnType<typeof getPayloadClient>>;

const isLocal = (url: string) => /^https?:\/\/(localhost|127\.0\.0\.1)/.test(url);

/** Fetches one public page and runs the checks; a failed fetch becomes a row with `error`. */
async function auditPage(path: string): Promise<AuditData> {
  const url = `${siteUrl()}${path}`;
  const fetchedAt = new Date().toISOString();
  const t0 = performance.now();
  try {
    const res = await fetch(url, { cache: "no-store", headers: { "user-agent": "ZynergyHub-SEO-Audit/1.0" } });
    const ttfbMs = Math.round(performance.now() - t0);
    const html = await res.text();
    const htmlBytes = Buffer.byteLength(html);
    const signals = extractSignals(html);
    const checks = runChecks(signals, { statusCode: res.status, ttfbMs, htmlBytes, https: url.startsWith("https://") || isLocal(url) });
    const { passed, total } = scoreChecks(checks);
    return { path, url, fetchedAt, statusCode: res.status, ttfbMs, htmlBytes, title: signals.title, description: signals.description, passed, total, checks, error: null };
  } catch (error) {
    return { path, url, fetchedAt, statusCode: 0, passed: 0, total: 0, checks: [], error: error instanceof Error ? error.message : "gagal mengambil halaman" };
  }
}

/** One row per path, overwritten on every run. */
async function upsertAudit(payload: Payload, data: AuditData): Promise<void> {
  const { docs } = await payload.find({ collection: "seo-audits", where: { path: { equals: data.path } }, limit: 1, depth: 0 });
  if (docs[0]) await payload.update({ collection: "seo-audits", id: docs[0].id, data });
  else await payload.create({ collection: "seo-audits", data });
}

/** Audits every page in sequence so the site is never hammered. */
export async function runSeoAudit(): Promise<{ pages: number }> {
  const payload = await getPayloadClient();
  for (const p of siteSeoPages) await upsertAudit(payload, await auditPage(p.path));
  return { pages: siteSeoPages.length };
}

export async function getSeoAudits(): Promise<SeoAudit[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({ collection: "seo-audits", limit: 100, depth: 0, sort: "path" });
  return docs;
}

export const checksOf = (a: SeoAudit): SeoCheck[] => (Array.isArray(a.checks) ? (a.checks as SeoCheck[]) : []);

let siteCache: { at: number; checks: SeoCheck[] } | null = null;

/** robots.txt and sitemap.xml, checked live (two cheap requests) and cached ten minutes. */
export async function getSiteChecks(): Promise<SeoCheck[]> {
  if (siteCache && Date.now() - siteCache.at < 10 * 60 * 1000) return siteCache.checks;
  const get = async (p: string) => {
    try {
      const res = await fetch(`${siteUrl()}${p}`, { cache: "no-store" });
      return { ok: res.ok, text: res.ok ? await res.text() : "" };
    } catch {
      return { ok: false, text: "" };
    }
  };
  const [robots, sitemap] = await Promise.all([get("/robots.txt"), get("/sitemap.xml")]);
  const sitemapUrls = (sitemap.text.match(/<loc>/g) ?? []).length;
  const checks: SeoCheck[] = [
    { id: "robots", label: "robots.txt ada dan menunjuk sitemap", status: robots.ok ? (/sitemap:/i.test(robots.text) ? "pass" : "warn") : "fail" },
    { id: "sitemap", label: "sitemap.xml ada", status: sitemap.ok && sitemapUrls > 0 ? "pass" : "fail", detail: sitemap.ok ? `${sitemapUrls} URL` : "tidak bisa dibuka" },
  ];
  siteCache = { at: Date.now(), checks };
  return checks;
}
