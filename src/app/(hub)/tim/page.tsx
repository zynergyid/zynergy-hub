import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Trash2 } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { getPayloadClient } from "@/lib/payload";
import { Avatar } from "@/components/hub/Avatar";
import { PageHeader } from "@/components/hub/PageHeader";
import { AddMember } from "./AddMember";
import { removeMember, setRole } from "./actions";

export const metadata: Metadata = { title: "Tim" };
export const dynamic = "force-dynamic";

const roleLabel: Record<string, string> = { admin: "Admin", finance: "Finance", member: "Member" };

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
                  <p className="truncate text-sm font-semibold">{m.name}{self ? " (Anda)" : ""}</p>
                  <p className="truncate text-xs text-muted">{m.email}</p>
                </div>
                {self ? (
                  <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary-dark">{roleLabel[m.role]}</span>
                ) : (
                  <form action={setRole} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={m.id} />
                    <select name="role" defaultValue={m.role} className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold">
                      <option value="member">Member</option>
                      <option value="finance">Finance</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button type="submit" className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold hover:border-primary/40">Simpan</button>
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
      <p className="text-xs text-muted">Member melihat klien saja. Finance melihat klien dan arus kas. Admin mengelola tim dan semua data.</p>
    </div>
  );
}
