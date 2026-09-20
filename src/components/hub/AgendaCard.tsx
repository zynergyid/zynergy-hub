import Link from "next/link";
import { calendarLayers, type CalendarItem, type FollowUp } from "@/lib/calendar";
import { formatDayShort, todayWib } from "@/lib/calendar-dates";
import { cn } from "@/lib/cn";
import { Card } from "./Card";
import { FollowUpRow } from "@/app/(hub)/calendar/FollowUpsCard";

const layerOf = (v: CalendarItem["layer"]) => calendarLayers.find((l) => l.value === v)!;

/** Dashboard: the coming week from every module, and the person's own open follow-ups. */
export function AgendaCard({ items, followUps, editable }: { items: CalendarItem[]; followUps: FollowUp[]; editable: boolean }) {
  const today = todayWib();
  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card title="Minggu ini" action={{ label: "Kalender", href: "/calendar" }} className="min-w-0 lg:col-span-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted">Tidak ada jadwal tujuh hari ke depan.</p>
        ) : (
          <ul className="divide-y divide-line">
            {items.slice(0, 8).map((it) => (
              <li key={it.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className={cn("size-2 shrink-0 rounded-full", layerOf(it.layer).dot)} aria-hidden />
                <span className="w-24 shrink-0 text-xs text-muted">{it.date === today ? "Hari ini" : formatDayShort(it.date)}{it.time ? `, ${it.time}` : ""}</span>
                <div className="min-w-0 flex-1">
                  <Link href={it.href} className="block truncate font-semibold hover:text-primary">{it.title}</Link>
                  {it.detail && <p className="truncate text-xs text-muted">{it.detail}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="Tindak lanjut saya" className="min-w-0 lg:col-span-2">
        {followUps.length === 0 ? (
          <p className="text-sm text-muted">Tidak ada yang tertunda dari musyawarah.</p>
        ) : (
          <ul className="divide-y divide-line">
            {followUps.slice(0, 6).map((f) => (
              <FollowUpRow key={`${f.eventId}-${f.rowId}`} eventId={f.eventId} rowId={f.rowId} text={f.text} ownerName={null} dueAt={f.dueAt} doneAt={f.doneAt} editable={editable} returnTo="/" context={f.eventTitle} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
