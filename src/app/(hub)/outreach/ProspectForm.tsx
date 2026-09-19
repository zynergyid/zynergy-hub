"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { Prospect } from "@/payload-types";
import type { ClientOption } from "@/lib/orders";
import { matchClient } from "@/lib/order-draft";
import { prospectSectors, prospectSources, units, type Unit } from "@/lib/options";
import { ErrorText, Label, buttonPrimary, fieldClass } from "@/components/hub/form";
import { ConfirmButton } from "@/components/hub/ConfirmButton";
import { Select } from "@/components/hub/Select";
import { deleteProspect, saveProspect, type ProspectFormState } from "./actions";

interface ContactRow {
  key: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  linkedin: string;
}

const initial: ProspectFormState = { status: "idle" };
const newRow = (key: number): ContactRow => ({ key, name: "", role: "", email: "", phone: "", linkedin: "" });
const small = `${fieldClass} px-2.5 py-2`;

/** Company profile and contacts. Research, draft, and progress live in their own cards on the detail page. */
export function ProspectForm({
  prospect,
  units: allowedUnits,
  clients,
  canDelete,
  readOnly = false,
  defaultUnit,
}: {
  prospect?: Prospect;
  units: Unit[];
  /** Existing clients, so a reactivation target links to its client record from day one. */
  clients: ClientOption[];
  canDelete: boolean;
  readOnly?: boolean;
  defaultUnit?: Unit;
}) {
  const router = useRouter();
  const [unit, setUnit] = useState<Unit>(prospect?.unit ?? defaultUnit ?? (allowedUnits.includes("supply") ? "supply" : (allowedUnits[0] ?? "supply")));
  const [company, setCompany] = useState(prospect?.company ?? "");
  const linkedId = prospect ? (typeof prospect.client === "object" && prospect.client ? prospect.client.id : prospect.client) : null;
  const [clientId, setClientId] = useState(linkedId ? String(linkedId) : "");
  const clientsInUnit = clients.filter((c) => c.unit === unit);
  const suggestion = !clientId && company.trim().length >= 4 ? matchClient(company, clientsInUnit) : undefined;
  const [contacts, setContacts] = useState<ContactRow[]>(() =>
    (prospect?.contacts ?? []).map((c, i) => ({ key: i, name: c.name, role: c.role ?? "", email: c.email ?? "", phone: c.phone ?? "", linkedin: c.linkedin ?? "" })),
  );
  const [nextKey, setNextKey] = useState(contacts.length);
  const [state, formAction, pending] = useActionState(
    async (prev: ProspectFormState, fd: FormData) => {
      const r = await saveProspect(prev, fd);
      if (r.status === "success" && r.id) {
        router.push(`/outreach/${r.id}`);
        router.refresh();
      }
      return r;
    },
    initial,
  );
  const update = (key: number, patch: Partial<ContactRow>) => setContacts((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const remove = (key: number) => setContacts((rows) => rows.filter((r) => r.key !== key));
  const add = () => {
    setContacts((rows) => [...rows, newRow(nextKey)]);
    setNextKey((k) => k + 1);
  };

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,27,51,0.04)] sm:p-6">
      {prospect && <input type="hidden" name="id" value={prospect.id} />}
      <input type="hidden" name="contacts" value={JSON.stringify(contacts.map((c) => ({ name: c.name, role: c.role, email: c.email, phone: c.phone, linkedin: c.linkedin })))} />
      <fieldset disabled={readOnly} className="space-y-5 disabled:opacity-90">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="pr-company">Perusahaan</Label>
            <input id="pr-company" name="company" required value={company} onChange={(e) => setCompany(e.target.value)} className={fieldClass} placeholder="Contoh: PT Tambang Nusantara" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="pr-client">Klien yang sudah ada (untuk reaktivasi)</Label>
            <input type="hidden" name="client" value={clientId} />
            <Select key={unit} id="pr-client" name="client-picker" value={clientId || "none"} onValueChange={(v) => setClientId(v === "none" ? "" : v)} options={[{ label: "Bukan klien lama", value: "none" }, ...clientsInUnit.map((c) => ({ label: c.name, value: String(c.id) }))]} />
            {suggestion && (
              <p className="mt-1 text-xs text-muted">
                Mirip klien <span className="font-semibold text-ink">{suggestion.name}</span>.{" "}
                <button type="button" onClick={() => setClientId(String(suggestion.id))} className="font-semibold text-primary hover:underline">Tautkan</button>
              </p>
            )}
            {clientId && !readOnly && <p className="mt-1 text-xs text-muted">Riwayat PO klien ini ikut dibaca skill /outreach, dan halaman klien menampilkan status outreach-nya.</p>}
          </div>
          <div>
            <Label htmlFor="pr-unit">Unit bisnis</Label>
            <Select id="pr-unit" name="unit" value={unit} onValueChange={(v) => setUnit(v as Unit)} options={units.filter((u) => allowedUnits.includes(u.value) || prospect?.unit === u.value)} />
          </div>
          <div>
            <Label htmlFor="pr-sector">Sektor</Label>
            <Select id="pr-sector" name="sector" defaultValue={prospect?.sector ?? undefined} placeholder="Pilih sektor" options={prospectSectors} />
          </div>
          <div>
            <Label htmlFor="pr-city">Kota / lokasi</Label>
            <input id="pr-city" name="city" defaultValue={prospect?.city ?? ""} className={fieldClass} />
          </div>
          <div>
            <Label htmlFor="pr-source">Sumber</Label>
            <Select id="pr-source" name="source" defaultValue={prospect?.source ?? undefined} placeholder="Dari mana target ini" options={prospectSources} />
          </div>
          <div>
            <Label htmlFor="pr-web">Website</Label>
            <input id="pr-web" name="website" defaultValue={prospect?.website ?? ""} className={fieldClass} placeholder="https://" />
          </div>
          <div>
            <Label htmlFor="pr-li">LinkedIn perusahaan</Label>
            <input id="pr-li" name="linkedin" defaultValue={prospect?.linkedin ?? ""} className={fieldClass} placeholder="https://linkedin.com/company/..." />
          </div>
        </div>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Kontak</h2>
            {!readOnly && (
              <button type="button" onClick={add} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line px-2.5 py-1.5 text-xs font-semibold text-muted hover:border-primary hover:text-primary">
                <Plus className="size-3.5" />
                Tambah kontak
              </button>
            )}
          </div>
          {contacts.length === 0 && <p className="text-xs text-muted">Belum ada kontak. Riset biasanya menemukan nama PIC pengadaan; isi di sini.</p>}
          {contacts.map((c) => (
            <div key={c.key} className="grid grid-cols-2 gap-2 rounded-xl border border-line p-2 sm:grid-cols-[1.3fr_1.2fr_1.3fr_1fr_1fr_auto] sm:items-center">
              <input aria-label="Nama" required className={small} placeholder="Nama" value={c.name} onChange={(e) => update(c.key, { name: e.target.value })} />
              <input aria-label="Jabatan" className={small} placeholder="Jabatan" value={c.role} onChange={(e) => update(c.key, { role: e.target.value })} />
              <input aria-label="Email" type="email" className={small} placeholder="Email" value={c.email} onChange={(e) => update(c.key, { email: e.target.value })} />
              <input aria-label="WhatsApp" inputMode="tel" className={small} placeholder="WhatsApp" value={c.phone} onChange={(e) => update(c.key, { phone: e.target.value })} />
              <input aria-label="LinkedIn" className={small} placeholder="LinkedIn" value={c.linkedin} onChange={(e) => update(c.key, { linkedin: e.target.value })} />
              {!readOnly && (
                <button type="button" onClick={() => remove(c.key)} aria-label="Hapus kontak" className="justify-self-end rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          ))}
        </section>

        <div>
          <Label htmlFor="pr-history">Riwayat hubungan sebelumnya</Label>
          <textarea id="pr-history" name="history" rows={3} defaultValue={prospect?.history ?? ""} className={fieldClass} placeholder="Kapan terakhir kontak, dengan siapa, apa yang dipasok atau dibahas, hasilnya. Contoh: 2016 memasok 40 transceiver untuk cabang Balikpapan lewat Pak Hendra (Procurement), lancar; sejak itu tidak ada kontak." />
          <p className="mt-1 text-xs text-muted">Skill /outreach memakai ini untuk membuka pesan dengan pengingat yang spesifik, bukan perkenalan dari nol.</p>
        </div>
        <div>
          <Label htmlFor="pr-notes">Catatan internal</Label>
          <textarea id="pr-notes" name="notes" rows={2} defaultValue={prospect?.notes ?? ""} className={fieldClass} placeholder="Siapa yang kenal, riwayat lama, hal yang perlu diingat" />
        </div>
      </fieldset>

      <ErrorText>{state.status === "error" ? state.message : null}</ErrorText>

      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <button type="submit" disabled={pending} className={buttonPrimary}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {prospect ? "Simpan perubahan" : "Simpan target"}
          </button>
          {prospect && canDelete && (
            <ConfirmButton message={`Hapus target ${prospect.company} beserta riset dan drafnya?`} formAction={deleteProspect} formNoValidate className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
              <Trash2 className="size-4" />
              Hapus
            </ConfirmButton>
          )}
        </div>
      )}
    </form>
  );
}
