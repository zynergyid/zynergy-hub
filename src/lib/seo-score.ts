import type { SeoAudit } from "@/payload-types";
import { checksOf } from "@/lib/seo-audit";
import { descriptionStatus, scoreChecks, titleStatus, type CheckStatus, type SeoCheck } from "@/lib/seo-checks";
import { siteSeoPages } from "@/lib/site-seo";

/**
 * The three honest scores: technical (from page checks), content (what the
 * site offers Google), visibility (what Google sends back). Each comes with
 * the list of things to do, so a number is never shown without its fix.
 */
export interface Todo {
  id: string;
  label: string;
  status: CheckStatus;
  detail?: string;
  href?: string;
}

export const searchConsoleUrl = "https://search.google.com/search-console?resource_id=sc-domain%3Azynergy.co.id";

export function technicalScore(audits: SeoAudit[], site: SeoCheck[]): { percent: number | null; todos: Todo[] } {
  const usable = audits.filter((a) => !a.error && a.total);
  if (usable.length === 0) return { percent: null, todos: [{ id: "run", label: "Belum ada pemeriksaan. Tekan Periksa sekarang.", status: "warn" }] };
  const pagePercent = usable.reduce((s, a) => s + ((a.passed ?? 0) / (a.total ?? 1)) * 100, 0) / usable.length;
  const percent = Math.round(pagePercent * 0.85 + scoreChecks(site).percent * 0.15);

  const todos: Todo[] = site.filter((c) => c.status !== "pass").map((c) => ({ id: `site-${c.id}`, label: c.label, status: c.status, detail: c.detail }));
  // The same failing check across pages becomes one line listing the pages.
  const byCheck = new Map<string, Todo & { paths: string[] }>();
  for (const a of audits) {
    if (a.error) {
      todos.push({ id: `err-${a.path}`, label: `Halaman ${a.path} tidak bisa diperiksa`, status: "fail", detail: a.error });
      continue;
    }
    for (const c of checksOf(a)) {
      if (c.status === "pass") continue;
      const cur = byCheck.get(c.id) ?? { id: c.id, label: c.label, status: c.status, paths: [] };
      cur.paths.push(a.path);
      if (c.status === "fail") cur.status = "fail";
      byCheck.set(c.id, cur);
    }
  }
  for (const { paths, ...todo } of byCheck.values()) todos.push({ ...todo, detail: paths.join(", ") });
  return { percent, todos };
}

export interface ContentInput {
  audits: SeoAudit[];
  postsPublished: number | null;
  latestPostAt: string | null;
  businessProfileUrl: string;
  /** Filled social profile links. */
  socials?: string[];
}

/** A weighted item: full, half, or no credit; the todo status follows the credit. */
type Item = { score: 0 | 0.5 | 1; weight: number } & Omit<Todo, "status">;
const statusOf = (score: Item["score"]): CheckStatus => (score === 1 ? "pass" : score === 0.5 ? "warn" : "fail");
const credit = (ok: boolean, partial = false): Item["score"] => (ok ? 1 : partial ? 0.5 : 0);

export function contentScore(input: ContentInput): { percent: number; todos: Todo[] } {
  const audited = input.audits.filter((a) => !a.error);
  const weakPages = audited.filter((a) => titleStatus(a.title?.length ?? 0) !== "pass" || descriptionStatus(a.description?.length ?? 0) !== "pass").map((a) => a.path);
  const titles = audited.map((a) => a.title ?? "");
  const dupes = titles.filter((t, i) => t && titles.indexOf(t) !== i);
  const posts = input.postsPublished ?? 0;
  const fresh = input.latestPostAt ? Date.now() - new Date(input.latestPostAt).getTime() < 60 * 86400000 : false;
  const supplyPages = siteSeoPages.filter((p) => p.path.startsWith("/supply")).length;

  const items: Item[] = [
    { id: "meta", weight: 3, score: audited.length === 0 ? 0.5 : credit(weakPages.length === 0, weakPages.length <= 2), label: "Judul dan deskripsi tiap halaman pas panjangnya", detail: audited.length === 0 ? "belum diperiksa" : weakPages.length ? `perlu dirapikan: ${weakPages.join(", ")}` : undefined, href: "#editor" },
    { id: "dupes", weight: 1, score: credit(dupes.length === 0), label: "Tidak ada judul halaman yang sama", detail: dupes.length ? dupes.join(", ") : undefined, href: "#editor" },
    { id: "socials", weight: 1, score: credit((input.socials?.length ?? 0) >= 3, (input.socials?.length ?? 0) >= 1), label: "Minimal tiga profil sosial terisi (Instagram, LinkedIn, WhatsApp)", detail: "muncul di footer dan structured data sameAs; membantu Google mengenali Zynergy sebagai satu entitas", href: "#editor" },
    { id: "gbp", weight: 3, score: credit(Boolean(input.businessProfileUrl)), label: "Google Business Profile dibuat dan tautannya diisi", detail: "penentu terbesar untuk pencarian lokal dan Maps; hanya pemilik akun Google yang bisa membuatnya", href: "#editor" },
    { id: "posts", weight: 3, score: credit(posts >= 3, posts > 0), label: "Minimal 3 artikel terbit di blog", detail: `${posts} artikel sekarang; artikel yang menjawab pertanyaan pembeli adalah yang mendatangkan pencarian` },
    { id: "fresh", weight: 1, score: credit(fresh, !fresh), label: "Ada artikel baru dalam 60 hari terakhir" },
    { id: "supply", weight: 2, score: credit(supplyPages >= 3, true), label: "Halaman per kategori Supply (jaringan, kelistrikan, MRO)", detail: "Google memberi peringkat per halaman per topik; satu halaman Supply umum tidak cukup" },
  ];
  const total = items.reduce((s, i) => s + i.weight, 0);
  const got = items.reduce((s, i) => s + i.weight * i.score, 0);
  const todos = items.filter((i) => i.score < 1).map(({ id, label, detail, href, score }) => ({ id, label, detail, href, status: statusOf(score) }));
  return { percent: Math.round((got / total) * 100), todos };
}

/** Visibility has no score yet; it lists what stands between the site and real search data. */
export function visibilityTodos(search: { visits: number; previous: number } | null): Todo[] {
  const todos: Todo[] = [];
  if (!search) todos.push({ id: "umami", label: "Statistik web belum terhubung, jadi kunjungan dari Google belum bisa dihitung", status: "warn", href: "/web" });
  else if (search.visits === 0) todos.push({ id: "search0", label: "Belum ada kunjungan dari mesin pencari dalam 30 hari", status: "warn", detail: "wajar untuk situs baru; naik setelah Business Profile, artikel, dan halaman kategori ada" });
  todos.push({ id: "gsc-api", label: "Hubungkan Search Console API untuk melihat kata kunci dan posisi", status: "warn", detail: "perlu service account dari Google Cloud milik akun Zynergy; sampai itu ada, Visibilitas dihitung dari kunjungan mesin pencari di Umami", href: searchConsoleUrl });
  return todos;
}
