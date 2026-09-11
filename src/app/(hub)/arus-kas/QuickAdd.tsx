"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { paymentMethods, transactionCategories, units, type Unit } from "@/lib/options";
import { createTransaction, type QuickAddState } from "./actions";

export interface ClientOption {
  id: number;
  name: string;
  unit: Unit;
}

const initial: QuickAddState = { status: "idle" };
const field =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";
const label = "mb-1 block text-xs font-bold uppercase tracking-wider text-muted";

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const groupDigits = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export function QuickAdd({ unit, clients }: { unit: Unit; clients: ClientOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"masuk" | "keluar">("keluar");
  const [amount, setAmount] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (prev: QuickAddState, formData: FormData) => {
      const result = await createTransaction(prev, formData);
      if (result.status === "success") {
        setOpen(false);
        setAmount("");
        formRef.current?.reset();
        router.refresh();
      }
      return result;
    },
    initial,
  );

  const categories = transactionCategories.filter((c) => c.type === type);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark"
      >
        <Plus className="size-4" />
        Catat
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center" role="dialog" aria-modal="true">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold">Catat transaksi</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Tutup" className="rounded-lg p-1.5 text-muted hover:bg-surface-soft">
                <X className="size-5" />
              </button>
            </div>

            <form ref={formRef} action={formAction} className="mt-4 space-y-4">
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
                <label htmlFor="qa-amount" className={label}>Nominal</label>
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
                  <label htmlFor="qa-date" className={label}>Tanggal</label>
                  <input id="qa-date" name="date" type="date" required defaultValue={todayLocal()} className={field} />
                </div>
                <div>
                  <label htmlFor="qa-unit" className={label}>Unit</label>
                  <select id="qa-unit" name="unit" defaultValue={unit} className={field}>
                    {units.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="qa-category" className={label}>Kategori</label>
                <select id="qa-category" name="category" required className={field} key={type}>
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="qa-client" className={label}>Klien</label>
                  <select id="qa-client" name="client" defaultValue="" className={field}>
                    <option value="">Tanpa klien</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="qa-method" className={label}>Metode</label>
                  <select id="qa-method" name="method" defaultValue="transfer" className={field}>
                    {paymentMethods.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="qa-reference" className={label}>Keterangan / nomor invoice</label>
                <input id="qa-reference" name="reference" className={field} placeholder="Contoh: INV-2026-004 atau Domain klien" />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="qa-receipt" className={label}>Bukti (opsional)</label>
                  <input id="qa-receipt" name="receipt" type="file" accept="image/*,application/pdf" className="block w-full text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-xs file:font-semibold file:text-primary-dark" />
                </div>
                <div>
                  <label htmlFor="qa-notes" className={label}>Catatan</label>
                  <input id="qa-notes" name="notes" className={field} placeholder="Opsional" />
                </div>
              </div>

              {state.status === "error" && (
                <p role="alert" className="text-sm font-medium text-red-600">{state.message}</p>
              )}

              <button
                type="submit"
                disabled={pending}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60",
                  type === "masuk" ? "bg-secondary hover:bg-secondary-dark" : "bg-red-600 hover:bg-red-700",
                )}
              >
                {pending && <Loader2 className="size-4 animate-spin" />}
                {pending ? "Menyimpan..." : type === "masuk" ? "Simpan uang masuk" : "Simpan uang keluar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
