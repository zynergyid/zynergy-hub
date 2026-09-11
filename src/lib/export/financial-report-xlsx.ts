import ExcelJS from "exceljs";
import { getBalancesAt, getPnl, scopeUnits, type UnitFilter } from "@/lib/finance";
import { daysUntil, formatMonthLong } from "@/lib/format";
import { clientOf, getOrderBook, type OrderBookEntry } from "@/lib/orders";
import { categoryLabel, categoryType, orderStatusLabel, unitLabel, type Unit } from "@/lib/options";
import { addCashFlowSheets, scopeLabel } from "./cash-flow-xlsx";
import { DATE, GREEN, IDR, MUTED, NAVY, RED, SOFT, border, brandHeader, fill, font, pageFooter, sectionTitle, styleHeaderRow } from "./style";

/**
 * Management financial report on a cash basis for the komisaris: P&L for the
 * month and year to date per unit, financing, cash position, receivables and
 * open POs, then the cash book as appendix. Labeled as cash basis: the formal
 * statements under SAK are the accountant's job, built from this data.
 */

export interface FinancialReportOptions {
  unit: UnitFilter;
  allowed: Unit[];
  month: Date;
  printedBy: string;
}

type Matrix = Map<string, Partial<Record<Unit, number>>>;
interface MatrixRow {
  label: string;
  values?: number[];
  style: "group" | "item" | "total" | "result";
  color?: string;
}

const sumRows = (matrix: Matrix, cats: string[], units: Unit[]) => units.map((u) => cats.reduce((s, c) => s + (matrix.get(c)?.[u] ?? 0), 0));
const grand = (values: number[]) => values.reduce((s, v) => s + v, 0);

/** Revenue lines, total, expense lines, total, surplus. Categories sorted by size. */
function pnlRows(matrix: Matrix, units: Unit[]): MatrixRow[] {
  const cats = [...matrix.keys()];
  const bySize = (a: string, b: string) => grand(sumRows(matrix, [b], units)) - grand(sumRows(matrix, [a], units));
  const revenue = cats.filter((c) => categoryType.get(c) === "masuk").sort(bySize);
  const expense = cats.filter((c) => categoryType.get(c) === "keluar").sort(bySize);
  const revenueTotal = sumRows(matrix, revenue, units);
  const expenseTotal = sumRows(matrix, expense, units);
  return [
    { label: "Pendapatan operasional", style: "group" },
    ...revenue.map((c) => ({ label: categoryLabel.get(c) ?? c, values: sumRows(matrix, [c], units), style: "item" as const })),
    ...(revenue.length ? [] : [{ label: "(tidak ada pemasukan)", values: units.map(() => 0), style: "item" as const }]),
    { label: "Total pendapatan", values: revenueTotal, style: "total", color: GREEN },
    { label: "Beban operasional", style: "group" },
    ...expense.map((c) => ({ label: categoryLabel.get(c) ?? c, values: sumRows(matrix, [c], units), style: "item" as const })),
    ...(expense.length ? [] : [{ label: "(tidak ada pengeluaran)", values: units.map(() => 0), style: "item" as const }]),
    { label: "Total beban", values: expenseTotal, style: "total", color: RED },
    { label: "Surplus (defisit) kas operasional", values: units.map((_, i) => revenueTotal[i] - expenseTotal[i]), style: "result" },
  ];
}

function financingRows(matrix: Matrix, units: Unit[]): MatrixRow[] {
  const cats = [...matrix.keys()];
  if (cats.length === 0) return [];
  const signed = (c: string) => sumRows(matrix, [c], units).map((v) => (categoryType.get(c) === "masuk" ? v : -v));
  const net = units.map((_, i) => cats.reduce((s, c) => s + signed(c)[i], 0));
  return [
    { label: "Pendanaan (bukan hasil usaha)", style: "group" },
    ...cats.map((c) => ({ label: categoryLabel.get(c) ?? c, values: signed(c), style: "item" as const })),
    { label: "Pendanaan bersih", values: net, style: "result" },
  ];
}

