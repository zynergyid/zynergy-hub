"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { Order } from "@/payload-types";
import { orderStatuses, units, type Unit } from "@/lib/options";
import { formatIDR } from "@/lib/format";
import type { ClientOption } from "@/lib/orders";
import { ErrorText, Label, RupiahInput, buttonPrimary, fieldClass, fileInputClass, groupDigits } from "@/components/hub/form";
import { ConfirmButton } from "@/components/hub/ConfirmButton";
import { Select } from "@/components/hub/Select";
import { deleteOrder, saveOrder, type OrderFormState } from "./actions";

interface ItemRow {
  key: number;
  material: string;
  partNumber: string;
  description: string;
  qty: string;
  uom: string;
  unitPrice: string;
}

const initial: OrderFormState = { status: "idle" };
const day = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");
const num = (grouped: string) => Number(grouped.replace(/\D/g, "")) || 0;
const newRow = (key: number): ItemRow => ({ key, material: "", partNumber: "", description: "", qty: "1", uom: "each", unitPrice: "" });
const itemClass = `${fieldClass} px-2.5 py-2`;
const itemGrid = "sm:grid-cols-[minmax(0,2.4fr)_1fr_1fr_0.55fr_0.65fr_1.1fr_1.1fr_auto]";
const itemGridNoMoney = "sm:grid-cols-[minmax(0,2.4fr)_1fr_1fr_0.55fr_0.65fr_auto]";

