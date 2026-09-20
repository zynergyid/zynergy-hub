import type { SeoSummary } from "@/lib/seo-summary";
import { cn } from "@/lib/cn";
import { Card } from "./Card";

const tone = (p: number | null) => (p === null ? "text-muted" : p >= 80 ? "text-secondary-dark" : p >= 50 ? "text-amber-700" : "text-red-600");
const badge = { fail: "bg-red-50 text-red-700", warn: "bg-amber-50 text-amber-700", pass: "bg-secondary-soft text-secondary-dark" };
const label = { fail: "Kurang", warn: "Perbaiki", pass: "OK" };

/** Dashboard card for marketing: the two scores and the next things to do for the site. */
export function SeoCard({ summary }: { summary: SeoSummary }) {
  const todos = summary.todos.filter((t) => t.status !== "pass").slice(0, 4);
  return (
    <Card title="SEO situs" action={{ label: "Buka SEO", href: "/seo" }}>
      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl bg-surface-soft p-3">
          <dt className="text-muted">Teknis</dt>
          <dd className={cn("mt-0.5 text-lg font-extrabold", tone(summary.technical))}>{summary.technical ?? "belum diperiksa"}</dd>
        </div>
        <div className="rounded-xl bg-surface-soft p-3">
          <dt className="text-muted">Konten</dt>
          <dd className={cn("mt-0.5 text-lg font-extrabold", tone(summary.content))}>{summary.content}</dd>
        </div>
      </dl>
      {todos.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Tidak ada yang perlu dikerjakan.</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {todos.map((t) => (
            <li key={t.id} className="flex items-start gap-3 py-2.5">
              <span className={cn("mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold", badge[t.status])}>{label[t.status]}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.label}</p>
                {t.detail && <p className="truncate text-xs text-muted">{t.detail}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
