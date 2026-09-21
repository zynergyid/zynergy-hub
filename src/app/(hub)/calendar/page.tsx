import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { canEditTeam, getSessionUser } from "@/lib/session";
import { calendarLayers, getCalendarItems, getEventFormOptions, isLayer, layerOf, type CalendarItem, type CalendarLayer } from "@/lib/calendar";
import { currentMonth, formatDayLong, isMonthKey, monthLabel, monthRange, shiftMonth, todayWib } from "@/lib/calendar-dates";
import { buildHref, first, type Search } from "@/lib/search";
import { contentStatuses } from "@/lib/options";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/hub/EmptyState";
import { PageHeader } from "@/components/hub/PageHeader";
import { SegmentedLinks } from "@/components/hub/SegmentedLinks";
import { buttonPrimary } from "@/components/hub/form";
import { MobileMonth } from "./MobileMonth";
import { MonthGrid } from "./MonthGrid";
import { QuickAddProvider, QuickAddTrigger } from "./QuickAdd";

export const metadata: Metadata = { title: "Kalender" };
export const dynamic = "force-dynamic";

function ListView({ items, month, today, canAdd }: { items: CalendarItem[]; month: string; today: string; canAdd: boolean }) {
  if (items.length === 0) return <EmptyState title="Tidak ada jadwal bulan ini." hint={canAdd ? "Tekan Tambah acara, atau isi target di Proyek dan tindak lanjut di Outreach." : undefined} />;
  const days = [...new Set(items.map((i) => i.date))];
  return (
    <div className="space-y-4">
      {days.map((d) => (
        <section key={d} id={`d-${d}`} className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,27,51,0.04)]">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className={cn("text-sm font-bold", d === today && "text-primary")}>{d === today ? `Hari ini, ${formatDayLong(d)}` : formatDayLong(d)}</h2>
            {canAdd && <QuickAddTrigger date={d} className="text-xs font-semibold text-primary hover:underline">Tambah</QuickAddTrigger>}
          </div>
          <ul className="divide-y divide-line">
            {items.filter((i) => i.date === d).map((it) => (
              <li key={it.id} className="flex items-center gap-3 py-2 text-sm">
                <span className={cn("size-2 shrink-0 rounded-full", layerOf(it.layer).dot)} aria-hidden />
                <span className="w-12 shrink-0 text-xs text-muted">{it.time ?? ""}</span>
                {it.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.photoUrl} alt="" className="size-10 shrink-0 rounded-lg border border-line object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <Link href={it.href} className="block truncate font-semibold hover:text-primary">{it.title}</Link>
                  {it.detail && <p className="truncate text-xs text-muted">{it.detail}</p>}
                </div>
                <span className={cn("hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold sm:inline", layerOf(it.layer).chip)}>{layerOf(it.layer).label}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-xs text-muted">Bulan {monthLabel(month)}. Tanggal dari Proyek, Outreach, Pesanan, dan Klien tampil otomatis; ubah di halamannya masing-masing.</p>
    </div>
  );
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const sp = await searchParams;
  const month = isMonthKey(first(sp.bulan)) ? first(sp.bulan)! : currentMonth();
  const view = first(sp.tampilan) === "daftar" ? "daftar" : "bulan";
  const chosen = (first(sp.lapisan) ?? "").split(",").filter(isLayer);
  const layers = new Set<CalendarLayer>(chosen.length ? chosen : calendarLayers.map((l) => l.value));
  const { from, to } = monthRange(month);
  const status = contentStatuses.find((s) => s.value === first(sp.status))?.value;
  const all = await getCalendarItems({ from, to, user, layers });
  // The status filter narrows content posts only; other layers stay as they are.
  const items = status ? all.filter((it) => it.layer !== "konten" || it.status === status) : all;
  const today = todayWib();
  const canAdd = canEditTeam(user);
  const options = canAdd ? await getEventFormOptions(user) : null;
  const base: Search = { bulan: month, tampilan: view === "daftar" ? "daftar" : undefined, lapisan: chosen.length ? chosen.join(",") : undefined, status };
  const toggleLayer = (l: CalendarLayer) => {
    const next = layers.has(l) ? [...layers].filter((x) => x !== l) : [...layers, l];
    const all = next.length === calendarLayers.length || next.length === 0;
    return buildHref("/calendar", base, { lapisan: all ? undefined : next.join(",") });
  };
  const listHref = buildHref("/calendar", base, { tampilan: "daftar" });

  return (
    <QuickAddProvider options={options} currentUserId={user.id} enabled={canAdd}>
    <div className="space-y-5">
      <PageHeader title="Kalender" subtitle="Satu tampilan untuk musyawarah tim, meeting klien, konten, target proyek, tindak lanjut outreach, tenggat PO, dan perpanjangan klien.">
        <SegmentedLinks ariaLabel="Tampilan" segments={[{ label: "Bulan", href: buildHref("/calendar", base, { tampilan: undefined }), active: view === "bulan" }, { label: "Daftar", href: listHref, active: view === "daftar" }]} />
        {canAdd && (
          <QuickAddTrigger date={month === today.slice(0, 7) ? today : `${month}-01`} className={buttonPrimary}>
            <Plus className="size-4" />
            Tambah acara
          </QuickAddTrigger>
        )}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-1 rounded-xl border border-line bg-white p-1">
          <Link href={buildHref("/calendar", base, { bulan: shiftMonth(month, -1) })} aria-label="Bulan sebelumnya" className="rounded-lg p-1.5 text-muted hover:bg-surface-soft hover:text-ink">
            <ChevronLeft className="size-4" />
          </Link>
          <span className="min-w-[9rem] text-center text-sm font-bold">{monthLabel(month)}</span>
          <Link href={buildHref("/calendar", base, { bulan: shiftMonth(month, 1) })} aria-label="Bulan berikutnya" className="rounded-lg p-1.5 text-muted hover:bg-surface-soft hover:text-ink">
            <ChevronRight className="size-4" />
          </Link>
        </div>
        {month !== today.slice(0, 7) && (
          <Link href={buildHref("/calendar", base, { bulan: undefined })} className="text-sm font-semibold text-primary hover:underline">Bulan ini</Link>
        )}
        <div className="flex flex-wrap gap-1.5" aria-label="Lapisan">
          {calendarLayers.map((l) => {
            const on = layers.has(l.value);
            return (
              <Link key={l.value} href={toggleLayer(l.value)} className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", on ? cn("border-transparent", l.chip) : "border-line bg-white text-muted")}>
                <span className={cn("size-2 rounded-full", on ? l.dot : "bg-line")} aria-hidden />
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
      {layers.has("konten") && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs" aria-label="Status konten">
          <span className="text-muted">Konten:</span>
          <Link href={buildHref("/calendar", base, { status: undefined })} className={cn("rounded-full border px-2.5 py-1 font-semibold", !status ? "border-transparent bg-ink text-white" : "border-line bg-white text-muted")}>Semua status</Link>
          {contentStatuses.map((s) => (
            <Link key={s.value} href={buildHref("/calendar", base, { status: s.value })} className={cn("rounded-full border px-2.5 py-1 font-semibold", status === s.value ? "border-transparent bg-ink text-white" : "border-line bg-white text-muted")}>
              {s.label}
            </Link>
          ))}
        </div>
      )}

      {/* Phones get a compact grid with dots and a tapped-day list; wider screens the full grid. */}
      <div className="md:hidden">
        {view === "bulan" ? <MobileMonth items={items} month={month} today={today} /> : <ListView items={items} month={month} today={today} canAdd={canAdd} />}
      </div>
      <div className="hidden md:block">
        {view === "bulan" ? <MonthGrid items={items} month={month} today={today} listHref={listHref} /> : <ListView items={items} month={month} today={today} canAdd={canAdd} />}
      </div>
    </div>
    </QuickAddProvider>
  );
}