export function OrderForm({
  order,
  units: allowedUnits,
  clients,
  canDelete,
  readOnly = false,
  showMoney = true,
  defaultClientId,
}: {
  order?: Order;
  units: Unit[];
  clients: ClientOption[];
  canDelete: boolean;
  readOnly?: boolean;
  /** Members see the PO without prices, billing, or the value line. */
  showMoney?: boolean;
  defaultClientId?: number;
}) {
  const router = useRouter();
  const [unit, setUnit] = useState<Unit>(order?.unit ?? (allowedUnits.includes("supply") ? "supply" : (allowedUnits[0] ?? "supply")));
  const [items, setItems] = useState<ItemRow[]>(() =>
    (order?.items ?? []).map((i, idx) => ({
      key: idx,
      material: i.material ?? "",
      partNumber: i.partNumber ?? "",
      description: i.description,
      qty: String(i.qty),
      uom: i.uom ?? "each",
      unitPrice: groupDigits(String(i.unitPrice)),
    })),
  );
  const [nextKey, setNextKey] = useState(items.length);
  const [subtotal, setSubtotal] = useState(order?.subtotal && !order.items?.length ? groupDigits(String(order.subtotal)) : "");
  const [state, formAction, pending] = useActionState(
    async (prev: OrderFormState, fd: FormData) => {
      const r = await saveOrder(prev, fd);
      if (r.status === "success" && r.id) {
        router.push(`/orders/${r.id}`);
        router.refresh();
      }
      return r;
    },
    initial,
  );

  const update = (key: number, patch: Partial<ItemRow>) => setItems((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const remove = (key: number) => setItems((rows) => rows.filter((r) => r.key !== key));
  const add = () => {
    setItems((rows) => [...rows, newRow(nextKey)]);
    setNextKey((k) => k + 1);
  };
  const computed = items.reduce((s, r) => s + (Number(r.qty) || 0) * num(r.unitPrice), 0);
  const clientOptions = clients.filter((c) => c.unit === unit).map((c) => ({ label: c.name, value: String(c.id) }));
  const defaultClient = order ? (typeof order.client === "object" ? order.client.id : order.client) : defaultClientId;
  const grid = showMoney ? itemGrid : itemGridNoMoney;
  const itemsJson = JSON.stringify(
    items.map((r) => ({ material: r.material, partNumber: r.partNumber, description: r.description, qty: Number(r.qty) || 0, uom: r.uom, unitPrice: num(r.unitPrice) })),
  );

  return (
    <form action={formAction} className="space-y-6 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,27,51,0.04)] sm:p-6">
      {order && <input type="hidden" name="id" value={order.id} />}
      <input type="hidden" name="items" value={itemsJson} />
      <fieldset disabled={readOnly} className="space-y-6 disabled:opacity-90">
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Data PO</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="of-unit">Unit bisnis</Label>
              <Select id="of-unit" name="unit" value={unit} onValueChange={(v) => setUnit(v as Unit)} options={units.filter((u) => allowedUnits.includes(u.value) || order?.unit === u.value)} />
            </div>
            <div>
              <Label htmlFor="of-client">Klien (pembeli)</Label>
              <Select key={unit} id="of-client" name="client" required defaultValue={defaultClient ? String(defaultClient) : undefined} placeholder={clientOptions.length ? "Pilih klien" : "Belum ada klien di unit ini"} options={clientOptions} />
            </div>
            <div>
              <Label htmlFor="of-number">Nomor PO</Label>
              <input id="of-number" name="number" required defaultValue={order?.number} className={fieldClass} placeholder="Nomor dari dokumen pembeli" />
            </div>
            <div>
              <Label htmlFor="of-revision">Revisi</Label>
              <input id="of-revision" name="revision" type="number" min={0} defaultValue={order?.revision ?? 0} className={fieldClass} />
            </div>
            <div>
              <Label htmlFor="of-date">Tanggal PO</Label>
              <input id="of-date" name="orderDate" type="date" required defaultValue={day(order?.orderDate)} className={fieldClass} />
            </div>
            <div>
              <Label htmlFor="of-delivery">Tenggat kirim</Label>
              <input id="of-delivery" name="deliveryDate" type="date" defaultValue={day(order?.deliveryDate)} className={fieldClass} />
            </div>
            <div>
              <Label htmlFor="of-incoterm">Syarat kirim (Incoterm)</Label>
              <input id="of-incoterm" name="incoterm" defaultValue={order?.incoterm ?? ""} className={fieldClass} placeholder="Contoh: DDP Cakung Cilincing" />
            </div>
            <div>
              <Label htmlFor="of-terms">Termin (hari)</Label>
              <input id="of-terms" name="paymentTermsDays" type="number" min={0} defaultValue={order?.paymentTermsDays ?? 30} className={fieldClass} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="of-shipto">Tujuan kirim</Label>
              <textarea id="of-shipto" name="shipTo" rows={2} defaultValue={order?.shipTo ?? ""} className={fieldClass} placeholder="Nama gudang dan alamat dari PO" />
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Item</h2>
            {!readOnly && (
              <button type="button" onClick={add} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line px-2.5 py-1.5 text-xs font-semibold text-muted hover:border-primary hover:text-primary">
                <Plus className="size-3.5" />
                Tambah item
              </button>
            )}
          </div>
          {items.length > 0 && (
            <div className={`hidden gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-muted sm:grid ${grid}`}>
              <span>Deskripsi</span>
              <span>No. material</span>
              <span>Part number</span>
              <span>Qty</span>
              <span>Satuan</span>
              {showMoney && <span>Harga satuan</span>}
              {showMoney && <span className="text-right">Subtotal</span>}
              <span />
            </div>
          )}
          {items.map((r) => (
            <div key={r.key} className={`grid grid-cols-2 gap-2 rounded-xl border border-line p-2 sm:items-center sm:border-0 sm:p-0 ${grid}`}>
              <input aria-label="Deskripsi" required className={`${itemClass} col-span-2 sm:col-span-1`} placeholder="Deskripsi barang" value={r.description} onChange={(e) => update(r.key, { description: e.target.value })} />
              <input aria-label="Nomor material" className={itemClass} placeholder="No. material" value={r.material} onChange={(e) => update(r.key, { material: e.target.value })} />
              <input aria-label="Part number" className={itemClass} placeholder="Part number" value={r.partNumber} onChange={(e) => update(r.key, { partNumber: e.target.value })} />
              <input aria-label="Qty" type="number" min={0} step="any" required className={itemClass} placeholder="Qty" value={r.qty} onChange={(e) => update(r.key, { qty: e.target.value })} />
              <input aria-label="Satuan" className={itemClass} placeholder="Satuan" value={r.uom} onChange={(e) => update(r.key, { uom: e.target.value })} />
              {showMoney && (
                <input aria-label="Harga satuan" inputMode="numeric" className={itemClass} placeholder="Harga satuan" value={r.unitPrice} onChange={(e) => update(r.key, { unitPrice: groupDigits(e.target.value.replace(/\D/g, "")) })} />
              )}
              {showMoney && <p className="self-center text-right text-sm font-bold">{formatIDR((Number(r.qty) || 0) * num(r.unitPrice))}</p>}
              {!readOnly && (
                <button type="button" onClick={() => remove(r.key)} aria-label="Hapus item" className="justify-self-end rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          ))}
          {!showMoney ? null : items.length > 0 ? (
            <p className="pt-1 text-right text-sm text-muted">
              Nilai PO (belum PPN): <span className="font-extrabold text-ink">{formatIDR(computed)}</span>
            </p>
          ) : (
            <div className="sm:max-w-xs">
              <Label htmlFor="of-subtotal">Nilai PO (belum PPN)</Label>
              <RupiahInput id="of-subtotal" name="subtotal" value={subtotal} onChange={setSubtotal} />
              <p className="mt-1 text-xs text-muted">Isi langsung kalau item tidak dirinci.</p>
            </div>
          )}
        </section>

        {showMoney && (
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Status dan penagihan</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="of-status">Status</Label>
              <Select id="of-status" name="status" defaultValue={order?.status ?? "diterima"} options={orderStatuses} />
            </div>
            <div>
              <Label htmlFor="of-invoice">Nomor invoice</Label>
              <input id="of-invoice" name="invoiceNumber" defaultValue={order?.invoiceNumber ?? ""} className={fieldClass} />
            </div>
            <div>
              <Label htmlFor="of-invoice-date">Tanggal invoice</Label>
              <input id="of-invoice-date" name="invoiceDate" type="date" defaultValue={day(order?.invoiceDate)} className={fieldClass} />
            </div>
            <div>
              <Label htmlFor="of-due">Jatuh tempo bayar</Label>
              <input id="of-due" name="dueDate" type="date" defaultValue={day(order?.dueDate)} className={fieldClass} />
              <p className="mt-1 text-xs text-muted">Kosongkan untuk otomatis tanggal invoice plus termin.</p>
            </div>
          </div>
        </section>
        )}

        <section className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="of-file">{order ? "Unggah PDF PO revisi ini" : "PDF PO pembeli"}</Label>
            <input id="of-file" name="poFile" type="file" accept="application/pdf,image/*" className={fileInputClass} />
            <p className="mt-1 text-xs text-muted">Dokumen lain (invoice, surat jalan, faktur) diunggah dari halaman PO.</p>
          </div>
          <div>
            <Label htmlFor="of-notes">Catatan</Label>
            <textarea id="of-notes" name="notes" rows={2} defaultValue={order?.notes ?? ""} className={fieldClass} />
          </div>
        </section>
      </fieldset>

      <ErrorText>{state.status === "error" ? state.message : null}</ErrorText>

      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <button type="submit" disabled={pending} className={buttonPrimary}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {order ? "Simpan perubahan" : "Simpan PO"}
          </button>
          {order && canDelete && (
            <ConfirmButton
              message={`Hapus PO ${order.number} beserta dokumennya? Transaksi terkait tetap tersimpan.`}
              formAction={deleteOrder}
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
