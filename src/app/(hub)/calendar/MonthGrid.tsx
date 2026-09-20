"use client";

import Link from "next/link";
import { Camera } from "lucide-react";
import { cn } from "@/lib/cn";
import { layerOf, type CalendarItem } from "@/lib/calendar-types";
import { WEEKDAYS, monthGrid } from "@/lib/calendar-dates";
import { useQuickAdd } from "./QuickAdd";

function Item({ it }: { it: CalendarItem }) {
  return (
    <Link href={it.href} onClick={(e) => e.stopPropagation()} title={`${it.title}${it.detail ? `: ${it.detail}` : ""}`} className={cn("block truncate rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-tight", layerOf(it.layer).chip)}>
      {it.photoUrl && <Camera className="mr-0.5 inline size-3 align-[-2px]" aria-label="Ada foto" />}
      {it.time ? `${it.time} ` : ""}
      {it.title}
    </Link>
  );
}

/** Month grid; the whole day cell opens the quick-add dialog, items inside still open their own page. */
export function MonthGrid({ items, month, today, listHref }: { items: CalendarItem[]; month: string; today: string; listHref: string }) {
  const { open, enabled } = useQuickAdd();
  const byDay = new Map<string, CalendarItem[]>();
  for (const it of items) byDay.set(it.date, [...(byDay.get(it.date) ?? []), it]);
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,27,51,0.04)]">
      <div className="min-w-[44rem]">
        <div className="grid grid-cols-7 border-b border-line text-center text-[11px] font-bold uppercase tracking-wider text-muted">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-2">{w}</div>
          ))}
        </div>
        {monthGrid(month).map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-line last:border-b-0">
            {week.map((key) => {
              const inMonth = key.startsWith(month);
              const dayItems = byDay.get(key) ?? [];
              const extra = dayItems.length - 3;
              return (
                <div
                  key={key}
                  role={enabled ? "button" : undefined}
                  tabIndex={enabled ? 0 : undefined}
                  aria-label={enabled ? `Tambah acara ${key}` : undefined}
                  onClick={enabled ? () => open(key) : undefined}
                  onKeyDown={enabled ? (e) => (e.key === "Enter" || e.key === " ") && e.target === e.currentTarget && (e.preventDefault(), open(key)) : undefined}
                  className={cn("min-h-[6.5rem] border-r border-line p-1.5 last:border-r-0", !inMonth && "bg-surface-soft/50", enabled && "cursor-pointer hover:bg-primary-soft/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40")}
                >
                  <div className="mb-1">
                    <span className={cn("grid size-6 place-items-center rounded-full text-xs font-semibold", key === today ? "bg-primary text-white" : inMonth ? "text-ink" : "text-muted")}>{Number(key.slice(8))}</span>
                  </div>
                  <div className="space-y-0.5">
                    {dayItems.slice(0, 3).map((it) => (
                      <Item key={it.id} it={it} />
                    ))}
                    {extra > 0 && (
                      <Link href={`${listHref}#d-${key}`} onClick={(e) => e.stopPropagation()} className="block px-1.5 text-[11px] font-semibold text-muted hover:text-primary">
                        +{extra} lagi
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
