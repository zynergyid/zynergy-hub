import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarPlus, ExternalLink, Printer, Trophy } from "lucide-react";
import { canEditTeam, getSessionUser } from "@/lib/session";
import { getLedger, resolveUnit } from "@/lib/finance";
import { FINAL_RUBRIC, FINAL_TIPS, MENTOR_AGENDA, MENTORS, PRIZES, PROGRAM, REFLECTIONS, REPORT_INDICATORS, RULES, SANCTIONS, SESSION_NUMERALS, STAGES, WEIGHTS } from "@/content/perintis";
import { draftsFrom, factsFrom, figuresFromCashFlow, getMentoringSessions, getPerintis, hubSummary, mentorForSession, mergeFigures, programProgress, reportDueDate, stageStatuses, type ReportKey } from "@/lib/perintis";
import { todayWib } from "@/lib/calendar-dates";
import { formatDate, formatIDR, formatMonthLong } from "@/lib/format";
import { first, type Search } from "@/lib/search";
import { unitLabel, type Unit } from "@/lib/options";
import { cn } from "@/lib/cn";
import { Card } from "@/components/hub/Card";
import { MarkdownLite } from "@/components/hub/MarkdownLite";
import { PrintButton } from "@/components/hub/PrintButton";
import { SegmentedLinks } from "@/components/hub/SegmentedLinks";
import { buttonOutline } from "@/components/hub/form";
import { ReportForm } from "./ReportForm";
import { Roadmap } from "./Roadmap";
import { TeamForm } from "./TeamForm";

export const metadata: Metadata = { title: "PERINTIS 2026" };
export const dynamic = "force-dynamic";

const num = new Intl.NumberFormat("id-ID");
const reportStages = STAGES.filter((s) => s.months);
const weightTone = ["bg-primary", "bg-secondary", "bg-secondary/70", "bg-secondary/50", "bg-amber-400", "bg-navy"];
const delay = (sec: number) => ({ animationDelay: `${sec}s` });
const RING = 2 * Math.PI * 26;
/** Gold, silver, bronze. */
const medal = [
  { card: "bg-amber-50 ring-amber-200", icon: "text-amber-500" },
  { card: "bg-slate-100 ring-slate-300", icon: "text-slate-500" },
  { card: "bg-orange-50 ring-orange-200", icon: "text-orange-700" },
];
const showValue = (v: number | null, money: boolean) => (v === null ? "…" : money ? formatIDR(v) : num.format(v));

