"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Order } from "@/payload-types";
import { getPayloadClient } from "@/lib/payload";
import { extractPurchaseOrder, type AiCallUsage } from "@/lib/ai/openai";
import { getClientOptions } from "@/lib/orders";
import { matchClient, type OrderDraft } from "@/lib/order-draft";
import { formatIDR } from "@/lib/format";
import { canEditMoney, getSessionUser } from "@/lib/session";
import { canTouchOrder, canWriteUnit } from "@/lib/access";
import { dateOrNull, digits, pick, text } from "@/lib/form-data";
import { MAX_UPLOAD_BYTES, uploadFile } from "@/lib/uploads";
import { documentKinds, orderStatuses, units } from "@/lib/options";

export interface OrderFormState {
  status: "idle" | "success" | "error";
  message?: string;
  id?: number;
}

const err = (message: string): OrderFormState => ({ status: "error", message });
const str = (v: unknown) => String(v ?? "").trim();

interface ItemInput {
  material?: unknown;
  partNumber?: unknown;
  description?: unknown;
  qty?: unknown;
  uom?: unknown;
  unitPrice?: unknown;
}

/** Existing document rows as plain data, so an update keeps them. */
const keepDocuments = (order: Order | null) =>
  (order?.documents ?? []).map((d) => ({
    id: d.id ?? undefined,
    kind: d.kind,
    file: typeof d.file === "object" && d.file ? d.file.id : d.file,
    note: d.note ?? null,
  }));

function revalidateOrders(id?: number) {
  revalidatePath("/orders");
  revalidatePath("/");
  revalidatePath("/cash-flow");
  if (id) revalidatePath(`/orders/${id}`);
}

export async function saveOrder(_prev: OrderFormState, formData: FormData): Promise<OrderFormState> {
  const user = await getSessionUser();
  if (!user) return err("Sesi habis, login lagi.");
  if (!canEditMoney(user)) return err("Hanya admin dan finance yang bisa mengubah pesanan.");

  const id = Number(formData.get("id") || 0) || null;
  const unit = pick(units, text(formData, "unit"));
  if (!unit) return err("Pilih unit bisnis.");
  if (!canWriteUnit(user, unit, true)) return err("Anda tidak punya akses ke unit ini.");
  const number = text(formData, "number");
  if (!number) return err("Nomor PO wajib diisi.");
  const clientId = Number(text(formData, "client")) || 0;
  if (!clientId) return err("Pilih klien.");
  const orderDate = dateOrNull(text(formData, "orderDate"));
  if (!orderDate) return err("Tanggal PO wajib diisi.");
  const buyerEmail = text(formData, "buyerEmail");
  if (buyerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) return err("Format email buyer tidak valid.");

  let raw: unknown;
  try {
    raw = JSON.parse(text(formData, "items") || "[]");
  } catch {
    return err("Data item tidak valid.");
  }
  if (!Array.isArray(raw)) return err("Data item tidak valid.");
  const items = [];
  for (const [i, it] of (raw as ItemInput[]).entries()) {
    const description = str(it.description);
    const qty = Number(it.qty);
    const unitPrice = Number(it.unitPrice);
    if (!description) return err(`Item ${i + 1}: deskripsi wajib diisi.`);
    if (!(qty > 0)) return err(`Item ${i + 1}: qty harus lebih dari nol.`);
    if (!(unitPrice >= 0)) return err(`Item ${i + 1}: harga tidak valid.`);
    items.push({
      material: str(it.material) || null,
      partNumber: str(it.partNumber) || null,
      description,
      qty,
      uom: str(it.uom) || "each",
      unitPrice,
    });
  }
  const subtotal = Number(digits(text(formData, "subtotal"))) || null;
  const terms = text(formData, "paymentTermsDays");
  const poFile = formData.get("poFile");
  if (poFile instanceof File && poFile.size > MAX_UPLOAD_BYTES) return err("Berkas maksimal 8MB.");

  try {
    const payload = await getPayloadClient();
    const client = await payload.findByID({ collection: "clients", id: clientId, disableErrors: true });
    if (!client || client.unit !== unit) return err("Klien tidak ditemukan atau bukan dari unit ini.");
    let existing: Order | null = null;
    if (id) {
      existing = await payload.findByID({ collection: "orders", id, depth: 0, disableErrors: true });
      if (!existing || !canWriteUnit(user, existing.unit, true)) return err("PO tidak ditemukan atau di luar unit Anda.");
    }
    const revision = Math.max(0, Math.floor(Number(text(formData, "revision")) || 0));
    const documents = keepDocuments(existing);
    if (poFile instanceof File && poFile.size > 0) {
      const uploaded = await uploadFile(payload, "documents", unit, poFile);
      documents.push({ id: undefined, kind: "po", file: uploaded.id, note: revision ? `Revisi ${revision}` : null });
    }
    const data = {
      unit,
      number,
      revision,
      client: clientId,
      orderDate,
      deliveryDate: dateOrNull(text(formData, "deliveryDate")),
      buyerName: text(formData, "buyerName") || null,
      buyerEmail: buyerEmail || null,
      shipTo: text(formData, "shipTo") || null,
      incoterm: text(formData, "incoterm") || null,
      paymentTermsDays: terms === "" ? 30 : Math.max(0, Number(terms) || 0),
      items,
      // The collection hook recomputes this from the items whenever there are any.
      subtotal: items.length ? 0 : subtotal,
      status: pick(orderStatuses, text(formData, "status")) ?? "diterima",
      invoiceNumber: text(formData, "invoiceNumber") || null,
      invoiceDate: dateOrNull(text(formData, "invoiceDate")),
      dueDate: dateOrNull(text(formData, "dueDate")),
      documents,
      notes: text(formData, "notes") || null,
    };
    const doc = id
      ? await payload.update({ collection: "orders", id, data })
      : await payload.create({ collection: "orders", data });
    revalidateOrders(doc.id);
    return { status: "success", id: doc.id };
  } catch (error) {
    console.error("saveOrder failed:", error);
    return err("Gagal menyimpan. Coba lagi.");
  }
}

