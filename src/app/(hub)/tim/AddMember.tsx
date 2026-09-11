"use client";

import { useActionState, useRef, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { ErrorText, fieldClass } from "@/components/hub/form";
import { jobTitles, roles, units } from "@/lib/options";
import { Select } from "@/components/hub/Select";
import { MultiSelect } from "@/components/hub/MultiSelect";
import { addMember, type MemberFormState } from "./actions";

const initial: MemberFormState = { status: "idle" };

export function AddMember() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (prev: MemberFormState, fd: FormData) => {
      const r = await addMember(prev, fd);
      if (r.status === "success") {
        setOpen(false);
        formRef.current?.reset();
      }
      return r;
    },
    initial,
  );

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark">
        <Plus className="size-4" />
        Tambah anggota
      </button>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="w-full rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,27,51,0.04)]">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">Anggota baru</h2>
        <button type="button" onClick={() => setOpen(false)} aria-label="Tutup" className="rounded-lg p-1.5 text-muted hover:bg-surface-soft"><X className="size-4" /></button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div><label htmlFor="m-name" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Nama</label><input id="m-name" name="name" required className={fieldClass} /></div>
        <div><label htmlFor="m-email" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Email</label><input id="m-email" name="email" type="email" required className={fieldClass} placeholder="nama@zynergy.co.id" /></div>
        <div>
          <label htmlFor="m-password" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Password sementara</label>
          <input id="m-password" name="password" type="text" required minLength={8} className={fieldClass} placeholder="minimal 8 karakter" />
          <p className="mt-1 text-xs text-muted">Kirim ke orangnya, minta ganti setelah login pertama.</p>
        </div>
        <div>
          <label htmlFor="m-role" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Peran</label>
          <Select id="m-role" name="role" defaultValue="member" options={roles} />
        </div>
        <div>
          <label htmlFor="m-title" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Jabatan</label>
          <Select id="m-title" name="title" placeholder="Tanpa jabatan" options={jobTitles.map((t) => ({ label: t, value: t }))} />
        </div>
        <div>
          <label htmlFor="m-units" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Unit (untuk finance dan anggota)</label>
          <MultiSelect name="units" placeholder="Pilih unit" options={units} />
        </div>
      </div>
      <div className="mt-3"><ErrorText>{state.status === "error" ? state.message : null}</ErrorText></div>
      <button type="submit" disabled={pending} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Simpan anggota
      </button>
    </form>
  );
}
