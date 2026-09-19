import Link from "next/link";
import { change, type WebSummary } from "@/lib/web-analytics";
import { cn } from "@/lib/cn";
import { Card } from "./Card";

const num = new Intl.NumberFormat("id-ID");

function Stat({ label, value, delta, hint }: { label: string; value: string; delta: number | null; hint?: string }) {
  return (
    <div className="rounded-xl bg-surface-soft p-3">
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-base font-extrabold">{value}</dd>
      <dd className={cn("truncate", delta === null ? "text-muted" : delta >= 0 ? "text-secondary-dark" : "text-red-600")}>
        {delta === null ? (hint ?? "belum ada pembanding") : `${delta >= 0 ? "+" : ""}${delta}% vs periode lalu`}
      </dd>
    </div>
  );
}

/** Dashboard card: zynergy.co.id traffic this week, from Umami. */
export function WebCard({ summary }: { summary: WebSummary | null }) {
  return (
    <Card title="Web zynergy.co.id" action={{ label: "Buka statistik", href: "/web" }}>
      {!summary ? (
        <p className="text-sm text-muted">Statistik web belum bisa dibaca. Cek koneksi ke Umami di halaman Web.</p>
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-3 text-xs">
            <Stat label={`Pengunjung ${summary.days} hari`} value={num.format(summary.totals.visitors)} delta={change(summary.totals.visitors, summary.previous.visitors)} />
            <Stat label="Tayangan halaman" value={num.format(summary.totals.pageviews)} delta={change(summary.totals.pageviews, summary.previous.pageviews)} />
            <Stat label="Klik WhatsApp" value={num.format(summary.whatsappClicks)} delta={change(summary.whatsappClicks, summary.whatsappPrevious)} hint="belum ada klik" />
          </dl>
          {summary.pages.length > 0 && (
            <p className="mt-3 truncate text-xs text-muted">
              Halaman teratas: {summary.pages.slice(0, 3).map((p) => `${p.label} (${num.format(p.count)})`).join(" · ")}
            </p>
          )}
          {summary.totals.pageviews === 0 && <p className="mt-3 text-xs text-muted">Belum ada kunjungan tercatat di periode ini. Pelacak aktif sejak 19 Sep 2026.</p>}
        </>
      )}
      <p className="mt-2 text-xs text-muted">
        <Link href="/web" className="font-semibold text-primary hover:underline">Rincian, sumber kunjungan, dan tombol WhatsApp mana yang diklik</Link>
      </p>
    </Card>
  );
}