export type ImportResult =
  | { status: "ok"; draft: OrderDraft; warnings: string[]; usage: AiCallUsage; buyerCompany: string | null }
  | { status: "error"; message: string };

const isoDay = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

/** Read a buyer's PO PDF and return a form draft. Nothing is saved until the person presses Simpan. */
export async function importOrderPdf(formData: FormData): Promise<ImportResult> {
  const user = await getSessionUser();
  if (!user || !canEditMoney(user)) return { status: "error", message: "Hanya admin, finance, dan staf yang bisa mengimpor PO." };
  const unit = pick(units, text(formData, "unit")) ?? "supply";
  if (!canWriteUnit(user, unit, true)) return { status: "error", message: "Anda tidak punya akses ke unit ini." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { status: "error", message: "Pilih PDF PO dulu." };
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return { status: "error", message: "Impor hanya menerima PDF." };
  if (file.size > MAX_UPLOAD_BYTES) return { status: "error", message: "Berkas maksimal 8MB." };

  try {
    const { data, usage } = await extractPurchaseOrder(file);
    const clients = await getClientOptions([unit]);
    const client = matchClient(data.buyer_company, clients);
    const items = data.items
      .filter((i) => str(i.description))
      .map((i) => ({
        material: str(i.material),
        partNumber: str(i.part_number),
        description: str(i.description).slice(0, 200),
        qty: Number(i.qty) || 0,
        uom: str(i.uom) || "each",
        unitPrice: i.unit_price === null ? null : Number(i.unit_price) || 0,
      }));

    const warnings: string[] = [];
    if (!data.po_number) warnings.push("Nomor PO tidak terbaca, isi manual.");
    if (!isoDay(data.order_date)) warnings.push("Tanggal PO tidak terbaca, isi manual.");
    if (!client) {
      warnings.push(
        data.buyer_company
          ? `Klien "${data.buyer_company}" belum ada di unit ini. Pilih klien yang ada atau buat dulu.`
          : "Nama pembeli tidak terbaca, pilih klien manual.",
      );
    }
    if (items.length === 0) warnings.push("Tidak ada item yang terbaca.");
    if (items.some((i) => i.unitPrice === null)) warnings.push("Ada item tanpa harga satuan, lengkapi manual.");
    const sum = items.reduce((s, i) => s + i.qty * (i.unitPrice ?? 0), 0);
    if (data.total_excl_tax && Math.abs(sum - data.total_excl_tax) > 1) {
      warnings.push(`Jumlah item ${formatIDR(sum)} berbeda dari total di PO ${formatIDR(data.total_excl_tax)}. Periksa qty dan harga.`);
    }
    if (data.currency && data.currency.toUpperCase() !== "IDR") warnings.push(`Mata uang di PO ${data.currency}; Hub mencatat dalam Rupiah.`);

    if (usage.model !== "mock") {
      const payload = await getPayloadClient();
      await payload.create({
        collection: "ai-usage",
        data: { feature: "po-import", model: usage.model, unit, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, costUsd: usage.costUsd, user: user.id, note: file.name },
      });
    }

    const draft: OrderDraft = {
      number: data.po_number ?? undefined,
      revision: data.revision ?? 0,
      clientId: client?.id,
      buyerName: data.buyer_name ?? undefined,
      buyerEmail: data.buyer_email ?? undefined,
      orderDate: isoDay(data.order_date),
      deliveryDate: isoDay(data.delivery_date),
      shipTo: data.ship_to ?? undefined,
      incoterm: data.incoterm ?? undefined,
      paymentTermsDays: data.payment_terms_days ?? 30,
      items,
      subtotal: items.length ? null : (data.total_excl_tax ?? null),
      notes: data.notes ?? undefined,
    };
    return { status: "ok", draft, warnings, usage, buyerCompany: data.buyer_company };
  } catch (error) {
    console.error("importOrderPdf failed:", error);
    return { status: "error", message: error instanceof Error ? error.message : "Gagal membaca PDF." };
  }
}

export async function deleteOrder(formData: FormData) {
  const user = await getSessionUser();
  if (!user || !canEditMoney(user)) return;
  const id = Number(formData.get("id") || 0);
  if (!id) return;
  const payload = await getPayloadClient();
  const existing = await payload.findByID({ collection: "orders", id, depth: 0, disableErrors: true });
  if (!existing || !canWriteUnit(user, existing.unit, true)) return;
  for (const d of keepDocuments(existing)) {
    await payload.delete({ collection: "documents", id: d.file }).catch(() => undefined);
  }
  await payload.delete({ collection: "orders", id });
  revalidateOrders();
  redirect("/orders");
}

/** Status and documents: anyone working in the order's unit, not only money roles. */
async function loadTouchable(orderId: number) {
  const user = await getSessionUser();
  if (!user) return null;
  const payload = await getPayloadClient();
  const order = await payload.findByID({ collection: "orders", id: orderId, depth: 0, disableErrors: true });
  if (!order || !canTouchOrder(user, order.unit)) return null;
  return { payload, order };
}

export async function updateOrderStatus(formData: FormData) {
  const orderId = Number(formData.get("orderId") || 0);
  if (!orderId) return;
  const ctx = await loadTouchable(orderId);
  if (!ctx) return;
  const status = pick(orderStatuses, text(formData, "status"));
  if (!status) return;
  await ctx.payload.update({ collection: "orders", id: orderId, data: { status, notes: text(formData, "notes") || null } });
  revalidateOrders(orderId);
  redirect(`/orders/${orderId}`);
}

export async function addDocument(formData: FormData) {
  const orderId = Number(formData.get("orderId") || 0);
  if (!orderId) return;
  const ctx = await loadTouchable(orderId);
  if (!ctx) return;
  const file = formData.get("file");
  const kind = pick(documentKinds, text(formData, "kind")) ?? "lainnya";
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_UPLOAD_BYTES) redirect(`/orders/${orderId}?error=berkas`);
  try {
    const uploaded = await uploadFile(ctx.payload, "documents", ctx.order.unit, file);
    await ctx.payload.update({
      collection: "orders",
      id: orderId,
      data: { documents: [...keepDocuments(ctx.order), { id: undefined, kind, file: uploaded.id, note: text(formData, "note") || null }] },
    });
  } catch (error) {
    console.error("addDocument failed:", error);
    redirect(`/orders/${orderId}?error=berkas`);
  }
  revalidateOrders(orderId);
  redirect(`/orders/${orderId}`);
}

export async function removeDocument(formData: FormData) {
  const orderId = Number(formData.get("orderId") || 0);
  const rowId = text(formData, "rowId");
  if (!orderId || !rowId) return;
  const ctx = await loadTouchable(orderId);
  if (!ctx) return;
  const rows = keepDocuments(ctx.order);
  const gone = rows.find((r) => r.id === rowId);
  if (!gone) return;
  await ctx.payload.update({ collection: "orders", id: orderId, data: { documents: rows.filter((r) => r.id !== rowId) } });
  await ctx.payload.delete({ collection: "documents", id: gone.file }).catch(() => undefined);
  revalidateOrders(orderId);
  redirect(`/orders/${orderId}`);
}
