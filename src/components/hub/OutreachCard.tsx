import Link from "next/link";
import type { OutreachSummary } from "@/lib/outreach";
import { primaryContact } from "@/lib/outreach";
import { daysLabel } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Avatar } from "./Avatar";
import { Card } from "./Card";

function Stat({ label, value, hint, alert = false }: { label: string; value: string; hint: string; alert?: boolean }) {
  return (
    <div className="rounded-xl bg-surface-soft p-3">
      <dt className="text-muted">{label}</dt>
      <dd className={cn("mt-0.5 truncate text-base font-extrabold", alert && "text-red-600")}>{value}</dd>
      <dd className="truncate text-muted">{hint}</dd>
    </div>
  );
}

/** Dashboard card: what outreach needs a hand today. */
export function OutreachCard({ summary, href }: { summary: OutreachSummary; href: string }) {
  return (
    <Card title="Outreach hari ini" action={{ label: "Buka outreach", href }}>
      <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <Stat label="Tindak lanjut" value={String(summary.due.length)} hint={summary.due.length ? "jatuh tempo" : "tidak ada"} alert={summary.due.length > 0} />
        <Stat label="Draf siap" value={String(summary.drafSiap)} hint="periksa lalu kirim" />
        <Stat label="Perlu riset" value={String(summary.perluRiset + summary.perluDraf)} hint="jalankan /outreach" />
        <Stat label="Menunggu balasan" value={String(summary.menunggu)} hint={`${summary.dibalas} sudah dibalas`} />
      </dl>
      {summary.due.length > 0 && (
        <ul className="mt-2 divide-y divide-line">
          {summary.due.slice(0, 5).map((p) => {
            const c = primaryContact(p);
            return (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <Avatar name={p.company} />
                <div className="min-w-0 flex-1">
                  <Link href={`/outreach/${p.id}`} className="block truncate text-sm font-semibold hover:text-primary">{p.company}</Link>
                  <p className="truncate text-xs text-muted">{c ? `${c.name}${c.role ? `, ${c.role}` : ""}` : "belum ada kontak"}</p>
                </div>
                <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700">
                  {p.nextFollowUpAt ? daysLabel(p.nextFollowUpAt) : ""}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
