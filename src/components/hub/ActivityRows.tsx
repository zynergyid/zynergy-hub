import Link from "next/link";
import type { Activity } from "@/payload-types";
import { actionVerb, changesOf, recordHref, sectionLabel } from "@/lib/activity";
import { relativeTime } from "@/lib/format";
import type { AuditAction } from "@/lib/audit";
import { Avatar } from "./Avatar";

const timeFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Jakarta" });

/** One sentence per row: who, did what, to which record, plus the fields that moved. Shared by the page and the record cards. */
export function ActivityRows({ rows, photos, showRecord = true, showChanges = true }: { rows: Activity[]; photos?: Map<number, string>; showRecord?: boolean; showChanges?: boolean }) {
  return (
    <ul className="divide-y divide-line">
      {rows.map((a) => {
        const href = recordHref(a);
        const changes = showChanges ? changesOf(a) : [];
        const verb = actionVerb[a.action as AuditAction] ?? a.action;
        return (
          <li key={a.id} className="flex items-start gap-3 py-2.5">
            <Avatar name={a.actorName} src={typeof a.actor === "number" ? photos?.get(a.actor) : typeof a.actor === "object" && a.actor ? photos?.get(a.actor.id) : undefined} className="mt-0.5 size-7 text-[10px]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-semibold">{a.actorName}</span> {verb}
                {showRecord && a.action !== "login" ? (
                  <>
                    {" "}
                    <span className="text-muted">{sectionLabel[a.collection] ?? a.collection}</span>{" "}
                    {href ? <Link href={href} className="font-semibold hover:text-primary">{a.title}</Link> : <span className="font-semibold">{a.title}</span>}
                  </>
                ) : null}
              </p>
              {a.summary && <p className="text-xs text-muted">{a.summary}</p>}
              {changes.length > 3 && (
                <details className="mt-1 text-xs text-muted">
                  <summary className="cursor-pointer select-none">{changes.length} kolom berubah</summary>
                  <ul className="mt-1 space-y-0.5">
                    {changes.map((c) => (
                      <li key={c.field}>
                        {c.label}: {c.from ?? "kosong"} menjadi {c.to ?? "kosong"}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
            <time dateTime={a.createdAt} title={timeFmt.format(new Date(a.createdAt))} className="shrink-0 text-xs text-muted">{relativeTime(a.createdAt)}</time>
          </li>
        );
      })}
    </ul>
  );
}
