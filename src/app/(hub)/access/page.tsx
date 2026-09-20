import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { loadGrants } from "@/lib/permissions";
import { buildAccessMatrix, matrixColumns, type Right } from "@/lib/access-matrix";
import { roleLabel } from "@/lib/options";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/hub/PageHeader";
import { TeamTabs } from "../team/TeamTabs";
import { GrantsForm } from "./GrantsForm";

export const metadata: Metadata = { title: "Hak akses" };
export const dynamic = "force-dynamic";

const tone: Record<Right, string> = { ubah: "bg-secondary-soft text-secondary-dark", lihat: "bg-primary-soft text-primary-dark", tidak: "bg-surface-soft text-muted" };

/** Admins edit the capability grid; everyone sees what it means per module. */
export default async function AccessPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const admin = user.isAdmin;
  const grants = await loadGrants();
  const matrix = buildAccessMatrix(grants);
  return (
    <div className="space-y-5">
      <PageHeader title="Hak akses" subtitle="Tiap peran (jabatan) diberi hak di sini. Admin selalu punya semua. Unit membatasi lingkup untuk peran tanpa hak Melihat semua unit.">
        {admin && <TeamTabs active="access" />}
      </PageHeader>

      {admin && (
        <section className="space-y-2">
          <h2 className="text-base font-bold">Atur hak per peran</h2>
          <GrantsForm grants={grants} />
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-base font-bold">Artinya per bagian</h2>
        <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,27,51,0.04)]">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="px-4 py-3 font-medium">Bagian</th>
                {matrixColumns.map((c) => {
                  const mine = c === "admin" ? user.isAdmin : c === user.role;
                  return (
                    <th key={c} className={cn("px-3 py-3 text-center font-medium", mine && "text-primary")}>
                      {c === "admin" ? "Admin" : roleLabel.get(c)}
                      {mine ? " (Anda)" : ""}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {matrix.map((row) => (
                <tr key={row.module} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{row.module}</p>
                    {row.note && <p className="text-xs text-muted">{row.note}</p>}
                  </td>
                  {matrixColumns.map((c) => (
                    <td key={c} className="px-3 py-3 text-center">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold", tone[row.rights[c]])}>{row.rights[c]}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
