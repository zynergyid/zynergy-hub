"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { layerOf, type CalendarItem } from "@/lib/calendar-types";
import { WEEKDAYS, formatDayLong, monthGrid } from "@/lib/calendar-dates";
import { QuickAddTrigger } from "./QuickAdd";

/**
 * Phone month view, Google Calendar style: a compact grid with one dot per
 * layer on each day, and the tapped day's items listed underneath.
 */
export function MobileMonth({ items, month, today }: { items: CalendarItem[]; month: string; today: string }) {
  const byDay = new Map<string, CalendarItem[]>();
  for (const it of items) byDay.set(it.date, [...(byDay.get(it.date) ?? []), it]);
  const firstWithItems = [...byDay.keys()].sort()[0];
  const [selected, setSelected] = useState<string>(today.startsWith(month) ? today : (firstWithItems ?? `${month}-01`));
  const dayItems = byDay.get(selected) ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-white p-2 shadow-[0_1px_2px_rgba(15,27,51,0.04)]">
        <div className="grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-wider text-muted">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1">{w}</div>
          ))}
        </div>
        {monthGrid(month).map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((key) => {
              const inMonth = key.startsWith(month);
              const layers = [...new Set((byDay.get(key) ?? []).map((it) => it.layer))];
              const active = key === selected;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!inMonth}
                  onClick={() => setSelected(key)}
                  aria-label={formatDayLong(key)}
                  aria-pressed={active}
                  className={cn("flex h-12 flex-col items-center justify-start gap-1 rounded-xl pt-1.5 text-sm", !inMonth && "text-line", inMonth && !active && "hover:bg-surface-soft", active && "bg-primary-soft")}
                >
                  <span className={cn("grid size-7 place-items-center rounded-full font-semibold", key === today && "bg-primary text-white", key !== today && active && "text-primary-dark")}>{Number(key.slice(8))}</span>
                  <span className="flex h-1.5 gap-0.5">
                    {layers.slice(0, 4).map((l) => (
                      <span key={l} className={cn("size-1.5 rounded-full", layerOf(l).dot)} aria-hidden />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,27,51,0.04)]">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className={cn("text-sm font-bold", selected === today && "text-primary")}>{selected === today ? `Hari ini, ${formatDayLong(selected)}` : formatDayLong(selected)}</h2>
          <QuickAddTrigger date={selected} className="text-xs font-semibold text-primary hover:underline">Tambah</QuickAddTrigger>
        </div>
        {dayItems.length === 0 ? (
          <p className="text-sm text-muted">Tidak ada jadwal.</p>
        ) : (
          <ul className="divide-y divide-line">
            {dayItems.map((it) => (
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
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
