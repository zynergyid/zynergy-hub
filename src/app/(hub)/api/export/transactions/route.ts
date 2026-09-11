import { getSessionUser } from "@/lib/session";
import { getPayloadClient } from "@/lib/payload";

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** CSV of all transactions for the accountant. Finance and admin only. */
export async function GET() {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && user.role !== "finance")) {
    return new Response("Unauthorized", { status: 401 });
  }
  const payload = await getPayloadClient();
  const { docs } = await payload.find({ collection: "transactions", limit: 10000, sort: "date", depth: 1 });
  const rows = [
    ["tanggal", "jenis", "kategori", "nominal", "klien", "metode", "referensi", "catatan"],
    ...docs.map((t) => [
      t.date.slice(0, 10),
      t.type,
      t.category,
      t.amount,
      typeof t.client === "object" && t.client ? t.client.name : "",
      t.method ?? "",
      t.reference ?? "",
      t.notes ?? "",
    ]),
  ];
  const body = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  return new Response("﻿" + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zynergy-transaksi-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
