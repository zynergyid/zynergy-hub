"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Trash2 } from "lucide-react";
import type { User } from "@/payload-types";
import { jobTitles, roles, units } from "@/lib/options";
import { ErrorText, Input, Label } from "@/components/hub/form";
import { Select } from "@/components/hub/Select";
import { MultiSelect } from "@/components/hub/MultiSelect";
import { removeMember, resetPassword, saveMember, type MemberFormState } from "./actions";

const initial: MemberFormState = { status: "idle" };

export function MemberForm({ member, isSelf }: { member?: User; isSelf: boolean }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (prev: MemberFormState, fd: FormData) => {
      const r = await saveMember(prev, fd);
      if (r.status === "success") router.push("/team");
      return r;
    },
    initial,
  );

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-5 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,27,51,0.04)] sm:p-6">
        {member && <input type="hidden" name="id" value={member.id} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="mf-name">Nama</Label>
            <Input id="mf-name" name="name" required defaultValue={member?.name} />
          </div>
          <div>
            <Label htmlFor="mf-email">Email</Label>
            <Input id="mf-email" name="email" type="email" required defaultValue={member?.email} placeholder="nama@zynergy.co.id" />
          </div>
          <div>
            <Label htmlFor="mf-role">Peran</Label>
            <Select id="mf-role" name="role" defaultValue={member?.role ?? "member"} options={roles} disabled={isSelf} />
            {isSelf && <p className="mt-1 text-xs text-muted">Peran dan unit Anda sendiri tidak bisa diubah dari sini.</p>}
          </div>
          <div>
            <Label htmlFor="mf-title">Jabatan</Label>
            <Select id="mf-title" name="title" defaultValue={member?.title ?? undefined} placeholder="Tanpa jabatan" options={jobTitles.map((t) => ({ label: t, value: t }))} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="mf-units">Unit (untuk finance dan anggota)</Label>
            {isSelf ? (
              <p className="text-sm text-muted">Admin melihat semua unit.</p>
            ) : (
              <MultiSelect name="units" placeholder="Pilih unit" defaultValue={member?.units ?? []} options={units} />
            )}
          </div>
          {!member && (
            <div className="sm:col-span-2">
              <Label htmlFor="mf-password">Password sementara</Label>
              <Input id="mf-password" name="password" type="text" required minLength={8} placeholder="minimal 8 karakter" />
              <p className="mt-1 text-xs text-muted">Kirim ke orangnya; dia bisa mengganti sendiri di halaman Profil.</p>
            </div>
          )}
        </div>
        <ErrorText>{state.status === "error" ? state.message : null}</ErrorText>
        <div className="border-t border-line pt-4">
          <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
            {pending && <Loader2 className="size-4 animate-spin" />}
            {member ? "Simpan perubahan" : "Tambah anggota"}
          </button>
        </div>
      </form>

      {member && !isSelf && (
        <div className="grid gap-4 sm:grid-cols-2">
          <form action={resetPassword} className="rounded-2xl border border-line bg-white p-5">
            <input type="hidden" name="id" value={member.id} />
            <h2 className="flex items-center gap-2 text-sm font-bold"><KeyRound className="size-4 text-muted" /> Atur ulang password</h2>
            <p className="mt-1 text-xs text-muted">Berikan password sementara baru, minta dia menggantinya di Profil.</p>
            <div className="mt-3 flex gap-2">
              <Input name="password" type="text" minLength={8} required placeholder="password sementara" />
              <button type="submit" className="shrink-0 rounded-xl border border-line px-3.5 py-2 text-sm font-semibold hover:border-primary/40">Atur ulang</button>
            </div>
          </form>
          <form
            action={removeMember}
            onSubmit={(e) => { if (!confirm(`Hapus ${member.name} dari tim?`)) e.preventDefault(); }}
            className="rounded-2xl border border-line bg-white p-5"
          >
            <input type="hidden" name="id" value={member.id} />
            <h2 className="flex items-center gap-2 text-sm font-bold"><Trash2 className="size-4 text-muted" /> Hapus dari tim</h2>
            <p className="mt-1 text-xs text-muted">Akunnya dihapus dan tidak bisa login lagi. Data yang pernah dia catat tetap ada.</p>
            <button type="submit" className="mt-3 rounded-xl border border-red-200 px-3.5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Hapus anggota</button>
          </form>
        </div>
      )}
    </div>
  );
}
