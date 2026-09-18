"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { todayLocal } from "@/lib/format";
import { ErrorText, Label, buttonPrimary, fieldClass, groupDigits } from "@/components/hub/form";
import { FileInput } from "@/components/hub/FileInput";
import { ConfirmButton } from "@/components/hub/ConfirmButton";
import { Select } from "@/components/hub/Select";
import { paymentMethods, transactionCategories, units, type Unit } from "@/lib/options";
import type { ClientOption, OrderOption } from "@/lib/orders";
import type { ProjectOption } from "@/lib/projects";
import { deleteTransaction, saveTransaction, type QuickAddState } from "./actions";

/** Plain, serializable subset of a transaction for the edit sheet. */
export interface EditingTx {
  id: number;
  type: "masuk" | "keluar";
  amount: number;
  date: string;
  unit: Unit;
  category: string;
  method: string | null;
  client: number | null;
  order: number | null;
  project: number | null;
  reference: string | null;
  notes: string | null;
  receiptUrl: string | null;
}

/** Values to open the sheet with, for example a payment against a PO. */
export type TxPreset = Partial<Omit<EditingTx, "id" | "receiptUrl">>;

const initial: QuickAddState = { status: "idle" };

export function QuickAdd({
  unit,
  units: allowedUnits,
  clients,
  orders = [],
  projects = [],
  editing = null,
  prefill = null,
  closeHref = "/cash-flow",
}: {
  unit: Unit;
  units: Unit[];
  clients: ClientOption[];
  orders?: OrderOption[];
  projects?: ProjectOption[];
  editing?: EditingTx | null;
  prefill?: TxPreset | null;
  closeHref?: string;
}) {
  const router = useRouter();
  const seed: TxPreset | null = editing ?? prefill;
  const [open, setOpen] = useState(Boolean(seed));
  const [type, setType] = useState<"masuk" | "keluar">(seed?.type ?? "keluar");
  const [amount, setAmount] = useState(seed?.amount ? groupDigits(String(seed.amount)) : "");
  const formRef = useRef<HTMLFormElement>(null);

  const close = () => {
    setOpen(false);
    if (seed) router.replace(closeHref);
  };

  const [state, formAction, pending] = useActionState(
    async (prev: QuickAddState, formData: FormData) => {
      const result = await saveTransaction(prev, formData);
      if (result.status === "success") {
        setOpen(false);
        setAmount("");
        formRef.current?.reset();
        if (seed) router.replace(closeHref);
        router.refresh();
      }
      return result;
    },
    initial,
  );

  const categories = transactionCategories.filter((c) => c.type === type);
  const title = editing ? "Ubah transaksi" : prefill ? "Catat pembayaran PO" : "Catat transaksi";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonPrimary}>
        <Plus className="size-4" />
        Catat
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center" role="dialog" aria-modal="true">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold">{title}</h2>
              <button type="button" onClick={close} aria-label="Tutup" className="rounded-lg p-1.5 text-muted hover:bg-surface-soft">
                <X className="size-5" />
              </button>
            </div>

            <form ref={formRef} action={formAction} className="mt-4 space-y-4">
              {editing && <input type="hidden" name="id" value={editing.id} />}
              <input type="hidden" name="type" value={type} />
              <div className="grid grid-cols-2 gap-2">
                {(["masuk", "keluar"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "rounded-xl border py-3 text-sm font-bold transition-colors",
                      type === t
                        ? t === "masuk"
                          ? "border-secondary bg-secondary-soft text-secondary-dark"
                          : "border-red-300 bg-red-50 text-red-700"
                        : "border-line text-muted hover:border-ink/30",
                    )}
                  >
                    {t === "masuk" ? "Uang masuk" : "Uang keluar"}
                  </button>
                ))}
              </div>

              <div>
                <Label htmlFor="qa-amount">Nominal</Label>
                <div className="flex items-center rounded-xl border border-line bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                  <span className="pl-3.5 text-sm font-semibold text-muted">Rp</span>
                  <input
                    id="qa-amount"
                    name="amount"
                    inputMode="numeric"
                    autoComplete="off"
                    required
                    value={amount}
                    onChange={(e) => setAmount(groupDigits(e.target.value.replace(/\D/g, "")))}
                    className="w-full bg-transparent px-2 py-3 text-2xl font-extrabold tracking-tight focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="qa-date">Tanggal</Label>
                  <input id="qa-date" name="date" type="date" required defaultValue={editing ? editing.date.slice(0, 10) : todayLocal()} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="qa-unit">Unit</Label>
                  <Select id="qa-unit" name="unit" defaultValue={seed?.unit ?? unit} options={units.filter((u) => allowedUnits.includes(u.value))} />
                </div>
              </div>

              <div>
                <Label htmlFor="qa-category">Kategori</Label>
                <Select id="qa-category" name="category" required key={type} defaultValue={seed?.category ?? categories[0]?.value} options={categories} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="qa-client">Klien</Label>
                  <Select id="qa-client" name="client" defaultValue={seed?.client ? String(seed.client) : undefined} placeholder="Tanpa klien" options={clients.map((c) => ({ label: c.name, value: String(c.id) }))} />
                </div>
                <div>
                  <Label htmlFor="qa-method">Metode</Label>
                  <Select id="qa-method" name="method" defaultValue={seed?.method ?? "transfer"} options={paymentMethods} />
                </div>
              </div>

              {orders.length > 0 && (
                <div>
                  <Label htmlFor="qa-order">PO terkait</Label>
                  <Select id="qa-order" name="order" defaultValue={seed?.order ? String(seed.order) : undefined} placeholder="Tanpa PO" options={orders.map((o) => ({ label: o.label, value: String(o.id) }))} />
                </div>
              )}
              {projects.length > 0 && (
                <div>
                  <Label htmlFor="qa-project">Proyek terkait</Label>
                  <Select id="qa-project" name="project" defaultValue={seed?.project ? String(seed.project) : undefined} placeholder="Tanpa proyek" options={projects.map((o) => ({ label: o.label, value: String(o.id) }))} />
                </div>
              )}

              <div>
                <Label htmlFor="qa-reference">Keterangan / nomor invoice</Label>
                <input id="qa-reference" name="reference" defaultValue={seed?.reference ?? ""} className={fieldClass} placeholder="Contoh: INV-2026-004 atau Domain klien" />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="qa-receipt">Bukti (opsional)</Label>
                  <FileInput id="qa-receipt" name="receipt" accept="image/*,application/pdf" hint={false} />
                </div>
                <div>
                  <Label htmlFor="qa-notes">Catatan</Label>
                  <input id="qa-notes" name="notes" defaultValue={seed?.notes ?? ""} className={fieldClass} placeholder="Opsional" />
                </div>
              </div>

              {editing?.receiptUrl && (
                <p className="text-xs text-muted">
                  Bukti tersimpan:{" "}
                  <a href={editing.receiptUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">lihat</a>
                  . Unggah file baru untuk mengganti.
                </p>
              )}

              <ErrorText>{state.status === "error" ? state.message : null}</ErrorText>

              <button
                type="submit"
                disabled={pending}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60",
                  type === "masuk" ? "bg-secondary hover:bg-secondary-dark" : "bg-red-600 hover:bg-red-700",
                )}
              >
                {pending && <Loader2 className="size-4 animate-spin" />}
                {pending ? "Menyimpan..." : editing ? "Simpan perubahan" : type === "masuk" ? "Simpan uang masuk" : "Simpan uang keluar"}
              </button>
              {editing && (
                <ConfirmButton
                  message="Hapus transaksi ini?"
                  formAction={deleteTransaction}
                  formNoValidate
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="size-4" />
                  Hapus transaksi
                </ConfirmButton>
              )}
              <input type="hidden" name="closeHref" value={closeHref} />
            </form>
          </div>
        </div>
      )}
    </>
  );
}
