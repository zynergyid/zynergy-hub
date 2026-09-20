import Link from "next/link";
import { Camera } from "lucide-react";
import type { HubEvent } from "@/payload-types";
import { eventKindLabel } from "@/lib/options";
import { dateKeyWib, formatDayShort, timeWib } from "@/lib/calendar-dates";
import { Card } from "./Card";

/** Events tied to one project, client, or target, for their detail pages. */
export function EventsCard({ events, newHref, title = "Jadwal" }: { events: HubEvent[]; newHref?: string; title?: string }) {
  return (
    <Card title={title} action={newHref ? { label: "Tambah acara", href: newHref } : undefined}>
      {events.length === 0 ? (
        <p className="text-sm text-muted">Belum ada acara. Meeting klien dan musyawarah soal ini dicatat di Kalender.</p>
      ) : (
        <ul className="divide-y divide-line">
          {events.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0">
                <Link href={`/calendar/${e.id}`} className="block truncate font-semibold hover:text-primary">
                  {e.photo ? <Camera className="mr-1 inline size-3.5 align-[-2px] text-muted" aria-label="Ada foto" /> : null}
                  {e.title}
                </Link>
                <p className="truncate text-xs text-muted">
                  {formatDayShort(dateKeyWib(e.startAt))}, {timeWib(e.startAt)} · {eventKindLabel.get(e.kind)}
                  {e.notes ? " · ada catatan" : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
