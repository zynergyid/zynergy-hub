"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import type { Order } from "@/payload-types";
import { orderStatuses, units, usdToIdrApprox, type Unit } from "@/lib/options";
import { formatIDR } from "@/lib/format";
import type { ClientOption } from "@/lib/orders";
import { orderToDraft, type OrderDraft } from "@/lib/order-draft";
import { ErrorText, Label, RupiahInput, buttonPrimary, fieldClass, groupDigits } from "@/components/hub/form";
import { FileInput } from "@/components/hub/FileInput";
import { ConfirmButton } from "@/components/hub/ConfirmButton";
import { Select } from "@/components/hub/Select";
import { deleteOrder, importOrderPdf, saveOrder, type ImportResult, type OrderFormState } from "./actions";

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
const num = (grouped: string) => Number(grouped.replace(/\D/g, "")) || 0;
const newRow = (key: number): ItemRow => ({ key, material: "", partNumber: "", description: "", qty: "1", uom: "each", unitPrice: "" });
const rowsOf = (draft: OrderDraft): ItemRow[] =>
  (draft.items ?? []).map((i, idx) => ({
    key: idx,
    material: i.material,
    partNumber: i.partNumber,
    description: i.description,
    qty: String(i.qty),
    uom: i.uom,
    unitPrice: i.unitPrice === null ? "" : groupDigits(String(i.unitPrice)),
  }));
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
  // The draft feeds every uncontrolled field; bumping formKey re-renders them with new defaults (after a PDF import).
  const [draft, setDraft] = useState<OrderDraft>(() => (order ? orderToDraft(order) : { clientId: defaultClientId }));
  const [formKey, setFormKey] = useState(0);
  const [items, setItems] = useState<ItemRow[]>(() => rowsOf(draft));
  const [nextKey, setNextKey] = useState(items.length);
  const [subtotal, setSubtotal] = useState(draft.subtotal && !draft.items?.length ? groupDigits(String(draft.subtotal)) : "");
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, startImport] = useTransition();
  const [imported, setImported] = useState<ImportResult | null>(null);
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
  const grid = showMoney ? itemGrid : itemGridNoMoney;
  const itemsJson = JSON.stringify(
    items.map((r) => ({ material: r.material, partNumber: r.partNumber, description: r.description, qty: Number(r.qty) || 0, uom: r.uom, unitPrice: num(r.unitPrice) })),
  );

  const readPdf = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setImported({ status: "error", message: "Pilih PDF PO dulu di kolom di atas." });
      return;
    }
    const fd = new FormData();
    fd.set("file", file);
    fd.set("unit", unit);
    startImport(async () => {
      const result = await importOrderPdf(fd);
      setImported(result);
      if (result.status === "ok") {
        setDraft(result.draft);
        const rows = rowsOf(result.draft);
        setItems(rows);
        setNextKey(rows.length);
        setSubtotal(result.draft.subtotal ? groupDigits(String(result.draft.subtotal)) : "");
        setFormKey((k) => k + 1);
      }
    });
  };

  return (
    <form action={formAction} className="space-y-6 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,27,51,0.04)] sm:p-6">
      {order && <input type="hidden" name="id" value={order.id} />}
      <input type="hidden" name="items" value={itemsJson} />
      <fieldset disabled={readOnly} className="space-y-6 disabled:opacity-90">
        {!order && !readOnly && (
          <section className="space-y-3 rounded-xl border border-dashed border-primary/40 bg-primary-soft/40 p-4">
            <div>
              <h2 className="text-sm font-bold">Mulai dari PDF PO pembeli</h2>
              <p className="text-xs text-muted">Pilih PDF, tekan Baca, periksa hasilnya, lalu Simpan. PDF-nya ikut tersimpan sebagai dokumen PO. Bisa juga dilewati dan diisi manual.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <FileInput ref={fileRef} id="of-file" name="poFile" accept="application/pdf,image/*" aria-label="PDF PO pembeli" hint={false} />
              <button type="button" onClick={readPdf} disabled={importing} className={buttonPrimary}>
                {importing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {importing ? "Membaca PDF..." : "Baca PDF dan isi form"}
              </button>
            </div>
            {imported?.status === "ok" && (
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-secondary-dark">
                  Form terisi dari PDF{imported.buyerCompany ? ` (pembeli terbaca: ${imported.buyerCompany})` : ""}.
                  {imported.usage.model === "mock"
                    ? " Mode contoh tanpa API."
                    : ` Biaya baca: $${imported.usage.costUsd.toFixed(4)} (sekitar ${formatIDR(imported.usage.costUsd * usdToIdrApprox)}).`}
                </p>
                {imported.warnings.map((w) => (
                  <p key={w} className="font-medium text-amber-700">Periksa: {w}</p>
                ))}
              </div>
            )}
            {imported?.status === "error" && <ErrorText>{imported.message}</ErrorText>}
          </section>
        )}

        <div key={formKey} className="space-y-6">
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Data PO</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="of-unit">Unit bisnis</Label>
                <Select id="of-unit" name="unit" value={unit} onValueChange={(v) => setUnit(v as Unit)} options={units.filter((u) => allowedUnits.includes(u.value) || order?.unit === u.value)} />
              </div>
              <div>
                <Label htmlFor="of-client">Klien (pembeli)</Label>
                <Select key={unit} id="of-client" name="client" required defaultValue={draft.clientId ? String(draft.clientId) : undefined} placeholder={clientOptions.length ? "Pilih klien" : "Belum ada klien di unit ini"} options={clientOptions} />
              </div>
              <div>
                <Label htmlFor="of-buyer">Nama buyer</Label>
                <input id="of-buyer" name="buyerName" defaultValue={draft.buyerName ?? ""} className={fieldClass} placeholder="Orang yang tertulis di PO" />
              </div>
              <div>
                <Label htmlFor="of-buyer-email">Email buyer</Label>
                <input id="of-buyer-email" name="buyerEmail" type="email" defaultValue={draft.buyerEmail ?? ""} className={fieldClass} />
              </div>
              <div>
                <Label htmlFor="of-number">Nomor PO</Label>
                <input id="of-number" name="number" required defaultValue={draft.number ?? ""} className={fieldClass} placeholder="Nomor dari dokumen pembeli" />
              </div>
              <div>
                <Label htmlFor="of-revision">Revisi</Label>
                <input id="of-revision" name="revision" type="number" min={0} defaultValue={draft.revision ?? 0} className={fieldClass} />
              </div>
              <div>
                <Label htmlFor="of-date">Tanggal PO</Label>
                <input id="of-date" name="orderDate" type="date" required defaultValue={draft.orderDate ?? ""} className={fieldClass} />
              </div>
              <div>
                <Label htmlFor="of-delivery">Tenggat kirim</Label>
                <input id="of-delivery" name="deliveryDate" type="date" defaultValue={draft.deliveryDate ?? ""} className={fieldClass} />
              </div>
              <div>
                <Label htmlFor="of-incoterm">Syarat kirim (Incoterm)</Label>
                <input id="of-incoterm" name="incoterm" defaultValue={draft.incoterm ?? ""} className={fieldClass} placeholder="Contoh: DDP Cakung Cilincing" />
              </div>
              <div>
                <Label htmlFor="of-terms">Termin (hari)</Label>
                <input id="of-terms" name="paymentTermsDays" type="number" min={0} defaultValue={draft.paymentTermsDays ?? 30} className={fieldClass} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="of-shipto">Tujuan kirim</Label>
                <textarea id="of-shipto" name="shipTo" rows={2} defaultValue={draft.shipTo ?? ""} className={fieldClass} placeholder="Nama gudang dan alamat dari PO" />
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
                  <Select id="of-status" name="status" defaultValue={draft.status ?? "diterima"} options={orderStatuses} />
                </div>
                <div>
                  <Label htmlFor="of-invoice">Nomor invoice</Label>
                  <input id="of-invoice" name="invoiceNumber" defaultValue={draft.invoiceNumber ?? ""} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="of-invoice-date">Tanggal invoice</Label>
                  <input id="of-invoice-date" name="invoiceDate" type="date" defaultValue={draft.invoiceDate ?? ""} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="of-due">Jatuh tempo bayar</Label>
                  <input id="of-due" name="dueDate" type="date" defaultValue={draft.dueDate ?? ""} className={fieldClass} />
                  <p className="mt-1 text-xs text-muted">Kosongkan untuk otomatis tanggal invoice plus termin.</p>
                </div>
              </div>
            </section>
          )}

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="of-notes">Catatan</Label>
              <textarea id="of-notes" name="notes" rows={2} defaultValue={draft.notes ?? ""} className={fieldClass} />
            </div>
          </section>
        </div>

        {/* New POs pick the file in the import card above (outside the keyed block, so an import keeps it). */}
        {order && (
          <section>
            <Label htmlFor="of-file">Unggah PDF PO revisi ini</Label>
            <FileInput ref={fileRef} id="of-file" name="poFile" accept="application/pdf,image/*" hint={false} />
            <p className="mt-1 text-xs text-muted">Dokumen lain (invoice, surat jalan, faktur) diunggah dari halaman PO.</p>
          </section>
        )}
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
