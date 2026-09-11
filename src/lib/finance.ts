import { cache } from "react";
import type { Client, Transaction } from "@/payload-types";
import { getPayloadClient } from "@/lib/payload";
import { formatIDR } from "@/lib/format";
import { isFinancing, type Unit } from "@/lib/options";

export type UnitFilter = Unit | "semua";

export interface LedgerRow {
  tx: Transaction;
  /** Running balance after this transaction (only meaningful without text/category filters). */
  balance: number;
}

/** masuk/keluar are business cash only; funding* holds capital, loans, and draws for the same month. */
export interface Ledger {
  rows: LedgerRow[];
  opening: number;
  closing: number;
  masuk: number;
  keluar: number;
  fundingMasuk: number;
  fundingKeluar: number;
  filtered: boolean;
}

export interface UnitMonth {
  masuk: number;
  keluar: number;
  balance: number;
  masukPrev: number;
  keluarPrev: number;
  fundingMasuk: number;
  fundingKeluar: number;
}

/** KPI hint: warn when financing moved cash this month but is not in the number shown. */
export const fundingHint = (amount: number) => (amount ? `belum termasuk ${formatIDR(amount)} pendanaan` : "vs bulan lalu");

export interface CategoryShare {
  category: string;
  amount: number;
  share: number;
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

/** Resolve a requested unit against what the user may see. */
export function scopeUnits(unit: UnitFilter, allowed: Unit[]): Unit[] {
  if (unit === "semua") return allowed;
  return allowed.includes(unit) ? [unit] : [];
}

/** Unit from the URL, limited to what the user may see; "semua" when they have several units. */
export function resolveUnit(param: string | undefined, allowed: Unit[]): UnitFilter {
  if (param && param !== "semua" && allowed.includes(param as Unit)) return param as Unit;
  return allowed.length === 1 ? allowed[0] : "semua";
}

/** Loaded once per request even when several summaries need the same rows. */
const allTransactions = cache(async (unit: UnitFilter, allowed: Unit[]): Promise<Transaction[]> => {
  const scoped = scopeUnits(unit, allowed);
  if (scoped.length === 0) return [];
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "transactions",
    where: { unit: { in: scoped } },
    sort: "date",
    limit: 10000,
    depth: 1,
  });
  return docs;
});

export async function getLedger(opts: {
  unit: UnitFilter;
  allowed: Unit[];
  month: Date;
  q?: string;
  category?: string;
}): Promise<Ledger> {
  const docs = await allTransactions(opts.unit, opts.allowed);
  const q = opts.q?.trim().toLowerCase();
  const filtered = Boolean(q || opts.category);

  let running = 0;
  let opening = 0;
  let masuk = 0;
  let keluar = 0;
  let fundingMasuk = 0;
  let fundingKeluar = 0;
  const rows: LedgerRow[] = [];

  for (const tx of docs) {
    const d = new Date(tx.date);
    const before = d < opts.month;
    const inMonth = sameMonth(d, opts.month);
    running += tx.type === "masuk" ? tx.amount : -tx.amount;
    if (before) opening = running;
    if (!inMonth) continue;
    if (isFinancing(tx.category)) {
      if (tx.type === "masuk") fundingMasuk += tx.amount;
      else fundingKeluar += tx.amount;
    } else if (tx.type === "masuk") masuk += tx.amount;
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
    closing: opening + masuk - keluar + fundingMasuk - fundingKeluar,
    masuk,
    keluar,
    fundingMasuk,
    fundingKeluar,
    filtered,
  };
}

export async function getUnitMonth(unit: UnitFilter, allowed: Unit[], month = new Date()): Promise<UnitMonth> {
  const docs = await allTransactions(unit, allowed);
  const prevMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
  const out: UnitMonth = { masuk: 0, keluar: 0, balance: 0, masukPrev: 0, keluarPrev: 0, fundingMasuk: 0, fundingKeluar: 0 };
  for (const tx of docs) {
    out.balance += tx.type === "masuk" ? tx.amount : -tx.amount;
    const d = new Date(tx.date);
    const financing = isFinancing(tx.category);
    if (sameMonth(d, month)) {
      if (financing) {
        if (tx.type === "masuk") out.fundingMasuk += tx.amount;
        else out.fundingKeluar += tx.amount;
      } else if (tx.type === "masuk") out.masuk += tx.amount;
      else out.keluar += tx.amount;
    } else if (sameMonth(d, prevMonth) && !financing) {
      if (tx.type === "masuk") out.masukPrev += tx.amount;
      else out.keluarPrev += tx.amount;
    }
  }
  return out;
}

