import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getActivity, sections } from "@/lib/activity";
import { getUserOptions } from "@/lib/projects";
import { getUserPhotos } from "@/lib/people";
import { buildHref, first, type Search } from "@/lib/search";
import { ActivityRows } from "@/components/hub/ActivityRows";
import { EmptyState } from "@/components/hub/EmptyState";
import { PageHeader } from "@/components/hub/PageHeader";
import { TeamTabs } from "../team/TeamTabs";
import { ActivityFilters } from "./ActivityFilters";

export const metadata: Metadata = { title: "Aktivitas" };
export const dynamic = "force-dynamic";

const dayFmt = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Jakarta" });
const dayKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

/** The audit trail, filtered by person and section, grouped by day. Admins only; a record's own "Riwayat" card stays open to everyone who may open that record. */
export default async function ActivityPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/");
  const sp = await searchParams;
  const actorId = Number(first(sp.orang) || 0) || undefined;
  const section = sections.some((s) => s.value === first(sp.bagian)) ? first(sp.bagian) : undefined;
  const page = Math.max(1, Number(first(sp.hal) || 1) || 1);
  const [result, users, photos] = await Promise.all([getActivity({ user, actorId, section, page }), getUserOptions(), getUserPhotos()]);
  const base: Search = { orang: actorId ? String(actorId) : undefined, bagian: section };
  const href = (patch: Record<string, string | undefined>) => buildHref("/activity", base, patch);
  const days = [...new Set(result.docs.map((a) => dayKey(a.createdAt)))];

  return (
    <div className="space-y-5">
      <PageHeader title="Aktivitas" subtitle="Siapa mengubah apa dan kapan. Login dan unduhan laporan ikut tercatat; membaca halaman tidak.">
        <TeamTabs active="activity" />
      </PageHeader>

      <ActivityFilters people={users.map((u) => ({ label: u.name, value: String(u.id) }))} sections={sections} actorId={actorId ? String(actorId) : undefined} section={section} />

      {result.docs.length === 0 ? (
        <EmptyState title="Belum ada aktivitas tercatat." hint="Perubahan mulai tercatat sejak fitur ini dipasang." />
      ) : (
        <>
          {days.map((d) => (
            <section key={d} className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,27,51,0.04)]">
              <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">{dayFmt.format(new Date(`${d}T12:00:00+07:00`))}</h2>
              <ActivityRows rows={result.docs.filter((a) => dayKey(a.createdAt) === d)} photos={photos} />
            </section>
          ))}
          {(result.hasPrevPage || result.hasNextPage) && (
            <div className="flex items-center justify-between text-sm">
              {result.hasPrevPage ? <Link href={href({ hal: String(page - 1) })} className="font-semibold text-primary hover:underline">Lebih baru</Link> : <span />}
              <span className="text-xs text-muted">Halaman {result.page} dari {result.totalPages}</span>
              {result.hasNextPage ? <Link href={href({ hal: String(page + 1) })} className="font-semibold text-primary hover:underline">Lebih lama</Link> : <span />}
            </div>
          )}
        </>
      )}
    </div>
  );
}
