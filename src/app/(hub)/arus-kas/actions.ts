"use server";

import { revalidatePath } from "next/cache";
import { getPayloadClient } from "@/lib/payload";
import { getSessionUser } from "@/lib/session";
import { paymentMethods, transactionCategories, units } from "@/lib/options";

export interface QuickAddState {
  status: "idle" | "success" | "error";
  message?: string;
}

const pick = <T extends readonly { value: string }[]>(opts: T, v: string) =>
  opts.some((o) => o.value === v) ? (v as T[number]["value"]) : undefined;

export async function createTransaction(_prev: QuickAddState, formData: FormData): Promise<QuickAddState> {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && user.role !== "finance")) {
    return { status: "error", message: "Hanya admin dan finance yang bisa mencatat transaksi." };
  }

  const type = String(formData.get("type") ?? "");
  const amount = Number(String(formData.get("amount") ?? "").replace(/\D/g, ""));
  const dateStr = String(formData.get("date") ?? "");
  const category = pick(transactionCategories, String(formData.get("category") ?? ""));
  const unit = pick(units, String(formData.get("unit") ?? ""));
  const method = pick(paymentMethods, String(formData.get("method") ?? ""));
  const clientId = String(formData.get("client") ?? "");
  const reference = String(formData.get("reference") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const receipt = formData.get("receipt");

  if (type !== "masuk" && type !== "keluar") return { status: "error", message: "Pilih masuk atau keluar." };
  if (!amount || amount <= 0) return { status: "error", message: "Nominal harus lebih dari nol." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return { status: "error", message: "Tanggal tidak valid." };
  if (!category) return { status: "error", message: "Pilih kategori." };
  if (!unit) return { status: "error", message: "Pilih unit bisnis." };

  try {
    const payload = await getPayloadClient();
    let receiptId: number | undefined;
    if (receipt instanceof File && receipt.size > 0) {
      if (receipt.size > 8 * 1024 * 1024) return { status: "error", message: "Bukti maksimal 8MB." };
      const uploaded = await payload.create({
        collection: "receipts",
        data: {},
        file: {
          data: Buffer.from(await receipt.arrayBuffer()),
          name: receipt.name,
          mimetype: receipt.type,
          size: receipt.size,
        },
      });
      receiptId = uploaded.id;
    }
    await payload.create({
      collection: "transactions",
      data: {
        unit,
        type,
        amount,
        date: new Date(`${dateStr}T12:00:00`).toISOString(),
        category,
        method,
        client: clientId ? Number(clientId) : undefined,
        reference: reference || undefined,
        notes: notes || undefined,
        receipt: receiptId,
      },
    });
  } catch (error) {
    console.error("createTransaction failed:", error);
    return { status: "error", message: "Gagal menyimpan. Coba lagi." };
  }

  revalidatePath("/arus-kas");
  revalidatePath("/");
  return { status: "success" };
}
