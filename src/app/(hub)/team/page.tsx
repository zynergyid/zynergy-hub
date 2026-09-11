import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { getPayloadClient } from "@/lib/payload";
import { roleLabel, unitLabel } from "@/lib/options";
import { Avatar } from "@/components/hub/Avatar";
import { PageHeader } from "@/components/hub/PageHeader";

export const metadata: Metadata = { title: "Tim" };
export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");
  const payload = await getPayloadClient();
  const { docs } = await payload.find({ collection: "users", limit: 100, sort: "name" });

  return (
    <div className="space-y-5">
      <PageHeader title="Tim" subtitle="Siapa yang bisa masuk, dan apa yang boleh mereka lihat.">
        <Link href="/team/new" className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark">
          <Plus className="size-4" />
          Tambah anggota
        </Link>
      </PageHeader>

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,27,51,0.04)]">
        <ul className="divide-y divide-line">
          {docs.map((m) => {
            const self = m.id === user.id;
            const scope = m.role === "admin" || m.role === "viewer" ? ["semua unit"] : (m.units ?? []).map((u) => unitLabel.get(u) ?? u);
            return (
              <li key={m.id}>
                <Link href={self ? "/profile" : `/team/${m.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-soft/60">
                  <Avatar name={m.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {m.name}{self ? " (Anda)" : ""}
                      {m.title ? <span className="font-normal text-muted"> · {m.title}</span> : null}
                    </p>
                    <p className="truncate text-xs text-muted">{m.email}</p>
                  </div>
                  <div className="hidden flex-wrap justify-end gap-1.5 sm:flex">
                    <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-bold text-primary-dark">{roleLabel.get(m.role)}</span>
                    {scope.map((s) => (
                      <span key={s} className="rounded-full bg-surface-soft px-2.5 py-1 text-[11px] font-semibold text-muted">{s}</span>
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-primary">Ubah</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="text-xs text-muted">
        Anggota: klien dan alat di unitnya. Finance: ditambah arus kas di unitnya. Pengawas: melihat semua unit tanpa mengubah.
        Admin: semua, termasuk tim. Jabatan hanya label.
      </p>
    </div>
  );
}
