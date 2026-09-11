import type { Order, Transaction } from "@/payload-types";
import { getPayloadClient } from "@/lib/payload";
import { scopeUnits, type UnitFilter } from "@/lib/finance";
import { openOrderStatuses, type Unit } from "@/lib/options";

export interface ClientOption {
  id: number;
  name: string;
  unit: Unit;
}

export interface OrderOption {
  id: number;
  label: string;
  unit: Unit;
}

/** PO value before tax: line items win, otherwise the entered value. */
export function orderTotal(o: Pick<Order, "items" | "subtotal">): number {
  const items = o.items ?? [];
  if (items.length) return items.reduce((sum, i) => sum + (i.qty || 0) * (i.unitPrice || 0), 0);
  return o.subtotal ?? 0;
}

export const clientOf = (o: Order) => (typeof o.client === "object" && o.client ? o.client : null);
export const isOpenOrder = (o: Pick<Order, "status">) => openOrderStatuses.includes(o.status);
export const toOrderOption = (o: Order): OrderOption => ({
  id: o.id,
  label: `${o.number}${clientOf(o) ? ` · ${clientOf(o)!.name}` : ""}`,
  unit: o.unit,
});

/** The date that matters next: delivery until shipped, then the payment due date. */
export function nextDate(o: Order): { label: string; iso: string } | null {
  if (o.status === "diterima" || o.status === "sourcing") return o.deliveryDate ? { label: "kirim", iso: o.deliveryDate } : null;
  if (o.status === "dikirim" || o.status === "ditagih") return o.dueDate ? { label: "bayar", iso: o.dueDate } : null;
  return null;
}

export type OrderListFilter = "berjalan" | "dibayar" | "semua";

export async function getOrders(opts: {
  unit: UnitFilter;
  allowed: Unit[];
  filter?: OrderListFilter;
  q?: string;
  clientId?: number;
}): Promise<Order[]> {
  const scoped = scopeUnits(opts.unit, opts.allowed);
  if (scoped.length === 0) return [];
  const q = opts.q?.trim();
  const filter = opts.filter ?? "berjalan";
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "orders",
    where: {
      and: [
        { unit: { in: scoped } },
        filter === "berjalan"
          ? { status: { in: [...openOrderStatuses] } }
          : filter === "dibayar"
            ? { status: { equals: "dibayar" } }
            : {},
        opts.clientId ? { client: { equals: opts.clientId } } : {},
        q
          ? { or: [{ number: { contains: q } }, { invoiceNumber: { contains: q } }, { "client.name": { contains: q } }] }
          : {},
      ],
    },
    sort: "-orderDate",
    limit: 1000,
    depth: 1,
  });
  // Open orders first with the nearest deadline on top; closed ones keep newest first.
  const ts = (iso?: string | null) => (iso ? new Date(iso).getTime() : Number.MAX_SAFE_INTEGER);
  return docs.sort((a, b) => {
    const ao = isOpenOrder(a);
    const bo = isOpenOrder(b);
    if (ao !== bo) return ao ? -1 : 1;
    if (ao) return ts(nextDate(a)?.iso) - ts(nextDate(b)?.iso);
    return ts(b.orderDate) - ts(a.orderDate);
  });
}

export interface OrderSummary {
  openCount: number;
  openValue: number;
  /** Invoiced, not yet paid. */
  receivable: number;
  overdueCount: number;
  /** Not yet shipped and due within seven days (or already late). */
  shippingSoon: number;
  upcoming: Order[];
}

export async function getOrderSummary(unit: UnitFilter, allowed: Unit[]): Promise<OrderSummary> {
  const open = await getOrders({ unit, allowed, filter: "berjalan" });
  const now = Date.now();
  const week = now + 7 * 86400000;
  const out: OrderSummary = { openCount: open.length, openValue: 0, receivable: 0, overdueCount: 0, shippingSoon: 0, upcoming: open.slice(0, 5) };
  for (const o of open) {
    const total = orderTotal(o);
    out.openValue += total;
    if (o.status === "ditagih") {
      out.receivable += total;
      if (o.dueDate && new Date(o.dueDate).getTime() < now) out.overdueCount += 1;
    }
    if ((o.status === "diterima" || o.status === "sourcing") && o.deliveryDate && new Date(o.deliveryDate).getTime() <= week) {
      out.shippingSoon += 1;
    }
  }
  return out;
}

/** Cash movements linked to a PO: money received counts as paid, money out as cost. */
export async function getOrderPayments(orderId: number): Promise<{ rows: Transaction[]; paid: number; cost: number }> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({ collection: "transactions", where: { order: { equals: orderId } }, sort: "-date", limit: 100 });
  let paid = 0;
  let cost = 0;
  for (const t of docs) {
    if (t.type === "masuk") paid += t.amount;
    else cost += t.amount;
  }
  return { rows: docs, paid, cost };
}

export async function getClientOptions(allowed: Unit[]): Promise<ClientOption[]> {
  if (allowed.length === 0) return [];
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "clients",
    where: { unit: { in: allowed } },
    sort: "name",
    limit: 500,
    select: { name: true, unit: true },
  });
  return docs.map((c) => ({ id: c.id, name: c.name, unit: c.unit }));
}
