import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { StageState } from "@/lib/perintis";

const tone = { selesai: "text-secondary-dark", fokus: "text-amber-700", nanti: "text-muted" } as const;
const word = { selesai: "Selesai", fokus: "Fokus", nanti: "" } as const;
const shortDate = (d: string) => formatDate(d).replace(/ \d{4}$/, "");
const nodeClass = (status: StageState["status"]) =>
  cn(
    "grid size-6 place-items-center rounded-full border-2",
    status === "selesai" && "border-secondary bg-secondary text-white",
    status === "fokus" && "border-amber-400 bg-amber-400",
    status === "nanti" && "border-primary bg-white",
  );
const delay = (s: number) => ({ animationDelay: `${s}s` });
/** Filled part of the track: green with a soft highlight sweeping along it. */
const fillClass = "bg-[linear-gradient(90deg,var(--color-secondary),#6ee7b7,var(--color-secondary))] bg-[length:200%_100%] motion-safe:animate-shine";

/** The five stages as a track whose filled part ends where today falls, not at the next stage. */
export function Roadmap({ items, today }: { items: StageState[]; today: string }) {
  const n = items.length;
  const step = 100 / n;
  const centre = (i: number) => step * (i + 0.5);
  const elapsed = items.reduce((sum, s) => sum + s.toNext, 0);
  const todayPct = centre(0) + step * elapsed;
  const focus = items.find((s) => s.status === "fokus");
  const last = items.findLastIndex((s) => s.toNext > 0);
  const todayLabel = `Hari ini · ${shortDate(today)}`;

  return (
    <>
      {/* Phones: a vertical rail with a "today" stop between the stage just passed and the next one. */}
      <ol className="space-y-0 sm:hidden">
        {items.flatMap((s, i) => {
          const rows = [
            <li key={s.stage.key} className="relative flex gap-3 pb-5 motion-safe:animate-rise" style={delay(0.08 * i)}>
              {i < n - 1 && <span className="absolute left-[11px] top-6 h-[calc(100%-1.5rem)] w-0.5 bg-line" aria-hidden />}
              {i < n - 1 && s.toNext > 0 && <span className={cn("absolute left-[11px] top-6 w-0.5 origin-top motion-safe:animate-grow", fillClass)} style={{ height: `calc((100% - 1.5rem) * ${i === last ? 1 : s.toNext})` }} aria-hidden />}
              <span className="relative z-10 mt-0.5 block size-6 shrink-0">
                {s.status === "fokus" && <span className="absolute inset-0 rounded-full bg-amber-400/60 motion-safe:animate-ping" aria-hidden />}
                <span className={cn("relative", nodeClass(s.status))}>{s.status === "selesai" && <Check className="size-3.5" />}</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-[11px] font-bold uppercase tracking-wider", tone[s.status])}>Tahap {s.stage.order}{word[s.status] ? ` · ${word[s.status]}` : ""}</p>
                <p className="font-semibold">{s.stage.short} <span className="font-normal text-muted">· {formatDate(s.stage.date)}</span></p>
                <p className="text-xs text-muted">{s.stage.weight}% nilai · {s.stage.form}</p>
              </div>
            </li>,
          ];
          if (i === last && focus) {
            rows.push(
              <li key="today" className="relative flex gap-3 pb-5 motion-safe:animate-rise" style={delay(0.08 * i + 0.3)}>
                <span className="absolute left-[11px] top-6 h-[calc(100%-1.5rem)] w-0.5 bg-line" aria-hidden />
                <span className="relative z-10 mx-1 mt-1 size-4 shrink-0 rounded-full border-[3px] border-navy bg-white shadow-[0_0_0_3px_white]" aria-hidden />
                <p className="min-w-0 flex-1 pt-0.5 text-sm font-bold text-navy">{todayLabel}</p>
              </li>,
            );
          }
          return rows;
        })}
      </ol>

      {/* Wider screens: one horizontal track, nodes at the centre of each column. */}
      <div className="hidden sm:block">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {items.map((s, i) => (
            <p key={s.stage.key} className={cn("px-1 text-center text-[11px] font-bold uppercase tracking-wider motion-safe:animate-rise", tone[s.status])} style={delay(0.1 * i)}>
              Tahap {s.stage.order}{word[s.status] ? ` · ${word[s.status]}` : ""}
            </p>
          ))}
        </div>
        <div className="relative mt-3 h-8">
          <span className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-line" style={{ left: `${centre(0)}%`, right: `${centre(0)}%` }} aria-hidden />
          {elapsed > 0 && <span className={cn("absolute top-1/2 h-1 origin-left -translate-y-1/2 rounded-full motion-safe:animate-grow", fillClass)} style={{ left: `${centre(0)}%`, width: `${step * elapsed}%` }} aria-hidden />}
          {items.map((s, i) => (
            <span key={s.stage.key} className="absolute top-1/2 block size-6 -translate-x-1/2 -translate-y-1/2 motion-safe:animate-pop" style={{ left: `${centre(i)}%`, ...delay(0.15 + 0.12 * i) }}>
              {s.status === "fokus" && <span className="absolute inset-0 rounded-full bg-amber-400/60 motion-safe:animate-ping" aria-hidden />}
              <span className={cn("relative", nodeClass(s.status))}>{s.status === "selesai" && <Check className="size-3.5" />}</span>
            </span>
          ))}
          {focus && (
            <span className="absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 motion-safe:animate-pop" style={{ left: `${todayPct}%`, ...delay(1.1) }}>
              <span className="absolute left-1/2 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-navy bg-white" aria-hidden />
              <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-navy px-2 py-0.5 text-[10px] font-bold text-white shadow-md">{todayLabel}</span>
            </span>
          )}
        </div>
        <div className="mt-6 grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {items.map((s, i) => (
            <div key={s.stage.key} className="px-1 text-center motion-safe:animate-rise" style={delay(0.3 + 0.1 * i)}>
              <p className="text-lg font-extrabold">{shortDate(s.stage.date)}</p>
              <p className="text-sm font-semibold">{s.stage.short}</p>
              <p className="mt-1 text-xs text-muted">{s.stage.weight}% nilai · {s.stage.form}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
