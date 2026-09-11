import type { Order } from "@/payload-types";
import type { OrderStatus } from "@/lib/options";

/**
 * Pure helpers shared by the client-side OrderForm and the server-side PDF
 * importer. No Payload import here: this file is bundled for the browser.
 */

export interface ClientOptionLike {
  id: number;
  name: string;
}

/** Form-shaped PO data: what the form edits, what the PDF importer fills. Dates are YYYY-MM-DD. */
export interface OrderDraftItem {
  material: string;
  partNumber: string;
  description: string;
  qty: number;
  uom: string;
  unitPrice: number | null;
}
export interface OrderDraft {
  number?: string;
  revision?: number;
  clientId?: number;
  buyerName?: string;
  buyerEmail?: string;
  orderDate?: string;
  deliveryDate?: string;
  shipTo?: string;
  incoterm?: string;
  paymentTermsDays?: number;
  items?: OrderDraftItem[];
  subtotal?: number | null;
  status?: OrderStatus;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  notes?: string;
}

const day = (iso?: string | null) => (iso ? iso.slice(0, 10) : undefined);

export function orderToDraft(o: Order): OrderDraft {
  return {
    number: o.number,
    revision: o.revision ?? 0,
    clientId: typeof o.client === "object" ? o.client.id : o.client,
    buyerName: o.buyerName ?? undefined,
    buyerEmail: o.buyerEmail ?? undefined,
    orderDate: day(o.orderDate),
    deliveryDate: day(o.deliveryDate),
    shipTo: o.shipTo ?? undefined,
    incoterm: o.incoterm ?? undefined,
    paymentTermsDays: o.paymentTermsDays ?? 30,
    items: (o.items ?? []).map((i) => ({
      material: i.material ?? "",
      partNumber: i.partNumber ?? "",
      description: i.description,
      qty: i.qty,
      uom: i.uom ?? "each",
      unitPrice: i.unitPrice ?? null,
    })),
    subtotal: o.subtotal ?? null,
    status: o.status,
    invoiceNumber: o.invoiceNumber ?? undefined,
    invoiceDate: day(o.invoiceDate),
    dueDate: day(o.dueDate),
    notes: o.notes ?? undefined,
  };
}

const normalizeName = (s: string) =>
  s
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(pt|cv|tbk|persero|ltd|inc|co|llc)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Find the client a buyer name on a PO most likely refers to. Exact, then containment, then first word. */
export function matchClient<T extends ClientOptionLike>(name: string | null | undefined, clients: T[]): T | undefined {
  if (!name) return undefined;
  const n = normalizeName(name);
  if (!n) return undefined;
  const exact = clients.find((c) => normalizeName(c.name) === n);
  if (exact) return exact;
  const partial = clients.find((c) => {
    const m = normalizeName(c.name);
    return m.length > 0 && (m.includes(n) || n.includes(m));
  });
  if (partial) return partial;
  const first = n.split(" ")[0];
  if (first.length < 4) return undefined;
  return clients.find((c) => normalizeName(c.name).split(" ")[0] === first);
}

