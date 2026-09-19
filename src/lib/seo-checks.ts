import { DESCRIPTION_IDEAL, DESCRIPTION_MIN, TITLE_IDEAL, TITLE_MIN } from "@/lib/site-seo";

/**
 * Technical SEO checks on a page's HTML. Pure functions with no I/O, so the
 * same code can be unit-tested and reused for client sites later. "warn"
 * counts half in the score: worth fixing, not broken.
 */
export type CheckStatus = "pass" | "warn" | "fail";
export interface SeoCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail?: string;
}

/** One rule for title length, shared by the checks, the content score, and the table lights. */
export const titleStatus = (length: number): CheckStatus => (length === 0 ? "fail" : length < TITLE_MIN || length > TITLE_IDEAL ? "warn" : "pass");
export const descriptionStatus = (length: number): CheckStatus => (length === 0 ? "fail" : length < DESCRIPTION_MIN || length > DESCRIPTION_IDEAL ? "warn" : "pass");

export interface PageSignals {
  title: string;
  description: string;
  h1Count: number;
  canonical: string | null;
  ogTitle: boolean;
  ogDescription: boolean;
  ogImage: boolean;
  viewport: boolean;
  lang: string | null;
  jsonLd: boolean;
  noindex: boolean;
  imgTotal: number;
  imgNoAlt: number;
}

/** Value of one attribute in a tag string, quoted with " or '. */
function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"));
  return m ? (m[1] ?? m[2] ?? "") : null;
}
const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();

/** Reads the signals the checks need from raw HTML; no DOM parser needed for head tags. */
export function extractSignals(html: string): PageSignals {
  const head = html.slice(0, 200000);
  const metas = head.match(/<meta\b[^>]*>/gi) ?? [];
  const meta = (key: "name" | "property", value: string) => {
    const tag = metas.find((m) => (attr(m, key) ?? "").toLowerCase() === value);
    return tag ? decode(attr(tag, "content") ?? "") : null;
  };
  const links = head.match(/<link\b[^>]*>/gi) ?? [];
  const canonicalTag = links.find((l) => (attr(l, "rel") ?? "").toLowerCase() === "canonical");
  const imgs = html.match(/<img\b[^>]*>/gi) ?? [];
  return {
    title: decode(head.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? ""),
    description: meta("name", "description") ?? "",
    h1Count: (html.match(/<h1\b/gi) ?? []).length,
    canonical: canonicalTag ? attr(canonicalTag, "href") : null,
    ogTitle: Boolean(meta("property", "og:title")),
    ogDescription: Boolean(meta("property", "og:description")),
    ogImage: Boolean(meta("property", "og:image")),
    viewport: Boolean(meta("name", "viewport")),
    lang: head.match(/<html\b[^>]*\blang\s*=\s*["']([^"']+)["']/i)?.[1] ?? null,
    jsonLd: /type\s*=\s*["']application\/ld\+json["']/i.test(html),
    noindex: (meta("name", "robots") ?? "").toLowerCase().includes("noindex"),
    imgTotal: imgs.length,
    imgNoAlt: imgs.filter((i) => !/\balt\s*=/i.test(i)).length,
  };
}

export interface FetchSignals {
  statusCode: number;
  ttfbMs: number;
  htmlBytes: number;
  https: boolean;
}

/** The checklist for one page, in the order it is shown. */
export function runChecks(page: PageSignals, f: FetchSignals): SeoCheck[] {
  const t = page.title.length;
  const d = page.description.length;
  return [
    { id: "status", label: "Halaman bisa dibuka", status: f.statusCode === 200 ? "pass" : "fail", detail: `HTTP ${f.statusCode}` },
    { id: "https", label: "HTTPS", status: f.https ? "pass" : "fail" },
    { id: "title", label: "Judul ada dan panjangnya pas", status: titleStatus(t), detail: `${t} karakter, ideal ${TITLE_MIN} sampai ${TITLE_IDEAL}` },
    { id: "description", label: "Deskripsi ada dan panjangnya pas", status: descriptionStatus(d), detail: `${d} karakter, ideal ${DESCRIPTION_MIN} sampai ${DESCRIPTION_IDEAL}` },
    { id: "h1", label: "Satu judul utama (H1)", status: page.h1Count === 1 ? "pass" : page.h1Count === 0 ? "fail" : "warn", detail: `${page.h1Count} H1` },
    { id: "canonical", label: "Alamat kanonik", status: page.canonical ? "pass" : "warn", detail: page.canonical ?? "tidak ada" },
    { id: "og", label: "Pratinjau bagi-pakai (judul, deskripsi, gambar)", status: page.ogTitle && page.ogDescription && page.ogImage ? "pass" : page.ogTitle ? "warn" : "fail" },
    { id: "viewport", label: "Siap layar HP (viewport)", status: page.viewport ? "pass" : "fail" },
    { id: "lang", label: "Bahasa halaman ditandai", status: page.lang ? "pass" : "warn", detail: page.lang ?? "tidak ada" },
    { id: "jsonld", label: "Structured data (JSON-LD)", status: page.jsonLd ? "pass" : "warn" },
    { id: "index", label: "Boleh diindeks", status: page.noindex ? "fail" : "pass" },
    { id: "alt", label: "Semua gambar punya teks alt", status: page.imgNoAlt === 0 ? "pass" : "warn", detail: `${page.imgNoAlt} dari ${page.imgTotal} gambar tanpa alt` },
    { id: "ttfb", label: "Respons server cepat", status: f.ttfbMs < 800 ? "pass" : f.ttfbMs < 1500 ? "warn" : "fail", detail: `${f.ttfbMs} ms` },
    { id: "size", label: "HTML tidak terlalu besar", status: f.htmlBytes < 300000 ? "pass" : "warn", detail: `${Math.round(f.htmlBytes / 1024)} KB` },
  ];
}

/** pass = 1, warn = 0.5, fail = 0. */
export function scoreChecks(checks: SeoCheck[]): { passed: number; total: number; percent: number } {
  const total = checks.length;
  const passed = checks.reduce((s, c) => s + (c.status === "pass" ? 1 : c.status === "warn" ? 0.5 : 0), 0);
  return { passed, total, percent: total ? Math.round((passed / total) * 100) : 0 };
}
