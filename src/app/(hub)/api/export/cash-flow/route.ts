import type { NextRequest } from "next/server";
import { canSeeMoney, getSessionUser } from "@/lib/session";
import { getPayloadClient } from "@/lib/payload";
import { logActivity } from "@/lib/audit";
import { monthKey, parseMonth, resolveUnit } from "@/lib/finance";
import { buildCashFlowWorkbook } from "@/lib/export/cash-flow-xlsx";

/** Styled Excel report of one month's cash flow. ?unit=digital|apps|supply|semua and ?month=YYYY-MM. */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !canSeeMoney(user)) return new Response("Unauthorized", { status: 401 });
  await logActivity(await getPayloadClient(), { action: "export", collection: "export", title: "Arus kas (Excel)", summary: req.nextUrl.search ? req.nextUrl.search.slice(1).replace(/&/g, " · ") : null, actor: { id: user.id, name: user.name } });
  const unit = resolveUnit(req.nextUrl.searchParams.get("unit") ?? undefined, user.units);
  const month = parseMonth(req.nextUrl.searchParams.get("month") ?? undefined);
  const buffer = await buildCashFlowWorkbook({ unit, allowed: user.units, month, printedBy: user.name });
  const name = `zynergy-arus-kas-${unit}-${monthKey(month)}.xlsx`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