/** Spending by category for one month, largest first, with share of total. */
export async function getCategoryBreakdown(unit: UnitFilter, allowed: Unit[], month = new Date()): Promise<CategoryShare[]> {
  const docs = await allTransactions(unit, allowed);
  const totals = new Map<string, number>();
  let sum = 0;
  for (const tx of docs) {
    if (tx.type !== "keluar" || isFinancing(tx.category) || !sameMonth(new Date(tx.date), month)) continue;
    totals.set(tx.category, (totals.get(tx.category) ?? 0) + tx.amount);
    sum += tx.amount;
  }
  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount, share: sum ? amount / sum : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

/** Amounts per category and unit inside [from, to), split into business cash and financing. */
export interface Pnl {
  units: Unit[];
  operating: Map<string, Partial<Record<Unit, number>>>;
  financing: Map<string, Partial<Record<Unit, number>>>;
}

export async function getPnl(allowed: Unit[], from: Date, to: Date): Promise<Pnl> {
  const docs = await allTransactions("semua", allowed);
  const operating = new Map<string, Partial<Record<Unit, number>>>();
  const financing = new Map<string, Partial<Record<Unit, number>>>();
  for (const tx of docs) {
    const d = new Date(tx.date);
    if (d < from || d >= to) continue;
    const target = isFinancing(tx.category) ? financing : operating;
    const row = target.get(tx.category) ?? {};
    row[tx.unit] = (row[tx.unit] ?? 0) + tx.amount;
    target.set(tx.category, row);
  }
  return { units: allowed, operating, financing };
}

/** Cash balance per unit from all transactions dated before `end`. */
export async function getBalancesAt(allowed: Unit[], end: Date): Promise<Partial<Record<Unit, number>>> {
  const docs = await allTransactions("semua", allowed);
  const out: Partial<Record<Unit, number>> = {};
  for (const tx of docs) {
    if (new Date(tx.date) >= end) continue;
    out[tx.unit] = (out[tx.unit] ?? 0) + (tx.type === "masuk" ? tx.amount : -tx.amount);
  }
  return out;
}

/** Percentage change, null when there is no baseline. */
export function pctChange(now: number, prev: number): number | null {
  if (!prev) return null;
  return ((now - prev) / prev) * 100;
}

export interface MonthPoint {
  label: Date;
  masuk: number;
  keluar: number;
}

export async function getLast12(unit: UnitFilter, allowed: Unit[]): Promise<MonthPoint[]> {
  const docs = await allTransactions(unit, allowed);
  const now = new Date();
  const points: MonthPoint[] = Array.from({ length: 12 }, (_, i) => ({
    label: new Date(now.getFullYear(), now.getMonth() - (11 - i), 1),
    masuk: 0,
    keluar: 0,
  }));
  for (const tx of docs) {
    const p = points.find((pt) => sameMonth(pt.label, new Date(tx.date)));
    if (!p || isFinancing(tx.category)) continue;
    if (tx.type === "masuk") p.masuk += tx.amount;
    else p.keluar += tx.amount;
  }
  return points;
}

export async function getRenewals(allowed: Unit[], days = 30): Promise<Client[]> {
  if (allowed.length === 0) return [];
  const payload = await getPayloadClient();
  const until = new Date(Date.now() + days * 86400000).toISOString();
  const { docs } = await payload.find({
    collection: "clients",
    where: {
      and: [
        { unit: { in: allowed } },
        { renewalDate: { less_than_equal: until } },
        { status: { in: ["aktif", "jatuh-tempo"] } },
      ],
    },
    sort: "renewalDate",
    limit: 50,
  });
  return docs;
}

export async function getClientCounts(allowed: Unit[]) {
  if (allowed.length === 0) return { aktif: 0, prospek: 0, total: 0 };
  const payload = await getPayloadClient();
  const scope = { unit: { in: allowed } };
  const [aktif, prospek, total] = await Promise.all([
    payload.count({ collection: "clients", where: { and: [scope, { status: { equals: "aktif" } }] } }),
    payload.count({ collection: "clients", where: { and: [scope, { status: { equals: "prospek" } }] } }),
    payload.count({ collection: "clients", where: scope }),
  ]);
  return { aktif: aktif.totalDocs, prospek: prospek.totalDocs, total: total.totalDocs };
}
