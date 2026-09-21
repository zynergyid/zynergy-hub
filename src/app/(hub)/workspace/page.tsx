import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { roles } from "@/lib/options";
import { cardLabel, jobOnlyCards, toolLabel, workspaceOf } from "@/lib/workspace";
import { navSections, MOBILE_TAB_COUNT } from "@/components/hub/nav";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/hub/PageHeader";
import { TeamTabs } from "../team/TeamTabs";

export const metadata: Metadata = { title: "Ruang kerja" };

const navLabel = new Map(navSections.flatMap((s) => s.items).map((i) => [i.href, i.label]));

/** Read-only: what each jabatan changes about the screens. Rights are never in this table. */
export default async function WorkspacePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <div className="space-y-5">
      <PageHeader title="Ruang kerja" subtitle="Yang diubah peran pada layar: urutan kartu di Dasbor, empat tab di HP, dan alat khusus. Haknya diatur di tab Hak akses; tab yang haknya tidak ada dilewati.">
        {user.isAdmin && <TeamTabs active="workspace" />}
      </PageHeader>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,27,51,0.04)]">
        <table className="w-full min-w-[44rem] text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="px-4 py-3 font-medium">Peran</th>
              <th className="px-3 py-3 font-medium">Kartu pertama di Dasbor</th>
              <th className="px-3 py-3 font-medium">Tab HP</th>
              <th className="px-3 py-3 font-medium">Alat khusus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {roles.map(({ value: t }) => {
              const ws = workspaceOf(t);
              return (
                <tr key={t} className={cn("align-top", t === user.role && "bg-primary-soft/30")}>
                  <td className="px-4 py-3 font-semibold">
                    {t}
                    {t === user.role ? <span className="ml-1 text-xs font-normal text-primary">(Anda)</span> : null}
                  </td>
                  <td className="px-3 py-3">
                    {ws.featured.length === 0 ? (
                      <span className="text-muted">urutan umum</span>
                    ) : (
                      <ul className="flex flex-wrap gap-1">
                        {ws.featured.map((c) => (
                          <li key={c} className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", jobOnlyCards.includes(c) ? "bg-rose-50 text-rose-700" : "bg-surface-soft text-ink")}>{cardLabel[c]}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-3 py-3">{ws.tabs.slice(0, MOBILE_TAB_COUNT).map((h) => navLabel.get(h) ?? h).join(", ")}, Lainnya</td>
                  <td className="px-3 py-3">{ws.tools.length ? ws.tools.map((k) => toolLabel[k]).join(", ") : <span className="text-muted">tidak ada</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">Kartu berwarna merah muda hanya ada untuk peran yang memintanya. Kartu lain tetap tampil untuk semua, hanya urutannya yang berubah. Pemetaan ini diubah lewat kode.</p>
    </div>
  );
}
