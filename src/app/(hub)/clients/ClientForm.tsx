"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import type { Client } from "@/payload-types";
import { businessTypes, clientStatuses, packages, units, type Unit } from "@/lib/options";
import { ErrorText, RupiahInput, fieldClass, groupDigits } from "@/components/hub/form";
import { Select } from "@/components/hub/Select";
import { deleteClient, saveClient, type ClientFormState } from "./actions";

const initial: ClientFormState = { status: "idle" };
const day = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");

export function ClientForm({
  client,
  canDelete,
  readOnly = false,
  units: allowedUnits,
}: {
  client?: Client;
  canDelete: boolean;
  readOnly?: boolean;
  units: Unit[];
}) {
  const router = useRouter();
  const [fee, setFee] = useState(client?.annualFee ? groupDigits(String(client.annualFee)) : "");
  const [state, formAction, pending] = useActionState(
    async (prev: ClientFormState, fd: FormData) => {
      const r = await saveClient(prev, fd);
      if (r.status === "success" && r.id) router.push(`/clients/${r.id}`);
      return r;
    },
    initial,
  );

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,27,51,0.04)] sm:p-6">
      {client && <input type="hidden" name="id" value={client.id} />}
      <fieldset disabled={readOnly} className="space-y-5 disabled:opacity-90">

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="cf-name" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Nama usaha</label>
          <input id="cf-name" name="name" required defaultValue={client?.name} className={fieldClass} placeholder="Contoh: Warung Nasi Uduk Pak Wawan" />
        </div>
        <div>
          <label htmlFor="cf-owner" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Pemilik / PIC</label>
          <input id="cf-owner" name="owner" defaultValue={client?.owner ?? ""} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="cf-whatsapp" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">WhatsApp</label>
          <input id="cf-whatsapp" name="whatsapp" required inputMode="tel" defaultValue={client?.whatsapp} className={fieldClass} placeholder="08xxxxxxxxxx" />
        </div>
        <div>
          <label htmlFor="cf-email" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Email</label>
          <input id="cf-email" name="email" type="email" defaultValue={client?.email ?? ""} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="cf-city" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Kota / area</label>
          <input id="cf-city" name="city" defaultValue={client?.city ?? ""} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="cf-unit" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Unit bisnis</label>
          <Select id="cf-unit" name="unit" defaultValue={client?.unit ?? allowedUnits[0] ?? "digital"} options={units.filter((u) => allowedUnits.includes(u.value) || client?.unit === u.value)} />
        </div>
        <div>
          <label htmlFor="cf-type" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Jenis usaha</label>
          <Select id="cf-type" name="businessType" defaultValue={client?.businessType ?? undefined} placeholder="Pilih jenis usaha" options={businessTypes} />
        </div>
        <div>
          <label htmlFor="cf-package" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Paket</label>
          <Select id="cf-package" name="package" defaultValue={client?.package ?? undefined} placeholder="Belum ditentukan" options={packages} />
        </div>
        <div>
          <label htmlFor="cf-fee" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Biaya per tahun</label>
          <RupiahInput id="cf-fee" name="annualFee" value={fee} onChange={setFee} />
        </div>
        <div>
          <label htmlFor="cf-status" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Status</label>
          <Select id="cf-status" name="status" defaultValue={client?.status ?? "aktif"} options={clientStatuses} />
        </div>
        <div>
          <label htmlFor="cf-start" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Mulai</label>
          <input id="cf-start" name="startDate" type="date" defaultValue={day(client?.startDate)} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="cf-renewal" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Jatuh tempo perpanjangan</label>
          <input id="cf-renewal" name="renewalDate" type="date" defaultValue={day(client?.renewalDate)} className={fieldClass} />
          <p className="mt-1 text-xs text-muted">Kosongkan untuk otomatis satu tahun setelah mulai.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="cf-web" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Website</label>
          <input id="cf-web" name="website" defaultValue={client?.links?.website ?? ""} className={fieldClass} placeholder="https://" />
        </div>
        <div>
          <label htmlFor="cf-gbp" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Profil Google</label>
          <input id="cf-gbp" name="googleProfile" defaultValue={client?.links?.googleProfile ?? ""} className={fieldClass} placeholder="https://" />
        </div>
        <div>
          <label htmlFor="cf-ig" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Instagram</label>
          <input id="cf-ig" name="instagram" defaultValue={client?.links?.instagram ?? ""} className={fieldClass} placeholder="@" />
        </div>
      </div>

      <div>
        <label htmlFor="cf-notes" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Catatan</label>
        <textarea id="cf-notes" name="notes" rows={3} defaultValue={client?.notes ?? ""} className={fieldClass} />
      </div>

      </fieldset>

      <ErrorText>{state.status === "error" ? state.message : null}</ErrorText>

      {!readOnly && (
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
      )}
    </form>
  );
}
