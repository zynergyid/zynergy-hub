import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { SeoAudit } from "@/payload-types";
import { canEditSeo, getSessionUser } from "@/lib/session";
import { getSiteSeo, getPublishedPosts, siteCmsConfigured, siteUrl } from "@/lib/site-cms";
import { siteSeoPages, type SeoPair } from "@/lib/site-seo";
import { checksOf, getSeoAudits, getSiteChecks } from "@/lib/seo-audit";
import { descriptionStatus, titleStatus, type CheckStatus } from "@/lib/seo-checks";
import { contentScore, searchConsoleUrl, technicalScore, visibilityTodos, type Todo } from "@/lib/seo-score";
import { change, getSearchVisits, webAnalyticsConfigured } from "@/lib/web-analytics";
import { cn } from "@/lib/cn";
import { Card } from "@/components/hub/Card";
import { EmptyState } from "@/components/hub/EmptyState";
import { PageHeader } from "@/components/hub/PageHeader";
import { buttonOutline } from "@/components/hub/form";
import { RunAuditButton } from "./RunAuditButton";
import { SeoForm } from "./SeoForm";

export const metadata: Metadata = { title: "SEO" };
export const dynamic = "force-dynamic";
/** "Periksa sekarang" fetches nine pages in sequence; give the action room. */
export const maxDuration = 60;

const num = new Intl.NumberFormat("id-ID");
const when = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });

const statusLabel: Record<CheckStatus, string> = { pass: "OK", warn: "Perbaiki", fail: "Kurang" };
const statusOrder: Record<CheckStatus, number> = { fail: 0, warn: 1, pass: 2 };
const badgeTone: Record<CheckStatus, string> = { pass: "bg-secondary-soft text-secondary-dark", warn: "bg-amber-50 text-amber-700", fail: "bg-red-50 text-red-700" };
const dotTone: Record<CheckStatus, string> = { pass: "bg-secondary", warn: "bg-amber-400", fail: "bg-red-500" };
const textTone: Record<CheckStatus, string> = { pass: "text-secondary-dark", warn: "text-amber-700", fail: "text-red-600" };
const scoreStatus = (percent: number): CheckStatus => (percent >= 80 ? "pass" : percent >= 50 ? "warn" : "fail");

function ScoreCard({ label, value, hint, percent }: { label: string; value: string; hint: string; percent: number | null }) {
  const status = percent === null ? null : scoreStatus(percent);
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,27,51,0.04)] sm:p-5">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className={cn("mt-1 text-3xl font-extrabold tracking-tight", status ? textTone[status] : "text-muted")}>{value}</p>
      {status && percent !== null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-soft">
          <div className={cn("h-full rounded-full", dotTone[status])} style={{ width: `${Math.max(3, percent)}%` }} />
        </div>
      )}
      <p className="mt-2 text-xs text-muted">{hint}</p>
    </div>
  );
}

