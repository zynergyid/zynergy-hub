import type { Client, Transaction } from "@/payload-types";
import { getPayloadClient } from "@/lib/payload";

export interface MonthPoint {
  label: Date;
  masuk: number;
  keluar: number;
}

export interface FinanceSummary {
  monthIn: number;
  monthOut: number;
  balance: number;
  byCategory: { category: string; amount: number }[];
  last12: MonthPoint[];
  recent: Transaction[];
}

const sameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export async function getFinanceSummary(): Promise<FinanceSummary> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "transactions",
    limit: 5000,
    sort: "-date",
    depth: 1,
  });

  const now = new Date();
  let monthIn = 0;
  let monthOut = 0;
  let balance = 0;
  const cat = new Map<string, number>();
  const last12: MonthPoint[] = Array.from({ length: 12 }, (_, i) => ({
    label: new Date(now.getFullYear(), now.getMonth() - (11 - i), 1),
    masuk: 0,
    keluar: 0,
  }));

  for (const t of docs) {
    const d = new Date(t.date);
    const signed = t.type === "masuk" ? t.amount : -t.amount;
    balance += signed;
    if (sameMonth(d, now)) {
      if (t.type === "masuk") monthIn += t.amount;
      else {
        monthOut += t.amount;
        cat.set(t.category, (cat.get(t.category) ?? 0) + t.amount);
      }
    }
    const point = last12.find((p) => sameMonth(p.label, d));
    if (point) {
      if (t.type === "masuk") point.masuk += t.amount;
      else point.keluar += t.amount;
    }
  }

  return {
    monthIn,
    monthOut,
    balance,
    byCategory: [...cat.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount),
    last12,
    recent: docs.slice(0, 8),
  };
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
