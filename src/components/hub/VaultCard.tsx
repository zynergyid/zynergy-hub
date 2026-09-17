import Link from "next/link";
import type { VaultDocument } from "@/payload-types";
import { formatDate } from "@/lib/format";
import { Card } from "./Card";
import { ExpiryPill } from "./ExpiryPill";

/** Dashboard card: documents expired or expiring within the warning window. */
export function VaultCard({ docs, total }: { docs: VaultDocument[]; total: number }) {
  return (
    <Card title="Brankas Dokumen" action={{ label: "Buka brankas", href: "/vault" }}>
      {docs.length === 0 ? (
        <p className="text-sm text-muted">{total} dokumen tersimpan, tidak ada yang mendekati kedaluwarsa.</p>
      ) : (
        <ul className="divide-y divide-line">
          {docs.slice(0, 5).map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0">
                <Link href={`/vault/${d.id}`} className="block truncate font-semibold hover:text-primary">{d.title}</Link>
                <p className="text-xs text-muted">berlaku sampai {d.expiresAt ? formatDate(d.expiresAt) : "-"}</p>
              </div>
              <ExpiryPill expiresAt={d.expiresAt} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
