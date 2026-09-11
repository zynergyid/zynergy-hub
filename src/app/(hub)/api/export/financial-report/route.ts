import type { NextRequest } from "next/server";
import { canSeeMoney, getSessionUser } from "@/lib/session";
import { monthKey, parseMonth, resolveUnit } from "@/lib/finance";
import { buildFinancialReport } from "@/lib/export/financial-report-xlsx";

/** Cash-basis management report for the komisaris. ?unit=digital|apps|supply|semua and ?month=YYYY-MM. */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !canSeeMoney(user)) return new Response("Unauthorized", { status: 401 });
  const unit = resolveUnit(req.nextUrl.searchParams.get("unit") ?? undefined, user.units);
  const month = parseMonth(req.nextUrl.searchParams.get("month") ?? undefined);
  const buffer = await buildFinancialReport({ unit, allowed: user.units, month, printedBy: user.name });
  const name = `zynergy-laporan-keuangan-${unit}-${monthKey(month)}.xlsx`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
