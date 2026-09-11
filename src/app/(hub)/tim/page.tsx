import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Trash2 } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { getPayloadClient } from "@/lib/payload";
import { Avatar } from "@/components/hub/Avatar";
import { PageHeader } from "@/components/hub/PageHeader";
import { AddMember } from "./AddMember";
import { Select } from "@/components/hub/Select";
import { MultiSelect } from "@/components/hub/MultiSelect";
import { jobTitles, roleLabel, roles, units } from "@/lib/options";
import { removeMember, resetPassword, updateMember } from "./actions";

export const metadata: Metadata = { title: "Tim" };
export const dynamic = "force-dynamic";


export default async function TimPage() {
  const user = await getSessionUser();
  if (!user) redirect("/masuk");
  if (user.role !== "admin") redirect("/");
  const payload = await getPayloadClient();
  const { docs } = await payload.find({ collection: "users", limit: 100, sort: "name" });

  return (
    <div className="space-y-5">
      <PageHeader title="Tim" subtitle="Siapa yang bisa masuk, dan apa yang boleh mereka lihat.">
        <AddMember />
      </PageHeader>

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,27,51,0.04)]">
        <ul className="divide-y divide-line">
          {docs.map((m) => {
            const self = m.id === user.id;
            return (
              <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Avatar name={m.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{m.name}{self ? " (Anda)" : ""}{m.title ? <span className="font-normal text-muted"> · {m.title}</span> : null}</p>
                  <p className="truncate text-xs text-muted">{m.email}</p>
                </div>
                {self ? (
                  <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary-dark">{roleLabel.get(m.role)} · semua unit</span>
                ) : (
                  <form action={updateMember} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={m.id} />
                    <Select name="role" size="compact" className="w-32" defaultValue={m.role} options={roles.map((r) => ({ label: roleLabel.get(r.value) ?? r.value, value: r.value }))} />
                    <Select name="title" size="compact" className="w-32" defaultValue={m.title ?? undefined} placeholder="Jabatan" options={jobTitles.map((t) => ({ label: t, value: t }))} />
                    <MultiSelect name="units" size="compact" className="w-44" placeholder="Unit" defaultValue={m.units ?? []} options={units} />
                    <button type="submit" className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold hover:border-primary/40">Simpan</button>
                  </form>
                )}
                {!self && (
                  <form action={resetPassword} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={m.id} />
                    <input name="password" type="text" minLength={8} required placeholder="password sementara" className="w-40 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs" />
                    <button type="submit" className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold hover:border-primary/40">Atur ulang</button>
                  </form>
                )}
                {!self && (
                  <form action={removeMember}>
                    <input type="hidden" name="id" value={m.id} />
                    <button type="submit" aria-label={`Hapus ${m.name}`} className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="size-4" />
                    </button>
                  </form>
                )}
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
