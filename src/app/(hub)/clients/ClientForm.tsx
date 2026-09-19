"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import type { Client } from "@/payload-types";
import { businessTypes, clientStatuses, packages, units, type Unit } from "@/lib/options";
import { ErrorText, Label, RupiahInput, buttonPrimary, fieldClass, groupDigits } from "@/components/hub/form";
import { ConfirmButton } from "@/components/hub/ConfirmButton";
import { Select } from "@/components/hub/Select";
import { deleteClient, saveClient, type ClientFormState } from "./actions";

const initial: ClientFormState = { status: "idle" };
const day = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");

export function ClientForm({
  client,
  canDelete,
  readOnly = false,
  units: allowedUnits,
  defaultUnit,
  next,
}: {
  client?: Client;
  canDelete: boolean;
  readOnly?: boolean;
  units: Unit[];
  defaultUnit?: Unit;
  /** Hub path to return to after saving, with `?client=<id>` appended (used by "Klien baru" links). */
  next?: string;
}) {
  const router = useRouter();
  const [unit, setUnit] = useState<Unit>(client?.unit ?? defaultUnit ?? allowedUnits[0] ?? "digital");
  const [fee, setFee] = useState(client?.annualFee ? groupDigits(String(client.annualFee)) : "");
  const [state, formAction, pending] = useActionState(
    async (prev: ClientFormState, fd: FormData) => {
      const r = await saveClient(prev, fd);
      if (r.status === "success" && r.id) router.push(next ? `${next}?client=${r.id}` : `/clients/${r.id}`);
      return r;
    },
    initial,
  );
  // Supply buyers are companies: legal data instead of packages and renewals.
  const isSupply = unit === "supply";
  const supply = client?.supply;

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,27,51,0.04)] sm:p-6">
      {client && <input type="hidden" name="id" value={client.id} />}
      <fieldset disabled={readOnly} className="space-y-5 disabled:opacity-90">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="cf-unit">Unit bisnis</Label>
            <Select id="cf-unit" name="unit" value={unit} onValueChange={(v) => setUnit(v as Unit)} options={units.filter((u) => allowedUnits.includes(u.value) || client?.unit === u.value)} />
          </div>
          <div>
            <Label htmlFor="cf-status">Status</Label>
            <Select id="cf-status" name="status" defaultValue={client?.status ?? "aktif"} options={clientStatuses} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="cf-name">{isSupply ? "Nama perusahaan" : "Nama usaha"}</Label>
            <input id="cf-name" name="name" required defaultValue={client?.name} className={fieldClass} placeholder={isSupply ? "Contoh: PT Tambang Nusantara" : "Contoh: Warung Nasi Uduk Pak Wawan"} />
          </div>
          <div>
            <Label htmlFor="cf-owner">{isSupply ? "PIC pengadaan" : "Pemilik / PIC"}</Label>
            <input id="cf-owner" name="owner" defaultValue={client?.owner ?? ""} className={fieldClass} />
          </div>
          <div>
            <Label htmlFor="cf-whatsapp">WhatsApp{isSupply ? " (opsional)" : ""}</Label>
            <input id="cf-whatsapp" name="whatsapp" required={!isSupply} inputMode="tel" defaultValue={client?.whatsapp ?? ""} className={fieldClass} placeholder="08xxxxxxxxxx" />
          </div>
          <div>
            <Label htmlFor="cf-email">Email</Label>
            <input id="cf-email" name="email" type="email" defaultValue={client?.email ?? ""} className={fieldClass} />
          </div>
          <div>
            <Label htmlFor="cf-city">Kota / area</Label>
            <input id="cf-city" name="city" defaultValue={client?.city ?? ""} className={fieldClass} />
          </div>
          <div>
            <Label htmlFor="cf-type">Jenis usaha</Label>
            <Select key={unit} id="cf-type" name="businessType" defaultValue={client?.businessType ?? (isSupply ? "industri" : undefined)} placeholder="Pilih jenis usaha" options={businessTypes} />
          </div>
          <div>
            <Label htmlFor="cf-web">Website</Label>
            <input id="cf-web" name="website" defaultValue={client?.links?.website ?? ""} className={fieldClass} placeholder="https://" />
          </div>
        </div>

        {isSupply ? (
          <div className="space-y-4 rounded-xl border border-line bg-surface-soft/60 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Data resmi untuk PO dan invoice</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="cf-legal">Nama badan hukum</Label>
                <input id="cf-legal" name="legalName" defaultValue={supply?.legalName ?? ""} className={fieldClass} placeholder="Nama lengkap sesuai NPWP" />
              </div>
              <div>
                <Label htmlFor="cf-npwp">NPWP</Label>
                <input id="cf-npwp" name="npwp" defaultValue={supply?.npwp ?? ""} className={fieldClass} />
              </div>
              <div>
                <Label htmlFor="cf-vendor">Nomor vendor</Label>
                <input id="cf-vendor" name="vendorNumber" defaultValue={supply?.vendorNumber ?? ""} className={fieldClass} placeholder="Nomor kita di sistem pembeli" />
              </div>
              <div>
                <Label htmlFor="cf-terms">Termin pembayaran (hari)</Label>
                <input id="cf-terms" name="paymentTermsDays" type="number" min={0} defaultValue={supply?.paymentTermsDays ?? 30} className={fieldClass} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="cf-billing">Alamat penagihan</Label>
                <textarea id="cf-billing" name="billingAddress" rows={2} defaultValue={supply?.billingAddress ?? ""} className={fieldClass} />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cf-package">Paket</Label>
              <Select id="cf-package" name="package" defaultValue={client?.package ?? undefined} placeholder="Belum ditentukan" options={packages} />
            </div>
            <div>
              <Label htmlFor="cf-fee">Biaya per tahun</Label>
              <RupiahInput id="cf-fee" name="annualFee" value={fee} onChange={setFee} />
            </div>
            <div>
              <Label htmlFor="cf-start">Mulai</Label>
              <input id="cf-start" name="startDate" type="date" defaultValue={day(client?.startDate)} className={fieldClass} />
            </div>
            <div>
              <Label htmlFor="cf-renewal">Jatuh tempo perpanjangan</Label>
              <input id="cf-renewal" name="renewalDate" type="date" defaultValue={day(client?.renewalDate)} className={fieldClass} />
              <p className="mt-1 text-xs text-muted">Kosongkan untuk otomatis satu tahun setelah mulai.</p>
            </div>
            <div>
              <Label htmlFor="cf-gbp">Profil Google</Label>
              <input id="cf-gbp" name="googleProfile" defaultValue={client?.links?.googleProfile ?? ""} className={fieldClass} placeholder="https://" />
            </div>
            <div>
              <Label htmlFor="cf-ig">Instagram</Label>
              <input id="cf-ig" name="instagram" defaultValue={client?.links?.instagram ?? ""} className={fieldClass} placeholder="@" />
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="cf-notes">Catatan</Label>
          <textarea id="cf-notes" name="notes" rows={3} defaultValue={client?.notes ?? ""} className={fieldClass} />
        </div>
      </fieldset>

      <ErrorText>{state.status === "error" ? state.message : null}</ErrorText>

      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <button type="submit" disabled={pending} className={buttonPrimary}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {client ? "Simpan perubahan" : "Simpan klien"}
          </button>
          {client && canDelete && (
            <ConfirmButton
              message={`Hapus klien ${client.name}? Transaksi terkait tetap tersimpan.`}
              formAction={deleteClient}
              formNoValidate
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <Trash2 className="size-4" />
              Hapus
            </ConfirmButton>
          )}
        </div>
      )}
    </form>
  );
}
