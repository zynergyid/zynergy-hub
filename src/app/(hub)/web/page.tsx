import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Clock, Eye, MousePointerClick, Users } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { avgSeconds, change, getWebSummary, umamiDashboardUrl, webAnalyticsConfigured, type WebRow } from "@/lib/web-analytics";
import { formatDate } from "@/lib/format";
import { first, type Search } from "@/lib/search";
import { cn } from "@/lib/cn";
import { Card } from "@/components/hub/Card";
import { EmptyState } from "@/components/hub/EmptyState";
import { KpiCard } from "@/components/hub/KpiCard";
import { PageHeader } from "@/components/hub/PageHeader";
import { SegmentedLinks } from "@/components/hub/SegmentedLinks";
import { buttonOutline } from "@/components/hub/form";

export const metadata: Metadata = { title: "Web" };
export const dynamic = "force-dynamic";

const num = new Intl.NumberFormat("id-ID");
const dayLabel = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" });
const secondsLabel = (s: number) => (s >= 60 ? `${Math.floor(s / 60)} mnt ${s % 60} dtk` : `${s} dtk`);

function RankList({ rows, empty, total }: { rows: WebRow[]; empty: string; total: number }) {
  if (rows.length === 0) return <p className="text-sm text-muted">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium">{r.label}</span>
            <span className="shrink-0 font-semibold">
              {num.format(r.count)}
              {total > 0 && <span className="ml-1 text-xs font-normal text-muted">{Math.round((r.count / total) * 100)}%</span>}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-soft">
            <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.max(3, (r.count / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function WebPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const sp = await searchParams;
  const days: 7 | 30 = first(sp.hari) === "30" ? 30 : 7;
  const configured = webAnalyticsConfigured();
  const summary = configured ? await getWebSummary(days) : null;
  const dashboard = umamiDashboardUrl();

  return (
    <div className="space-y-5">
      <PageHeader title="Web" subtitle="Kunjungan ke zynergy.co.id dan klik tombol WhatsApp, dari Umami di stats.zynergy.co.id. Tanpa cookie, tanpa data pribadi.">
        <SegmentedLinks
          ariaLabel="Periode"
          segments={[
            { label: "7 hari", href: "/web", active: days === 7 },
            { label: "30 hari", href: "/web?hari=30", active: days === 30 },
          ]}
        />
        {dashboard && (
          <a href={dashboard} target="_blank" rel="noopener noreferrer" className={buttonOutline}>
            Buka Umami
          </a>
        )}
      </PageHeader>

      {!configured ? (
        <EmptyState title="Statistik web belum dihubungkan." hint="Isi UMAMI_URL, UMAMI_API_KEY, dan UMAMI_WEBSITE_ID di env Hub." />
      ) : !summary ? (
        <EmptyState title="Umami tidak bisa dihubungi." hint="Coba muat ulang beberapa menit lagi. Kalau terus gagal, cek stats.zynergy.co.id dan kunci API user hub." />
      ) : (
        <>
          <p className="text-xs text-muted">
            {formatDate(summary.from.toISOString())} sampai {formatDate(summary.to.toISOString())}, dibanding {summary.days} hari sebelumnya. Angka diperbarui tiap 10 menit.
          </p>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <KpiCard icon={Users} label="Pengunjung" value={num.format(summary.totals.visitors)} delta={change(summary.totals.visitors, summary.previous.visitors)} tone="primary" hint={`${num.format(summary.totals.visits)} kunjungan`} />
            <KpiCard icon={Eye} label="Tayangan halaman" value={num.format(summary.totals.pageviews)} delta={change(summary.totals.pageviews, summary.previous.pageviews)} tone="neutral" />
            <KpiCard icon={MousePointerClick} label="Klik WhatsApp" value={num.format(summary.whatsappClicks)} delta={change(summary.whatsappClicks, summary.whatsappPrevious)} tone="in" hint={summary.totals.visitors ? `${Math.round((summary.whatsappClicks / summary.totals.visitors) * 100)}% dari pengunjung` : undefined} />
            <KpiCard icon={Clock} label="Lama kunjungan" value={secondsLabel(avgSeconds(summary.totals))} tone="neutral" hint={summary.totals.visits ? `${Math.round((summary.totals.bounces / summary.totals.visits) * 100)}% langsung pergi` : "rata-rata per kunjungan"} />
          </div>

          <Card title="Tayangan per hari">
            {summary.totals.pageviews === 0 ? (
              <p className="text-sm text-muted">Belum ada kunjungan tercatat. Pelacak aktif sejak 19 Sep 2026.</p>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[28rem]">
                  {/* Bars and labels live in separate rows so a label never lifts its bar off the baseline. */}
                  <ul className="flex h-40 items-end gap-1">
                    {summary.daily.map((d) => {
                      const max = Math.max(1, ...summary.daily.map((x) => x.pageviews));
                      return (
                        <li key={d.date} className="group flex h-full flex-1 items-end" title={`${dayLabel.format(new Date(`${d.date}T12:00:00+07:00`))}: ${d.pageviews} tayangan, ${d.visitors} pengunjung`}>
                          <div className={cn("w-full rounded-t bg-primary/70 group-hover:bg-primary", d.pageviews === 0 && "bg-line")} style={{ height: `${Math.max(2, (d.pageviews / max) * 100)}%` }} />
                        </li>
                      );
                    })}
                  </ul>
                  <ul className="mt-1 flex gap-1">
                    {summary.daily.map((d) => (
                      <li key={d.date} className="min-w-0 flex-1 text-center text-[10px] text-muted">
                        {(summary.days === 7 || Number(d.date.slice(8)) % 5 === 0) && <span className="block truncate">{dayLabel.format(new Date(`${d.date}T12:00:00+07:00`))}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Card>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card title="Halaman teratas" className="min-w-0">
              <RankList rows={summary.pages} empty="Belum ada data." total={summary.totals.pageviews} />
            </Card>
            <Card title="Sumber kunjungan" className="min-w-0">
              <RankList rows={summary.referrers} empty="Belum ada data." total={summary.totals.visits} />
            </Card>
            <Card title="Tombol WhatsApp yang diklik" className="min-w-0">
              <RankList rows={summary.whatsappPlaces} empty="Belum ada klik WhatsApp di periode ini." total={summary.whatsappClicks} />
              <p className="mt-3 text-xs text-muted">Nama tempat mengikuti posisi tombol di situs: hero, header, layanan, harga, penutup, tombol melayang.</p>
            </Card>
          </div>
          <Card title="Negara pengunjung" className="min-w-0">
            <RankList rows={summary.countries} empty="Belum ada data." total={summary.totals.visits} />
          </Card>
        </>
      )}
    </div>
  );
}
