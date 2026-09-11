import Link from "next/link";
import type { Transaction } from "@/payload-types";
import { formatDate, formatIDR } from "@/lib/format";
import { categoryLabel } from "@/lib/options";
import { cn } from "@/lib/cn";

/** Compact transaction rows for detail pages; editable rows open the Arus Kas sheet. */
export function TxList({ rows, editable = false, empty }: { rows: Transaction[]; editable?: boolean; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-line">
      {rows.map((t) => {
        const title = t.reference || categoryLabel.get(t.category);
        return (
          <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <div className="min-w-0">
              {editable ? (
                <Link href={`/cash-flow?unit=${t.unit}&month=${t.date.slice(0, 7)}&edit=${t.id}`} className="block truncate font-semibold hover:text-primary">
                  {title}
                </Link>
              ) : (
                <p className="truncate font-semibold">{title}</p>
              )}
              <p className="text-xs text-muted">{formatDate(t.date)} · {categoryLabel.get(t.category)}</p>
            </div>
            <span className={cn("shrink-0 font-extrabold", t.type === "masuk" ? "text-secondary-dark" : "text-red-600")}>
              {t.type === "masuk" ? "+" : "-"}{formatIDR(t.amount)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
