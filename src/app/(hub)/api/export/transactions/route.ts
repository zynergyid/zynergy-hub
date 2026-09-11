import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getPayloadClient } from "@/lib/payload";
import { parseMonth, scopeUnits } from "@/lib/finance";
import { canSeeMoney } from "@/lib/session";

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** CSV of transactions for the accountant. Optional ?unit=digital|supply|semua and ?bulan=YYYY-MM. */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !canSeeMoney(user)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const unitParam = req.nextUrl.searchParams.get("unit") ?? "semua";
  const scoped = scopeUnits(unitParam as "semua" | "digital" | "products" | "supply", user.units);
  const bulan = req.nextUrl.searchParams.get("bulan");
  const month = bulan ? parseMonth(bulan) : null;
  const end = month ? new Date(month.getFullYear(), month.getMonth() + 1, 1) : null;

  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "transactions",
    limit: 10000,
    sort: "date",
    depth: 1,
    where: {
      and: [
        { unit: { in: scoped.length ? scoped : ["none"] } },
        month && end
          ? { and: [{ date: { greater_than_equal: month.toISOString() } }, { date: { less_than: end.toISOString() } }] }
          : {},
      ],
    },
  });
  const rows = [
    ["tanggal", "unit", "jenis", "kategori", "nominal", "klien", "metode", "referensi", "catatan"],
    ...docs.map((t) => [
      t.date.slice(0, 10),
      t.unit,
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
  const name = `zynergy-${unitParam}-${bulan ?? "semua"}.csv`;
  return new Response("﻿" + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
    },
  });
}
