import type { CategoryShare } from "@/lib/finance";
import { formatIDR } from "@/lib/format";
import { categoryLabel } from "@/lib/options";

export function CategoryBars({ items, limit = 6 }: { items: CategoryShare[]; limit?: number }) {
  if (items.length === 0) return <p className="text-sm text-muted">Belum ada pengeluaran di periode ini.</p>;
  return (
    <ul className="space-y-3">
      {items.slice(0, limit).map((c) => (
        <li key={c.category}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{categoryLabel.get(c.category) ?? c.category}</span>
            <span className="font-semibold">{formatIDR(c.amount)}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-soft">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, c.share * 100)}%` }} />
            </div>
            <span className="w-9 text-right text-xs text-muted">{Math.round(c.share * 100)}%</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