function TodoList({ todos }: { todos: Todo[] }) {
  if (todos.length === 0) return <p className="text-sm text-muted">Tidak ada yang perlu dikerjakan. Bagus.</p>;
  return (
    <ul className="divide-y divide-line">
      {todos.map((t) => (
        <li key={t.id} className="flex items-start gap-3 py-2.5">
          <span className={cn("mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold", badgeTone[t.status])}>{statusLabel[t.status]}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{t.href ? <a href={t.href} className="hover:underline">{t.label}</a> : t.label}</p>
            {t.detail && <p className="text-xs text-muted">{t.detail}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** A title or description as the audit saw it, with its light and length. */
function MetaCell({ text, status, muted }: { text: string; status: CheckStatus; muted?: boolean }) {
  return (
    <>
      <div className="flex items-start gap-2">
        <span className={cn("mt-1.5 inline-block size-2.5 shrink-0 rounded-full", dotTone[status])} aria-label={statusLabel[status]} />
        <span className={cn("line-clamp-2", muted && "text-muted")}>{text || "(kosong)"}</span>
      </div>
      <p className="mt-0.5 pl-4 text-xs text-muted">{text.length} karakter</p>
    </>
  );
}

function AuditRow({ label, audit }: { label: string; audit: SeoAudit }) {
  const title = audit.title ?? "";
  const description = audit.description ?? "";
  const notes = checksOf(audit).filter((c) => c.status !== "pass");
  return (
    <tr className="align-top">
      <td className="py-2.5 pr-3">
        <p className="font-semibold">{label}</p>
        <p className="text-xs text-muted">{audit.path}</p>
      </td>
      {audit.error ? (
        <td colSpan={4} className="py-2.5 text-red-600">{audit.error}</td>
      ) : (
        <>
          <td className="max-w-[16rem] py-2.5 pr-3"><MetaCell text={title} status={titleStatus(title.length)} /></td>
          <td className="max-w-[20rem] py-2.5 pr-3"><MetaCell text={description} status={descriptionStatus(description.length)} muted /></td>
          <td className="py-2.5 pr-3 text-right tabular-nums" title={notes.map((c) => `${statusLabel[c.status]}: ${c.label}`).join("\n")}>
            {audit.passed}/{audit.total}
            {notes.length > 0 && <p className="text-xs text-muted">{notes.length} catatan</p>}
          </td>
          <td className="py-2.5 text-right tabular-nums text-muted">{audit.ttfbMs ?? 0} ms</td>
        </>
      )}
    </tr>
  );
}

export default async function SeoPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const admin = canEditSeo(user);
  const configured = siteCmsConfigured();
  const [audits, siteChecks, seo, posts, search] = await Promise.all([
    getSeoAudits(),
    getSiteChecks(),
    configured ? getSiteSeo() : null,
    configured ? getPublishedPosts() : null,
    webAnalyticsConfigured() ? getSearchVisits(30) : null,
  ]);
  const technical = technicalScore(audits, siteChecks);
  const content = contentScore({ audits, postsPublished: posts?.total ?? null, latestPostAt: posts?.latestAt ?? null, businessProfileUrl: seo?.businessProfileUrl ?? "", socials: Object.values(seo?.socials ?? {}).filter(Boolean) });
  const todos = [...technical.todos, ...content.todos, ...visibilityTodos(search)].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
  const byPath = new Map(audits.map((a) => [a.path, a]));
  const lastAudit = audits.map((a) => a.fetchedAt).sort().at(-1);
  const current: Partial<Record<string, SeoPair>> = Object.fromEntries(audits.filter((a) => !a.error).map((a) => [a.path, { title: a.title ?? "", description: a.description ?? "" }]));
  const searchDelta = search ? change(search.visits, search.previous) : null;
  const visibilityHint = !search
    ? "Statistik web belum terhubung."
    : `kunjungan dari mesin pencari 30 hari terakhir${searchDelta === null ? "" : `, ${searchDelta >= 0 ? "naik" : "turun"} ${Math.abs(searchDelta)}% dari 30 hari sebelumnya`}. Bukan skor: ini hasil, bukan usaha.`;

  return (
    <div className="space-y-5">
      <PageHeader title="SEO" subtitle={`Seberapa siap ${siteUrl().replace(/^https?:\/\//, "")} ditemukan lewat Google, dan apa yang harus dikerjakan berikutnya.`}>
        {admin && <RunAuditButton />}
        <a href={searchConsoleUrl} target="_blank" rel="noopener noreferrer" className={buttonOutline}>
          Buka Search Console
        </a>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-3">
        <ScoreCard label="Teknis" value={technical.percent === null ? "Belum diperiksa" : `${technical.percent}`} percent={technical.percent} hint={lastAudit ? `${audits.filter((a) => !a.error).length} halaman diperiksa, terakhir ${when.format(new Date(lastAudit))} WIB. Otomatis tiap hari 02:00.` : "Tekan Periksa sekarang untuk mengambil semua halaman."} />
        <ScoreCard label="Konten" value={`${content.percent}`} percent={content.percent} hint="Apa yang situs tawarkan ke Google: judul, deskripsi, Business Profile, artikel, halaman kategori." />
        <ScoreCard label="Visibilitas" value={search ? num.format(search.visits) : "Belum ada"} percent={null} hint={visibilityHint} />
      </div>

      <Card title="Yang perlu dikerjakan">
        <TodoList todos={todos} />
      </Card>

      <Card title="Per halaman" className="min-w-0">
        {audits.length === 0 ? (
          <EmptyState title="Belum ada pemeriksaan." hint={admin ? "Tekan Periksa sekarang di atas." : "Minta admin menekan Periksa sekarang."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="pb-2 pr-3 font-medium">Halaman</th>
                  <th className="pb-2 pr-3 font-medium">Judul</th>
                  <th className="pb-2 pr-3 font-medium">Deskripsi</th>
                  <th className="pb-2 pr-3 text-right font-medium">Teknis</th>
                  <th className="pb-2 text-right font-medium">Respons</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {siteSeoPages.map((p) => {
                  const audit = byPath.get(p.path);
                  return audit ? <AuditRow key={p.path} label={p.label} audit={audit} /> : null;
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-muted">Lampu: hijau pas, kuning perlu dirapikan (judul 20 sampai 60 karakter, deskripsi 70 sampai 160), merah kosong. Arahkan kursor ke angka Teknis untuk melihat catatannya.</p>
      </Card>

      {admin && (
        <Card id="editor" title="Ubah judul dan deskripsi" className="scroll-mt-20">
          {!configured ? (
            <EmptyState title="Hub belum terhubung ke CMS situs." hint="Isi SITE_API_URL dan SITE_API_KEY di env Hub." />
          ) : !seo ? (
            <EmptyState title="CMS situs tidak bisa dihubungi." hint="Cek apakah zynergy.co.id hidup dan kunci API user hub masih berlaku." />
          ) : (
            <>
              <p className="mb-4 text-sm text-muted">Yang tampil di hasil pencarian Google dan pratinjau tautan. Kosong berarti memakai teks bawaan situs (ditampilkan samar sebagai contoh). Perubahan tayang paling lama 5 menit setelah disimpan.</p>
              <SeoForm seo={seo} current={current} />
            </>
          )}
        </Card>
      )}
    </div>
  );
}