/** Table with one column per unit plus Total; returns the next free row. */
function writeMatrix(ws: ExcelJS.Worksheet, startRow: number, title: string, units: Unit[], rows: MatrixRow[]): number {
  sectionTitle(ws, startRow, title);
  const header = ws.getRow(startRow + 1);
  const withTotal = units.length > 1;
  header.values = ["Keterangan", ...units.map((u) => unitLabel.get(u) ?? u), ...(withTotal ? ["Total"] : [])];
  const lastCol = 1 + units.length + (withTotal ? 1 : 0);
  styleHeaderRow(header, lastCol);
  let r = startRow + 2;
  for (const row of rows) {
    const line = ws.getRow(r);
    line.getCell(1).value = row.label;
    if (row.values) {
      row.values.forEach((v, i) => {
        line.getCell(2 + i).value = v;
      });
      if (withTotal) line.getCell(lastCol).value = grand(row.values);
    }
    for (let c = 1; c <= lastCol; c++) {
      const cell = line.getCell(c);
      cell.border = border;
      if (c > 1) cell.numFmt = IDR;
      if (row.style === "group") {
        cell.fill = fill(SOFT);
        cell.font = font({ bold: true, color: { argb: MUTED } });
      } else if (row.style === "total") {
        cell.font = font({ bold: true, color: { argb: row.color ?? NAVY } });
        cell.border = { ...border, top: { style: "thin", color: { argb: NAVY } } };
      } else if (row.style === "result") {
        cell.fill = fill(SOFT);
        cell.font = font({ bold: true, size: 11, color: { argb: NAVY } });
        cell.border = { ...border, top: { style: "medium", color: { argb: NAVY } }, bottom: { style: "medium", color: { argb: NAVY } } };
      } else {
        cell.font = font();
        if (c === 1) cell.alignment = { indent: 1 };
      }
    }
    r += 1;
  }
  return r + 1;
}

function labelValue(ws: ExcelJS.Worksheet, row: number, label: string, value: number | string, opts: { bold?: boolean; color?: string; numFmt?: string } = {}) {
  ws.getCell(`A${row}`).value = label;
  ws.getCell(`A${row}`).font = font({ color: { argb: MUTED } });
  const cell = ws.getCell(`B${row}`);
  cell.value = value;
  if (typeof value === "number") cell.numFmt = opts.numFmt ?? IDR;
  cell.font = font({ bold: opts.bold ?? true, color: { argb: opts.color ?? NAVY } });
  cell.alignment = { horizontal: "right" };
}

function orderTable(ws: ExcelJS.Worksheet, startRow: number, title: string, headers: string[], entries: OrderBookEntry[], cells: (e: OrderBookEntry) => ExcelJS.CellValue[], money: number[], empty: string): number {
  sectionTitle(ws, startRow, title);
  const header = ws.getRow(startRow + 1);
  header.values = headers;
  styleHeaderRow(header, headers.length);
  let r = startRow + 2;
  for (const e of entries) {
    const row = ws.getRow(r);
    row.values = cells(e);
    for (let c = 1; c <= headers.length; c++) {
      const cell = row.getCell(c);
      cell.border = border;
      cell.font = font();
      if (r % 2 === 0) cell.fill = fill(SOFT);
      if (money.includes(c)) cell.numFmt = IDR;
      if (cell.value instanceof Date) cell.numFmt = DATE;
    }
    r += 1;
  }
  if (entries.length === 0) {
    ws.getCell(`A${r}`).value = empty;
    ws.getCell(`A${r}`).font = font({ italic: true, color: { argb: MUTED } });
    r += 1;
  }
  return r + 1;
}

