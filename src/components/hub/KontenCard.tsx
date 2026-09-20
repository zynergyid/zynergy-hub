import Link from "next/link";
import type { HubEvent } from "@/payload-types";
import { contentPlatformLabel, contentStatusLabel, contentStatuses } from "@/lib/options";
import { dateKeyWib, formatDayShort, todayWib } from "@/lib/calendar-dates";
import { cn } from "@/lib/cn";
import { Card } from "./Card";

const relId = (v: number | { id: number } | null | undefined) => (typeof v === "object" && v ? v.id : (v ?? null));
const statusTone: Record<string, string> = { ide: "bg-surface-soft text-muted", draf: "bg-amber-50 text-amber-700", siap: "bg-secondary-soft text-secondary-dark", tayang: "bg-primary-soft text-primary-dark" };

/** Dashboard card for designers and marketing: what is due to go out, the person's own posts first. */
export function KontenCard({ events, userId }: { events: HubEvent[]; userId: number }) {
  const today = todayWib();
  const mine = (e: HubEvent) => (e.participants ?? []).some((p) => relId(p) === userId);
  const open = events.filter((e) => e.content?.status !== "tayang");
  const counts = contentStatuses.map((s) => ({ ...s, n: events.filter((e) => (e.content?.status ?? "ide") === s.value).length }));
  const rows = [...open].sort((a, b) => Number(mine(b)) - Number(mine(a)) || a.startAt.localeCompare(b.startAt)).slice(0, 6);
  return (
    <Card title="Konten" action={{ label: "Kalender konten", href: "/calendar?lapisan=konten" }}>
      <dl className="grid grid-cols-4 gap-2 text-xs">
        {counts.map((c) => (
          <div key={c.value} className="rounded-xl bg-surface-soft p-2.5">
            <dt className="text-muted">{c.label}</dt>
            <dd className="mt-0.5 text-base font-extrabold">{c.n}</dd>
          </div>
        ))}
      </dl>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Tidak ada unggahan yang direncanakan tiga minggu ke depan. Tambah dari Kalender, jenis Konten.</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {rows.map((e) => {
            const key = dateKeyWib(e.startAt);
            const status = e.content?.status ?? "ide";
            return (
              <li key={e.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className={cn("w-20 shrink-0 text-xs", key < today ? "font-semibold text-red-600" : "text-muted")}>{key === today ? "Hari ini" : formatDayShort(key)}</span>
                {typeof e.photo === "object" && e.photo?.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.photo.url} alt="" className="size-9 shrink-0 rounded-lg border border-line object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <Link href={`/calendar/${e.id}`} className="block truncate font-semibold hover:text-primary">{e.title}</Link>
                  <p className="truncate text-xs text-muted">
                    {contentPlatformLabel.get(e.content?.platform ?? "") ?? "platform belum dipilih"}
                    {mine(e) ? " · milik saya" : ""}
                  </p>
                </div>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold", statusTone[status])}>{contentStatusLabel.get(status)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
