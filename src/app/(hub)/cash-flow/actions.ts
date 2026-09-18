"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Payload } from "payload";
import { getPayloadClient } from "@/lib/payload";
import { canEditMoney, getSessionUser } from "@/lib/session";
import { paymentMethods, transactionCategories, units } from "@/lib/options";
import { canWriteUnit } from "@/lib/access";
import { digits, pick, text } from "@/lib/form-data";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MESSAGE, uploadFile } from "@/lib/uploads";
import { getOrderPayments, orderTotal } from "@/lib/orders";

export interface QuickAddState {
  status: "idle" | "success" | "error";
  message?: string;
}

function revalidate(orderId?: number | null, projectId?: number | null) {
  revalidatePath("/cash-flow");
  revalidatePath("/");
  if (orderId) {
    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
  }
  if (projectId) {
    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
  }
}

/** Flip a PO to paid once the money received covers its value. */
async function settleOrder(payload: Payload, orderId: number) {
  const order = await payload.findByID({ collection: "orders", id: orderId, depth: 0, disableErrors: true });
  if (!order || order.status === "dibayar" || order.status === "batal") return;
  const { paid } = await getOrderPayments(orderId);
  if (paid > 0 && paid >= orderTotal(order)) {
    await payload.update({ collection: "orders", id: orderId, data: { status: "dibayar" } });
  }
}

export async function saveTransaction(_prev: QuickAddState, formData: FormData): Promise<QuickAddState> {
  const user = await getSessionUser();
  if (!user || !canEditMoney(user)) {
    return { status: "error", message: "Hanya admin, finance, dan staf yang bisa mencatat transaksi." };
  }

  const id = Number(formData.get("id") || 0) || null;
  const type = text(formData, "type");
  const amount = Number(digits(text(formData, "amount")));
  const dateStr = text(formData, "date");
  const category = pick(transactionCategories, text(formData, "category"));
  const unit = pick(units, text(formData, "unit"));
  const method = pick(paymentMethods, text(formData, "method"));
  const clientId = Number(text(formData, "client")) || null;
  const orderId = Number(text(formData, "order")) || null;
  const projectId = Number(text(formData, "project")) || null;
  const reference = text(formData, "reference");
  const notes = text(formData, "notes");
  const receipt = formData.get("receipt");

  if (type !== "masuk" && type !== "keluar") return { status: "error", message: "Pilih masuk atau keluar." };
  if (!amount || amount <= 0) return { status: "error", message: "Nominal harus lebih dari nol." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return { status: "error", message: "Tanggal tidak valid." };
  if (!category) return { status: "error", message: "Pilih kategori." };
  if (!unit) return { status: "error", message: "Pilih unit bisnis." };
  if (!canWriteUnit(user, unit, true)) return { status: "error", message: "Anda tidak punya akses ke unit ini." };
  if (receipt instanceof File && receipt.size > MAX_UPLOAD_BYTES) return { status: "error", message: MAX_UPLOAD_MESSAGE };

  try {
    const payload = await getPayloadClient();
    if (orderId) {
      const order = await payload.findByID({ collection: "orders", id: orderId, depth: 0, disableErrors: true });
      if (!order || order.unit !== unit) return { status: "error", message: "PO tidak ditemukan atau bukan dari unit ini." };
    }
    if (projectId) {
      const project = await payload.findByID({ collection: "projects", id: projectId, depth: 0, disableErrors: true });
      if (!project || project.unit !== unit) return { status: "error", message: "Proyek tidak ditemukan atau bukan dari unit ini." };
    }
    let receiptId: number | undefined;
    if (receipt instanceof File && receipt.size > 0) {
      receiptId = (await uploadFile(payload, "receipts", { unit }, receipt)).id;
    }
    const data = {
      unit,
      type: type === "masuk" ? ("masuk" as const) : ("keluar" as const),
      amount,
      date: new Date(`${dateStr}T12:00:00`).toISOString(),
      category,
      method: method ?? null,
      client: clientId,
      order: orderId,
      project: projectId,
      reference: reference || null,
      notes: notes || null,
      ...(receiptId ? { receipt: receiptId } : {}),
    };
    if (id) {
      const existing = await payload.findByID({ collection: "transactions", id, disableErrors: true });
      if (!existing || !canWriteUnit(user, existing.unit, true)) {
        return { status: "error", message: "Transaksi tidak ditemukan atau di luar unit Anda." };
      }
      await payload.update({ collection: "transactions", id, data });
    } else {
      await payload.create({ collection: "transactions", data });
    }
    if (orderId && type === "masuk") await settleOrder(payload, orderId);
  } catch (error) {
    console.error("saveTransaction failed:", error);
    return { status: "error", message: "Gagal menyimpan. Coba lagi." };
  }

  revalidate(orderId, projectId);
  return { status: "success" };
}

export async function deleteTransaction(formData: FormData) {
  const user = await getSessionUser();
  if (!user || !canEditMoney(user)) return;
  const id = Number(formData.get("id") || 0);
  if (!id) return;
  const payload = await getPayloadClient();
  const existing = await payload.findByID({ collection: "transactions", id, depth: 0, disableErrors: true });
  if (!existing || !canWriteUnit(user, existing.unit, true)) return;
  await payload.delete({ collection: "transactions", id });
  revalidate(typeof existing.order === "number" ? existing.order : null, typeof existing.project === "number" ? existing.project : null);
  const back = String(formData.get("closeHref") || "/cash-flow");
  redirect(back);
}