export async function buildFinancialReport(opts: FinancialReportOptions): Promise<Buffer> {
  const { unit, allowed, month, printedBy } = opts;
  const units = scopeUnits(unit, allowed);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const yearStart = new Date(month.getFullYear(), 0, 1);
  const scope = scopeLabel(unit);
  const period = formatMonthLong(month);
  const [pnlMonth, pnlYtd, balances, book] = await Promise.all([
    getPnl(units, month, monthEnd),
    getPnl(units, yearStart, monthEnd),
    getBalancesAt(units, monthEnd),
    getOrderBook(units),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Zynergy Hub";
  wb.created = new Date();

  // Sheet 1: the summary the komisaris reads.
  const ws = wb.addWorksheet("Ringkasan", {
    pageSetup: { orientation: "portrait", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } },
    headerFooter: pageFooter(scope, period, "Laporan Keuangan Ringkas"),
  });
  ws.columns = [{ width: 40 }, ...units.map(() => ({ width: 18 })), { width: 18 }];
  brandHeader(ws, wb, "Laporan Keuangan Ringkas", `${scope} · ${period} · basis kas`, printedBy);
  ws.getCell("A4").value = "Disusun dari buku kas Hub (basis kas). Laporan keuangan resmi sesuai SAK (neraca, laba rugi akrual, catatan) disusun oleh akuntan PT dari data ini.";
  ws.getCell("A4").font = font({ size: 9, italic: true, color: { argb: MUTED } });

  let r = 6;
  r = writeMatrix(ws, r, `Laba rugi basis kas, ${period}`, units, pnlRows(pnlMonth.operating, units));
  r = writeMatrix(ws, r, `Laba rugi basis kas, tahun berjalan (Januari sampai ${period})`, units, pnlRows(pnlYtd.operating, units));
  const financing = financingRows(pnlYtd.financing, units);
  if (financing.length) r = writeMatrix(ws, r, `Pendanaan, tahun berjalan`, units, financing);

  r = writeMatrix(ws, r, `Posisi kas akhir ${period}`, units, [{ label: "Saldo kas", values: units.map((u) => balances[u] ?? 0), style: "result" }]);

  sectionTitle(ws, r, "Piutang dan PO berjalan");
  r += 1;
  const receivable = book.receivables.reduce((s, e) => s + e.remaining, 0);
  const overdue = book.receivables.filter((e) => e.order.dueDate && daysUntil(e.order.dueDate) < 0);
  const pipeline = book.pipeline.reduce((s, e) => s + e.total, 0);
  labelValue(ws, r++, `Piutang PO belum dibayar (${book.receivables.length} PO)`, receivable);
  labelValue(ws, r++, `Di antaranya lewat jatuh tempo (${overdue.length} PO)`, overdue.reduce((s, e) => s + e.remaining, 0), { color: overdue.length ? RED : NAVY });
  labelValue(ws, r++, `PO diterima, belum dikirim dan belum ditagih (${book.pipeline.length} PO)`, pipeline);
  labelValue(ws, r++, "Rincian di lembar \"Piutang & PO\"", "", { bold: false });
  r += 1;

  // Signature block.
  const sigCol = Math.max(2, units.length + (units.length > 1 ? 1 : 0));
  const sigColLetter = ws.getColumn(sigCol).letter;
  ws.getCell(`A${r}`).value = "Disiapkan oleh,";
  ws.getCell(`${sigColLetter}${r}`).value = "Diperiksa oleh,";
  ws.getCell(`A${r + 4}`).value = "(Finance)";
  ws.getCell(`${sigColLetter}${r + 4}`).value = "(Komisaris)";
  for (const ref of [`A${r}`, `${sigColLetter}${r}`]) ws.getCell(ref).font = font({ color: { argb: MUTED } });
  for (const ref of [`A${r + 4}`, `${sigColLetter}${r + 4}`]) {
    ws.getCell(ref).font = font({ bold: true, color: { argb: NAVY } });
    ws.getCell(ref).border = { top: { style: "thin", color: { argb: NAVY } } };
  }

  // Sheet 2: receivables and open POs.
  const ws2 = wb.addWorksheet("Piutang & PO", {
    pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    headerFooter: pageFooter(scope, period, "Piutang & PO"),
  });
  ws2.columns = [{ width: 20 }, { width: 30 }, { width: 10 }, { width: 11 }, { width: 20 }, { width: 14 }, { width: 17 }, { width: 17 }, { width: 17 }, { width: 12 }];
  brandHeader(ws2, wb, "Piutang dan PO Berjalan", `${scope} · per ${period}`, printedBy);
  let r2 = 5;
  r2 = orderTable(
    ws2,
    r2,
    "Piutang: PO sudah dikirim atau ditagih, belum lunas",
    ["Nomor PO", "Klien", "Unit", "Status", "Invoice", "Jatuh tempo", "Nilai PO", "Dibayar", "Sisa", "Terlambat (hari)"],
    book.receivables,
    (e) => [
      e.order.number,
      clientOf(e.order)?.name ?? "",
      unitLabel.get(e.order.unit) ?? e.order.unit,
      orderStatusLabel.get(e.order.status) ?? e.order.status,
      e.order.invoiceNumber ?? "",
      e.order.dueDate ? new Date(e.order.dueDate) : "",
      e.total,
      e.paid,
      e.remaining,
      e.order.dueDate && daysUntil(e.order.dueDate) < 0 ? -daysUntil(e.order.dueDate) : "",
    ],
    [7, 8, 9],
    "Tidak ada piutang.",
  );
  orderTable(
    ws2,
    r2,
    "PO berjalan: diterima, belum dikirim",
    ["Nomor PO", "Klien", "Unit", "Status", "Buyer", "Tenggat kirim", "Nilai PO"],
    book.pipeline,
    (e) => [
      e.order.number,
      clientOf(e.order)?.name ?? "",
      unitLabel.get(e.order.unit) ?? e.order.unit,
      orderStatusLabel.get(e.order.status) ?? e.order.status,
      e.order.buyerName ?? "",
      e.order.deliveryDate ? new Date(e.order.deliveryDate) : "",
      e.total,
    ],
    [7],
    "Tidak ada PO berjalan.",
  );

  // Appendix: the cash book itself.
  await addCashFlowSheets(wb, { unit, allowed, month, printedBy });
  return Buffer.from(await wb.xlsx.writeBuffer());
}
