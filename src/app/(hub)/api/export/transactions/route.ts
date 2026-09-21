import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getPayloadClient } from "@/lib/payload";
import { logActivity } from "@/lib/audit";
import { parseMonth, resolveUnit, scopeUnits } from "@/lib/finance";
import { canSeeMoney } from "@/lib/session";
import { isFinancing } from "@/lib/options";

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** CSV of transactions for the accountant. Optional ?unit=digital|apps|supply|semua and ?month=YYYY-MM. */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !canSeeMoney(user)) {
    return new Response("Unauthorized", { status: 401 });
  }
  await logActivity(await getPayloadClient(), { action: "export", collection: "export", title: "Transaksi (CSV)", summary: req.nextUrl.search ? req.nextUrl.search.slice(1).replace(/&/g, " · ") : null, actor: { id: user.id, name: user.name } });
  const unit = resolveUnit(req.nextUrl.searchParams.get("unit") ?? undefined, user.units);
  const scoped = scopeUnits(unit, user.units);
  const month_ = req.nextUrl.searchParams.get("month");
  const month = month_ ? parseMonth(month_) : null;
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
    ["tanggal", "unit", "jenis", "kategori", "kelompok", "nominal", "klien", "metode", "referensi", "catatan"],
    ...docs.map((t) => [
      t.date.slice(0, 10),
      t.unit,
      t.type,
      t.category,
      isFinancing(t.category) ? "pendanaan" : "operasional",
      t.amount,
      typeof t.client === "object" && t.client ? t.client.name : "",
      t.method ?? "",
      t.reference ?? "",
      t.notes ?? "",
    ]),
  ];
  const body = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  const name = `zynergy-${unit}-${month_ ?? "semua"}.csv`;
  return new Response("﻿" + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
    },
  });
}