/** The team's page for the programme: where we are, what is due next, and the report that comes out of Arus Kas. */
export default async function PerintisPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const sp = await searchParams;
  const editable = canEditTeam(user);
  const data = await getPerintis();
  const today = todayWib();
  const statuses = stageStatuses(today);
  const progress = programProgress(today);
  const focus = statuses.find((s) => s.status === "fokus") ?? statuses[statuses.length - 1];
  const done = statuses.filter((s) => s.status === "selesai").length;
  const focusIndex = statuses.indexOf(focus);
  const segment = focusIndex > 0 ? statuses[focusIndex - 1].toNext : 0;
  const wanted = first(sp.laporan);
  const reportKey = (reportStages.some((s) => s.key === wanted) ? wanted : (focus.stage.months ? focus.stage.key : "report3")) as ReportKey;
  const reportStage = reportStages.find((s) => s.key === reportKey)!;
  const reportStatus = statuses.find((s) => s.stage.key === reportKey)!;
  const unitParam = data.unit && data.unit !== "semua" ? data.unit : undefined;
  const unit = resolveUnit(unitParam, user.units);
  const prevStage = reportStages[reportStages.indexOf(reportStage) - 1];
  const [computed, summary, previous, sessions] = await Promise.all([
    figuresFromCashFlow(reportStage, user.units, unitParam),
    hubSummary(reportStage, user.units),
    prevStage ? figuresFromCashFlow(prevStage, user.units, unitParam) : Promise.resolve(undefined),
    getMentoringSessions(),
  ]);
  // Units sold come from Pesanan (quantities delivered) and Proyek (went live) in the period.
  if (summary && summary.unitsSold + summary.projectsLive.length > 0) computed.unit = summary.unitsSold + summary.projectsLive.length;
  const facts = summary ? factsFrom(summary) : [];
  const drafts = summary ? draftsFrom(summary, computed) : undefined;
  const report = data.reports?.[reportKey] ?? undefined;
  const { targets, actual, overridden } = mergeFigures(report, computed);
  const print = first(sp.cetak) === "1";
  // The mentor is not stored: it follows from the group number and the session (rotation table in the guide).
  const sessionMentors = [0, 1, 2].map((session) => mentorForSession(data.groupNumber, session));
  const currentSession = Math.max(0, Math.min(2, focusIndex - 1));
  const mentorNow = sessionMentors[currentSession];
  const ledgerRows = print
    ? (await Promise.all((reportStage.months ?? []).map((ym) => getLedger({ unit, allowed: user.units, month: new Date(Number(ym.slice(0, 4)), Number(ym.slice(5)) - 1, 1) })))).flatMap((l) => l.rows).sort((a, b) => a.tx.date.localeCompare(b.tx.date))
    : [];

  const rows = REPORT_INDICATORS.map((i) => {
    const t = targets[i.key];
    const a = actual[i.key];
    const pct = t && a !== null ? Math.round((a / t) * 100) : null;
    return {
      key: i.key,
      label: i.label,
      manual: overridden.includes(i.key),
      target: showValue(t, i.money),
      actual: showValue(a, i.money),
      pct: pct === null ? <span className="text-muted">…</span> : <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", pct >= 100 ? "bg-secondary-soft text-secondary-dark" : pct >= 70 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700")}>{pct}%</span>,
    };
  });

  if (print) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href={`/perintis?laporan=${reportKey}`} className={buttonOutline}>Kembali</Link>
          <PrintButton label={`Cetak ${reportStage.form}`} />
        </div>
        <article className="mx-auto max-w-3xl rounded-2xl border border-line bg-white p-8 text-[14px] leading-relaxed text-ink print:max-w-none print:rounded-none print:border-0 print:p-0 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">{reportStage.form}</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Laporan Progress {reportStage.name.replace("Laporan Progress Bulanan ", "Mentoring ")}</h1>
          <p className="text-sm text-muted">{PROGRAM.longName}</p>
          <table className="mt-5 w-full text-sm">
            <tbody>
              {[["Nama kelompok", data.teamName], ["Nama usaha", data.businessName], ["Ketua kelompok", data.leader], ["Periode laporan", reportStage.months?.map((m) => formatDate(`${m}-01`).replace(/^\d+ /, "")).join(" sampai ")], ["Mentor pendamping", sessionMentors[reportStages.indexOf(reportStage)]?.name]].map(([k, v]) => (
                <tr key={k} className="border-t border-line">
                  <td className="w-44 py-1.5 pr-3 text-muted">{k}</td>
                  <td className="py-1.5 font-semibold">{v || "…"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h2 className="mt-8 text-base font-bold">A. Ringkasan kinerja periode ini</h2>
          <table className="mt-2 w-full text-sm">
            <thead><tr className="text-left text-xs text-muted"><th className="pb-1 font-medium">Indikator</th><th className="pb-1 text-right font-medium">Target awal</th><th className="pb-1 text-right font-medium">Realisasi</th></tr></thead>
            <tbody>
              {REPORT_INDICATORS.map((i) => (
                <tr key={i.key} className="border-t border-line"><td className="py-1.5 pr-3">{i.label}</td><td className="py-1.5 text-right tabular-nums">{showValue(targets[i.key], i.money)}</td><td className="py-1.5 text-right font-semibold tabular-nums">{showValue(actual[i.key], i.money)}</td></tr>
              ))}
            </tbody>
          </table>
          <h2 className="mt-8 text-base font-bold">B. Catatan arus kas</h2>
          {ledgerRows.length === 0 ? (
            <p className="mt-1 text-sm text-muted">Belum ada transaksi di periode ini.</p>
          ) : (
            <table className="mt-2 w-full text-sm">
              <thead><tr className="text-left text-xs text-muted"><th className="pb-1 font-medium">Tanggal</th><th className="pb-1 font-medium">Keterangan</th><th className="pb-1 font-medium">Masuk / keluar</th><th className="pb-1 text-right font-medium">Jumlah</th></tr></thead>
              <tbody>
                {ledgerRows.map(({ tx }) => (
                  <tr key={tx.id} className="border-t border-line"><td className="py-1 pr-3 whitespace-nowrap">{formatDate(tx.date)}</td><td className="py-1 pr-3">{tx.reference || tx.category}</td><td className="py-1 pr-3">{tx.type === "masuk" ? "Masuk" : "Keluar"}</td><td className="py-1 text-right tabular-nums">{formatIDR(tx.amount)}</td></tr>
                ))}
                <tr className="border-t-2 border-ink font-bold"><td className="py-1.5" colSpan={3}>Saldo kas akhir</td><td className="py-1.5 text-right tabular-nums">{showValue(actual.saldo, true)}</td></tr>
              </tbody>
            </table>
          )}
          <h2 className="mt-8 text-base font-bold">C. Evaluasi dan refleksi</h2>
          {REFLECTIONS.filter((r) => r.key !== "innovation").map((r) => (
            <div key={r.key} className="mt-3 break-inside-avoid">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">{r.label}</p>
              {report?.[r.key] ? <MarkdownLite text={report[r.key]!} /> : <p className="text-muted">…</p>}
            </div>
          ))}
          <h2 className="mt-8 text-base font-bold">D. Inovasi atau strategi yang dilakukan</h2>
          {report?.innovation ? <MarkdownLite text={report.innovation} /> : <p className="text-muted">…</p>}
          <h2 className="mt-8 text-base font-bold">E. Dokumentasi kegiatan</h2>
          <p className="text-sm text-muted">Minimal tiga foto kegiatan usaha periode ini, dikirim terpisah lewat WhatsApp atau Google Drive. Foto acara di Kalender bisa dipakai.</p>
          <h2 className="mt-8 text-base font-bold">F. Lampiran bukti transaksi</h2>
          <p className="text-sm text-muted">Bukti transaksi ada di Arus Kas Hub; unduh yang berbukti untuk dilampirkan.</p>
        </article>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner: the programme, the team, and how long until the next stage. */}
      <section className="relative overflow-hidden rounded-3xl bg-navy text-white">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -right-24 -top-32 size-[28rem] rounded-full bg-primary/40 blur-3xl motion-safe:animate-drift" />
          <div className="absolute -bottom-40 -left-24 size-[24rem] rounded-full bg-secondary/25 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:22px_22px] [mask-image:linear-gradient(to_right,black,transparent_75%)]" />
          <Trophy className="absolute -bottom-10 right-4 size-56 rotate-12 text-white/[0.05]" />
        </div>
        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 motion-safe:animate-rise">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ring-1 ring-white/15">
                <span className="relative flex size-2">
                  <span className="absolute inset-0 rounded-full bg-secondary motion-safe:animate-ping" />
                  <span className="relative size-2 rounded-full bg-secondary" />
                </span>
                Program berjalan
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-navy-accent">{PROGRAM.name} · {PROGRAM.organizer}</span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight motion-safe:animate-rise sm:text-4xl lg:text-5xl" style={delay(0.08)}>Kelompok {data.teamName ?? "Zynergy"}</h1>
            <p className="mt-2 max-w-xl text-navy-ink motion-safe:animate-rise" style={delay(0.16)}>{data.businessName ? `${data.businessName} · ` : ""}{PROGRAM.longName}</p>
            <dl className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {[["Ketua", data.leader ?? "…"], ["Mentor saat ini", mentorNow?.name ?? "Belum diisi"], ["Kelompok", data.groupNumber ? `Nomor ${data.groupNumber}` : "Belum diisi"], ["Modal awal", formatIDR(PROGRAM.capital)]].map(([k, v], i) => (
                <div key={k} className="rounded-xl bg-white/[0.07] px-3 py-2.5 ring-1 ring-white/10 backdrop-blur motion-safe:animate-rise" style={delay(0.24 + 0.06 * i)}>
                  <dt className="text-[11px] uppercase tracking-wider text-navy-ink">{k}</dt>
                  <dd className="mt-0.5 font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 motion-safe:animate-rise" style={delay(0.5)}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs text-navy-ink">
                <span>Hari ke-{progress.day} dari {progress.days} hari program</span>
                <span className="font-bold text-white">{Math.round(progress.fraction * 100)}% berjalan</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full origin-left rounded-full bg-gradient-to-r from-secondary to-navy-accent motion-safe:animate-grow" style={{ width: `${Math.max(1, progress.fraction * 100)}%`, ...delay(0.6) }} />
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white/[0.08] p-5 ring-1 ring-white/10 backdrop-blur motion-safe:animate-rise lg:col-span-2" style={delay(0.3)}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-navy-ink">Berikutnya · Tahap {focus.stage.order}</p>
                <p className="mt-1 text-lg font-bold leading-snug">{focus.stage.short}</p>
                <p className="text-sm text-navy-ink">{formatDate(focus.stage.date)}</p>
              </div>
              <div className="relative size-16 shrink-0" title="Perjalanan menuju tahap berikutnya">
                <svg viewBox="0 0 64 64" className="size-16 -rotate-90" aria-hidden>
                  <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                  <circle cx="32" cy="32" r="26" fill="none" stroke="var(--color-secondary)" strokeWidth="6" strokeLinecap="round" strokeDasharray={RING} strokeDashoffset={RING * (1 - segment)} className="motion-safe:animate-ring" style={{ "--ring-len": RING, ...delay(0.5) } as React.CSSProperties} />
                </svg>
                <span className="absolute inset-0 grid place-items-center text-xs font-bold tabular-nums">{Math.round(segment * 100)}%</span>
              </div>
            </div>
            <p className="mt-4 text-5xl font-extrabold tracking-tight tabular-nums">{focus.daysLeft <= 0 ? "Hari ini" : focus.daysLeft}</p>
            {focus.daysLeft > 0 && <p className="text-sm text-navy-ink">hari lagi</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <a href="#laporan" className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-navy transition hover:bg-navy-ink/90">{editable ? "Isi laporan" : "Lihat laporan"}</a>
              {focus.stage.months && (
                <Link href={`/perintis?laporan=${focus.stage.key}&cetak=1`} className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/10">
                  <Printer className="size-4" />
                  Cetak {focus.stage.form}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <Card title="Lima tahap" className="min-w-0">
        <p className="-mt-2 mb-5 text-xs text-muted">{done} dari {STAGES.length} tahap selesai. Garis hijau berhenti di hari ini, bukan di tahap berikutnya.</p>
        <Roadmap items={statuses} today={today} />
      </Card>

      {/* Report */}
      <Card id="laporan" title={`${reportStage.name} · ${reportStage.form}`} className="min-w-0 scroll-mt-20">
        <div className="-mt-2 mb-4 flex flex-wrap items-center justify-between gap-3">
          <SegmentedLinks ariaLabel="Laporan" segments={reportStages.map((s) => ({ label: s.short.replace("Laporan Progress ", "Laporan "), href: `/perintis?laporan=${s.key}`, active: s.key === reportKey }))} />
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", report?.submittedAt ? "bg-secondary-soft text-secondary-dark" : reportStatus.status === "selesai" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700")}>
              {report?.submittedAt ? `Dikirim ${formatDate(report.submittedAt)}` : reportStatus.status === "selesai" ? "Belum dikirim, sudah lewat" : `Kirim paling lambat ${formatDate(reportDueDate(reportStage))}`}
            </span>
            <Link href={`/perintis?laporan=${reportKey}&cetak=1`} className={buttonOutline}>
              <Printer className="size-4" />
              Cetak {reportStage.form}
            </Link>
          </div>
        </div>
        <p className="mb-3 text-xs text-muted">
          Realisasi dihitung dari Arus Kas unit {unit === "semua" ? "semua" : (unitLabel.get(unit as Unit) ?? unit)} untuk periode {reportStage.months?.map((m) => formatDate(`${m}-01`).replace(/^\d+ /, "")).join(" sampai ")}. Angka yang diisi manual mengalahkan hitungan{overridden.length ? ` (${overridden.length} indikator diisi manual)` : ""}.
        </p>
        {facts.length > 0 && (
          <ul className="mb-4 flex flex-wrap items-center gap-1.5 text-xs">
            <li className="font-bold uppercase tracking-wider text-muted">Dari Hub periode ini</li>
            {facts.map((f) => (
              <li key={f} className="rounded-full bg-surface-soft px-2.5 py-1 font-medium">{f}</li>
            ))}
          </ul>
        )}
        <ul className="divide-y divide-line sm:hidden">
          {rows.map((r) => (
            <li key={r.key} className="py-2.5">
              <p className="text-sm font-semibold">{r.label}{r.manual && <span className="ml-1 text-[10px] font-bold uppercase text-muted">manual</span>}</p>
              <div className="mt-1 grid grid-cols-3 gap-2 text-xs">
                <div><p className="text-muted">Target</p><p className="tabular-nums">{r.target}</p></div>
                <div><p className="text-muted">Realisasi</p><p className="font-semibold tabular-nums">{r.actual}</p></div>
                <div><p className="text-muted">Capaian</p><p>{r.pct}</p></div>
              </div>
            </li>
          ))}
        </ul>
        <table className="hidden w-full text-sm sm:table">
          <thead><tr className="text-left text-xs text-muted"><th className="pb-2 pr-3 font-medium">Indikator</th><th className="pb-2 pr-3 text-right font-medium">Target awal</th><th className="pb-2 pr-3 text-right font-medium">Realisasi</th><th className="pb-2 text-right font-medium">Capaian</th></tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.key}>
                <td className="py-2 pr-3">{r.label}{r.manual && <span className="ml-1 text-[10px] font-bold uppercase text-muted">manual</span>}</td>
                <td className="py-2 pr-3 text-right tabular-nums text-muted">{r.target}</td>
                <td className="py-2 pr-3 text-right font-semibold tabular-nums">{r.actual}</td>
                <td className="py-2 text-right tabular-nums">{r.pct}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {REFLECTIONS.map((r) => (
            <div key={r.key} className={r.key === "innovation" ? "sm:col-span-2" : undefined}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{r.label}</p>
              {report?.[r.key] ? <MarkdownLite text={report[r.key]!} /> : <p className="text-sm text-muted">Belum diisi.</p>}
            </div>
          ))}
        </div>
        {editable && (
          <details className="mt-4 rounded-xl border border-line">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold">Isi target, realisasi manual, dan refleksi</summary>
            <p className="-mt-1 px-4 pb-3 text-xs text-muted">Realisasi angka sudah dihitung dari Arus Kas, Pesanan, dan Proyek. Tombol Isi dari Hub menyusun draf refleksi dari musyawarah, tindak lanjut, konten, klien, dan prospek periode ini.</p>
            <div className="border-t border-line p-4">
              <ReportForm reportKey={reportKey} data={report} computed={computed} previous={previous} drafts={drafts} />
            </div>
          </details>
        )}
      </Card>

      {/* Mentoring: our mentor per session, the guide's monthly agenda, the sessions logged in Kalender, and the full rotation folded away. */}
      <Card title="Mentoring" className="min-w-0">
        <div className="-mt-1 mb-5 grid gap-2 sm:grid-cols-3">
          {reportStages.map((stage, i) => {
            const m = sessionMentors[i];
            const state = statuses.find((st) => st.stage.key === stage.key)!;
            return (
              <div key={stage.key} className={cn("rounded-xl border p-3", state.status === "fokus" ? "border-primary bg-primary-soft" : "border-line")}>
                <p className={cn("text-[11px] font-bold uppercase tracking-wider", state.status === "fokus" ? "text-primary" : "text-muted")}>
                  Sesi {SESSION_NUMERALS[i]} · {formatDate(stage.date).replace(/ \d{4}$/, "")}{state.status === "selesai" ? " · selesai" : state.status === "fokus" ? " · berikutnya" : ""}
                </p>
                <p className="mt-1 font-bold">{m?.name ?? "Isi nomor kelompok"}</p>
                <p className="text-xs text-muted">{m ? m.field : "di Data kelompok"}</p>
              </div>
            );
          })}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs text-muted">Agenda per bulan dari petunjuk teknis. Tanggal pastinya disepakati dengan mentor, lalu dicatat sebagai acara Mentoring di Kalender.</p>
            <ol className="divide-y divide-line">
              {MENTOR_AGENDA.map((m) => {
                const current = m.month === today.slice(0, 7);
                return (
                  <li key={m.month} className={cn("flex gap-3 py-2.5", current && "-mx-2 rounded-lg bg-primary-soft px-2")}>
                    <span className={cn("w-16 shrink-0 text-xs font-bold uppercase tracking-wider", current ? "text-primary" : "text-muted")}>{formatMonthLong(new Date(`${m.month}-01T00:00:00+07:00`)).replace(/ \d{4}$/, "")}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{m.agenda}</p>
                      <p className="text-xs text-muted">{m.how}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted">Sesi yang sudah dicatat tim, dengan catatan dan tindak lanjutnya.</p>
              {editable && (
                <Link href="/calendar/new?jenis=mentoring" className={buttonOutline}>
                  <CalendarPlus className="size-4" />
                  Jadwalkan mentoring
                </Link>
              )}
            </div>
            {sessions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">Belum ada sesi mentoring di Kalender. Setelah tanggal disepakati dengan {mentorNow?.name ?? "mentor"}, jadwalkan di sini; catatan dan tindak lanjutnya nanti ikut masuk ke draf laporan.</p>
            ) : (
              <ul className="divide-y divide-line">
                {sessions.map((s) => (
                  <li key={s.id} className="py-2.5">
                    <Link href={`/calendar/${s.id}`} className="text-sm font-semibold hover:text-primary">{s.title}</Link>
                    <p className="text-xs text-muted">{formatDate(s.date)} {s.time}{s.done + s.open > 0 ? ` · ${s.done} dari ${s.done + s.open} tindak lanjut selesai` : ""}</p>
                    {s.notes && <p className="mt-1 line-clamp-2 text-xs text-ink/80">{s.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted">Lima tahap dan tenggat FORM-04 sudah tampil otomatis di <Link href="/calendar" className="font-semibold text-primary hover:underline">Kalender</Link> (lapisan PERINTIS) dan di feed kalender HP.</p>
          </div>
        </div>
        <details className="mt-4 rounded-xl border border-line">
          <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-semibold">Lihat rotasi semua kelompok</summary>
          <div className="overflow-x-auto border-t border-line p-4">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted"><th className="pb-2 pr-3 font-medium">Mentor</th><th className="hidden pb-2 pr-3 font-medium sm:table-cell">Bidang</th><th className="pb-2 pr-3 font-medium">Sesi I</th><th className="pb-2 pr-3 font-medium">Sesi II</th><th className="pb-2 font-medium">Sesi III</th></tr></thead>
              <tbody className="divide-y divide-line">
                {MENTORS.map((m) => (
                  <tr key={m.name}>
                    <td className="py-2 pr-3 font-semibold">{m.name}</td>
                    <td className="hidden py-2 pr-3 text-muted sm:table-cell">{m.field}</td>
                    {m.groups.map((g, i) => {
                      const mine = data.groupNumber ? g.includes(data.groupNumber) : false;
                      return <td key={i} className={cn("py-2 pr-3 tabular-nums", mine && "font-bold text-primary")}>{g.join(", ")}{mine && <span className="ml-1.5 rounded-full bg-primary-soft px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">kami</span>}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-muted">Sembilan kelompok, tiga mentor bergilir; setiap kelompok bertemu ketiga mentor minimal sekali.</p>
          </div>
        </details>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Bobot penilaian" className="min-w-0">
          <div className="flex h-4 overflow-hidden rounded-full">
            {WEIGHTS.map((w, i) => (
              <span key={w.label} className={cn("h-full", weightTone[i])} style={{ width: `${w.value}%` }} title={`${w.label} ${w.value}%`} />
            ))}
          </div>
          <ul className="mt-3 grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
            {WEIGHTS.map((w, i) => (
              <li key={w.label} className="flex items-center gap-2">
                <span className={cn("size-2.5 rounded-full", weightTone[i])} aria-hidden />
                <span className="flex-1">{w.label}</span>
                <span className="font-bold tabular-nums">{w.value}%</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Kinerja bisnis nyata (omzet, laba, pertumbuhan bulanan, ROI) adalah bobot terbesar. Setiap transaksi yang tercatat rapi di Arus Kas ikut menaikkannya.</p>
        </Card>
        <Card title="Rubrik presentasi final" className="min-w-0">
          <ul className="divide-y divide-line">
            {FINAL_RUBRIC.map((r) => (
              <li key={r.aspect} className="flex items-center gap-3 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{r.aspect}</p>
                  <p className="truncate text-xs text-muted">{r.detail}</p>
                </div>
                <span className="shrink-0 font-extrabold tabular-nums">{r.max}</span>
              </li>
            ))}
          </ul>
          <ul className="mt-3 space-y-1 text-xs text-muted">
            {FINAL_TIPS.map((t) => (
              <li key={t}>· {t}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Hadiah" className="min-w-0">
          <ul className="grid gap-2 sm:grid-cols-3">
            {PRIZES.map((p, i) => (
              <li key={p.place} className={cn("rounded-xl p-3 ring-1", medal[i].card)}>
                <Trophy className={cn("size-4", medal[i].icon)} aria-hidden />
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted">{p.place}</p>
                <p className="text-base font-extrabold">{formatIDR(p.amount)}</p>
                <p className="text-xs text-muted">{p.extra}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Semua kelompok yang menyelesaikan program mendapat sertifikat dan merchandise.</p>
        </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Aturan main" className="min-w-0">
          <ul className="divide-y divide-line">
            {RULES.map((r) => (
              <li key={r.title} className="py-2.5">
                <p className="text-sm font-semibold">{r.title}</p>
                <p className="text-xs text-muted">{r.detail}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Sanksi" className="min-w-0">
          <ul className="divide-y divide-line">
            {SANCTIONS.map((s) => (
              <li key={s.violation} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span>{s.violation}</span>
                <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700">{s.sanction}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Mengundurkan diri hanya karena force majeure, diberitahukan tertulis minimal 7 hari sebelumnya; modal yang belum terpakai dikembalikan.</p>
        </Card>
      </div>

      {editable && (
        <Card title="Data kelompok">
          <TeamForm data={data} />
        </Card>
      )}
      <p className="text-xs text-muted">
        Sumber: Petunjuk Teknis Lomba PERINTIS Cilandak 2026 dan FORM-04.1. Berkas aslinya bisa disimpan di <Link href="/vault" className="font-semibold text-primary hover:underline">Brankas Dokumen</Link>.
        <ExternalLink className="ml-1 inline size-3 align-[-2px]" aria-hidden />
      </p>
    </div>
  );
}
