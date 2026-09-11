"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import type { Client } from "@/payload-types";
import { businessTypes, clientStatuses, packages, units } from "@/lib/options";
import { deleteClient, saveClient, type ClientFormState } from "./actions";

const initial: ClientFormState = { status: "idle" };
const field =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";
const label = "mb-1 block text-xs font-bold uppercase tracking-wider text-muted";
const day = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");
const groupDigits = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export function ClientForm({ client, canDelete }: { client?: Client; canDelete: boolean }) {
  const router = useRouter();
  const [fee, setFee] = useState(client?.annualFee ? groupDigits(String(client.annualFee)) : "");
  const [state, formAction, pending] = useActionState(
    async (prev: ClientFormState, fd: FormData) => {
      const r = await saveClient(prev, fd);
      if (r.status === "success" && r.id) router.push(`/klien/${r.id}`);
      return r;
    },
    initial,
  );

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,27,51,0.04)] sm:p-6">
      {client && <input type="hidden" name="id" value={client.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="cf-name" className={label}>Nama usaha</label>
          <input id="cf-name" name="name" required defaultValue={client?.name} className={field} placeholder="Contoh: Warung Nasi Uduk Pak Wawan" />
        </div>
        <div>
          <label htmlFor="cf-owner" className={label}>Pemilik / PIC</label>
          <input id="cf-owner" name="owner" defaultValue={client?.owner ?? ""} className={field} />
        </div>
        <div>
          <label htmlFor="cf-whatsapp" className={label}>WhatsApp</label>
          <input id="cf-whatsapp" name="whatsapp" required inputMode="tel" defaultValue={client?.whatsapp} className={field} placeholder="08xxxxxxxxxx" />
        </div>
        <div>
          <label htmlFor="cf-email" className={label}>Email</label>
          <input id="cf-email" name="email" type="email" defaultValue={client?.email ?? ""} className={field} />
        </div>
        <div>
          <label htmlFor="cf-city" className={label}>Kota / area</label>
          <input id="cf-city" name="city" defaultValue={client?.city ?? ""} className={field} />
        </div>
        <div>
          <label htmlFor="cf-unit" className={label}>Unit bisnis</label>
          <select id="cf-unit" name="unit" defaultValue={client?.unit ?? "digital"} className={field}>
            {units.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="cf-type" className={label}>Jenis usaha</label>
          <select id="cf-type" name="businessType" defaultValue={client?.businessType ?? ""} className={field}>
            <option value="">Pilih</option>
            {businessTypes.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="cf-package" className={label}>Paket</label>
          <select id="cf-package" name="package" defaultValue={client?.package ?? ""} className={field}>
            <option value="">Belum ditentukan</option>
            {packages.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="cf-fee" className={label}>Biaya per tahun</label>
          <div className="flex items-center rounded-xl border border-line bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <span className="pl-3.5 text-sm font-semibold text-muted">Rp</span>
            <input id="cf-fee" name="annualFee" inputMode="numeric" value={fee} onChange={(e) => setFee(groupDigits(e.target.value.replace(/\D/g, "")))} className="w-full bg-transparent px-2 py-2.5 text-sm focus:outline-none" placeholder="0" />
          </div>
        </div>
        <div>
          <label htmlFor="cf-status" className={label}>Status</label>
          <select id="cf-status" name="status" defaultValue={client?.status ?? "aktif"} className={field}>
            {clientStatuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="cf-start" className={label}>Mulai</label>
          <input id="cf-start" name="startDate" type="date" defaultValue={day(client?.startDate)} className={field} />
        </div>
        <div>
          <label htmlFor="cf-renewal" className={label}>Jatuh tempo perpanjangan</label>
          <input id="cf-renewal" name="renewalDate" type="date" defaultValue={day(client?.renewalDate)} className={field} />
          <p className="mt-1 text-xs text-muted">Kosongkan untuk otomatis satu tahun setelah mulai.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="cf-web" className={label}>Website</label>
          <input id="cf-web" name="website" defaultValue={client?.links?.website ?? ""} className={field} placeholder="https://" />
        </div>
        <div>
          <label htmlFor="cf-gbp" className={label}>Profil Google</label>
          <input id="cf-gbp" name="googleProfile" defaultValue={client?.links?.googleProfile ?? ""} className={field} placeholder="https://" />
        </div>
        <div>
          <label htmlFor="cf-ig" className={label}>Instagram</label>
          <input id="cf-ig" name="instagram" defaultValue={client?.links?.instagram ?? ""} className={field} placeholder="@" />
        </div>
      </div>

      <div>
        <label htmlFor="cf-notes" className={label}>Catatan</label>
        <textarea id="cf-notes" name="notes" rows={3} defaultValue={client?.notes ?? ""} className={field} />
      </div>

      {state.status === "error" && <p role="alert" className="text-sm font-medium text-red-600">{state.message}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
          {pending && <Loader2 className="size-4 animate-spin" />}
          {client ? "Simpan perubahan" : "Simpan klien"}
        </button>
        {client && canDelete && (
          <button
            type="submit"
            formAction={deleteClient}
            onClick={(e) => { if (!confirm(`Hapus klien ${client.name}? Transaksi terkait tetap tersimpan.`)) e.preventDefault(); }}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <Trash2 className="size-4" />
            Hapus
          </button>
        )}
      </div>
    </form>
  );
}
