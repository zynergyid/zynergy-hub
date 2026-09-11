import type { Client, Transaction } from "@/payload-types";
import { getPayloadClient } from "@/lib/payload";
import type { Unit } from "@/lib/options";

export type UnitFilter = Unit | "semua";

export interface LedgerRow {
  tx: Transaction;
  /** Running balance after this transaction (only meaningful without text/category filters). */
  balance: number;
}

export interface Ledger {
  rows: LedgerRow[];
  opening: number;
  closing: number;
  masuk: number;
  keluar: number;
  filtered: boolean;
}

export interface UnitMonth {
  masuk: number;
  keluar: number;
  balance: number;
}

const sameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export function parseMonth(value?: string): Date {
  const m = value && /^\d{4}-\d{2}$/.test(value) ? value : null;
  if (m) return new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1, 1);
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

async function allTransactions(unit: UnitFilter): Promise<Transaction[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "transactions",
    where: unit === "semua" ? {} : { unit: { equals: unit } },
    sort: "date",
    limit: 10000,
    depth: 1,
  });
  return docs;
}

export async function getLedger(opts: {
  unit: UnitFilter;
  month: Date;
  q?: string;
  category?: string;
}): Promise<Ledger> {
  const docs = await allTransactions(opts.unit);
  const q = opts.q?.trim().toLowerCase();
  const filtered = Boolean(q || opts.category);

  let running = 0;
  let opening = 0;
  let masuk = 0;
  let keluar = 0;
  const rows: LedgerRow[] = [];

  for (const tx of docs) {
    const d = new Date(tx.date);
    const before = d < opts.month;
    const inMonth = sameMonth(d, opts.month);
    running += tx.type === "masuk" ? tx.amount : -tx.amount;
    if (before) opening = running;
    if (!inMonth) continue;
    if (tx.type === "masuk") masuk += tx.amount;
    else keluar += tx.amount;
    const clientName = typeof tx.client === "object" && tx.client ? tx.client.name : "";
    const hay = `${tx.reference ?? ""} ${tx.notes ?? ""} ${clientName} ${tx.category}`.toLowerCase();
    if (q && !hay.includes(q)) continue;
    if (opts.category && tx.category !== opts.category) continue;
    rows.push({ tx, balance: running });
  }

  return {
    rows: rows.reverse(),
    opening,
    closing: opening + masuk - keluar,
    masuk,
    keluar,
    filtered,
  };
}

export async function getUnitMonth(unit: Unit, month = new Date()): Promise<UnitMonth> {
  const docs = await allTransactions(unit);
  let masuk = 0;
  let keluar = 0;
  let balance = 0;
  for (const tx of docs) {
    balance += tx.type === "masuk" ? tx.amount : -tx.amount;
    if (sameMonth(new Date(tx.date), month)) {
      if (tx.type === "masuk") masuk += tx.amount;
      else keluar += tx.amount;
    }
  }
  return { masuk, keluar, balance };
}

export interface MonthPoint {
  label: Date;
  masuk: number;
  keluar: number;
}

export async function getLast12(unit: UnitFilter): Promise<MonthPoint[]> {
  const docs = await allTransactions(unit);
  const now = new Date();
  const points: MonthPoint[] = Array.from({ length: 12 }, (_, i) => ({
    label: new Date(now.getFullYear(), now.getMonth() - (11 - i), 1),
    masuk: 0,
    keluar: 0,
  }));
  for (const tx of docs) {
    const p = points.find((pt) => sameMonth(pt.label, new Date(tx.date)));
    if (!p) continue;
    if (tx.type === "masuk") p.masuk += tx.amount;
    else p.keluar += tx.amount;
  }
  return points;
}

export async function getRenewals(days = 30): Promise<Client[]> {
  const payload = await getPayloadClient();
  const until = new Date(Date.now() + days * 86400000).toISOString();
  const { docs } = await payload.find({
    collection: "clients",
    where: {
      and: [{ renewalDate: { less_than_equal: until } }, { status: { in: ["aktif", "jatuh-tempo"] } }],
    },
    sort: "renewalDate",
    limit: 50,
  });
  return docs;
}

export async function getClientCounts() {
  const payload = await getPayloadClient();
  const [aktif, prospek, total] = await Promise.all([
    payload.count({ collection: "clients", where: { status: { equals: "aktif" } } }),
    payload.count({ collection: "clients", where: { status: { equals: "prospek" } } }),
    payload.count({ collection: "clients" }),
  ]);
  return { aktif: aktif.totalDocs, prospek: prospek.totalDocs, total: total.totalDocs };
}
