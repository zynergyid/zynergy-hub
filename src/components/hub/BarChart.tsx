import type { MonthPoint } from "@/lib/finance";
import { formatIDR, formatMonth } from "@/lib/format";

/** Grouped monthly bars (masuk vs keluar), hand-rolled SVG, no chart library. */
export function BarChart({ points }: { points: MonthPoint[] }) {
  const W = 720;
  const H = 220;
  const padL = 8;
  const padR = 44;
  const padB = 26;
  const padT = 10;
  const max = Math.max(1, ...points.flatMap((p) => [p.masuk, p.keluar]));
  const nice = Math.pow(10, Math.floor(Math.log10(max)));
  const top = Math.ceil(max / nice) * nice;
  const slot = (W - padL - padR) / points.length;
  const barW = Math.min(18, slot * 0.28);
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / top);
  const short = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(v % 1_000_000 ? 1 : 0)} jt` : v >= 1000 ? `${Math.round(v / 1000)} rb` : String(v);

  return (
    <div>
      <div className="mb-2 flex items-center gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-secondary" /> Masuk</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-red-400" /> Keluar</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-48 w-full" role="img" aria-label="Grafik arus kas 12 bulan">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={padL} x2={W - padR + 4} y1={y(top * f)} y2={y(top * f)} className="stroke-line" strokeWidth="1" />
            <text x={W - 2} y={y(top * f) - 3} textAnchor="end" className="fill-muted" fontSize="10">
              {short(top * f)}
            </text>
          </g>
        ))}
        {points.map((p, i) => {
          const cx = padL + slot * i + slot / 2;
          return (
            <g key={p.label.toISOString()}>
              <rect x={cx - barW - 2} y={y(p.masuk)} width={barW} height={y(0) - y(p.masuk)} rx="3" className="fill-secondary">
                <title>{`${formatMonth(p.label)} masuk ${formatIDR(p.masuk)}`}</title>
              </rect>
              <rect x={cx + 2} y={y(p.keluar)} width={barW} height={y(0) - y(p.keluar)} rx="3" className="fill-red-400">
                <title>{`${formatMonth(p.label)} keluar ${formatIDR(p.keluar)}`}</title>
              </rect>
              <text x={cx} y={H - 8} textAnchor="middle" className="fill-muted" fontSize="10">
                {formatMonth(p.label)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
