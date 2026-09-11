import ExcelJS from "exceljs";
import { getLedger, type UnitFilter } from "@/lib/finance";
import { formatMonthLong } from "@/lib/format";
import { categoryLabel, isFinancing, unitLabel, type Unit } from "@/lib/options";
import { DATE, GREEN, IDR, INK, MUTED, NAVY, RED, SOFT, border, brandHeader, fill, font, pageFooter, styleHeaderRow } from "./style";

/**
 * The monthly cash book as worksheets: brand header, summary block, the
 * ledger with running balance, and a per-category sheet. Everything comes
 * from getLedger, the same numbers the screen shows.
 */

export interface CashFlowSheetOptions {
  unit: UnitFilter;
  allowed: Unit[];
  month: Date;
  printedBy: string;
}

export const scopeLabel = (unit: UnitFilter) => (unit === "semua" ? "Semua unit" : `Zynergy ${unitLabel.get(unit)}`);

export async function addCashFlowSheets(wb: ExcelJS.Workbook, opts: CashFlowSheetOptions) {
  const { unit, allowed, month, printedBy } = opts;
  const ledger = await getLedger({ unit, allowed, month });
  const rows = [...ledger.rows].reverse(); // oldest first, like a bank statement
  const scope = scopeLabel(unit);
  const period = formatMonthLong(month);

  const ws = wb.addWorksheet("Arus Kas", {
    views: [{ state: "frozen", ySplit: 12 }],
    pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } },
    headerFooter: pageFooter(scope, period, "Arus Kas"),
  });
  ws.columns = [
    { key: "date", width: 13 },
    { key: "unit", width: 10 },
    { key: "type", width: 9 },
    { key: "category", width: 24 },
    { key: "kind", width: 12 },
    { key: "reference", width: 38 },
    { key: "client", width: 26 },
    { key: "order", width: 18 },
    { key: "method", width: 10 },
    { key: "in", width: 17 },
    { key: "out", width: 17 },
    { key: "balance", width: 17 },
    { key: "notes", width: 32 },
  ];
  brandHeader(ws, wb, "Laporan Arus Kas", `${scope} · ${period}`, printedBy);

  const summary: [string, number, string?][] = [
    ["Saldo awal bulan", ledger.opening],
    ["Masuk operasional", ledger.masuk, GREEN],
    ["Keluar operasional", ledger.keluar, RED],
  ];
  if (ledger.fundingMasuk) summary.push(["Pendanaan masuk (modal, pinjaman)", ledger.fundingMasuk]);
  if (ledger.fundingKeluar) summary.push(["Pendanaan keluar (cicilan, prive)", ledger.fundingKeluar]);
  summary.push(["Saldo akhir bulan", ledger.closing, NAVY]);
  let r = 5;
  for (const [label, value, color] of summary) {
    ws.getCell(`A${r}`).value = label;
    ws.getCell(`A${r}`).font = font({ color: { argb: MUTED } });
    ws.mergeCells(`C${r}:D${r}`);
    const valueCell = ws.getCell(`C${r}`);
    valueCell.value = value;
    valueCell.numFmt = IDR;
    valueCell.font = font({ bold: true, size: 11, color: { argb: color ?? INK } });
    valueCell.alignment = { horizontal: "right" };
    r += 1;
  }

  const headerRowNo = 12;
  const header = ws.getRow(headerRowNo);
  header.values = ["Tanggal", "Unit", "Jenis", "Kategori", "Kelompok", "Keterangan", "Klien", "PO", "Metode", "Masuk", "Keluar", "Saldo", "Catatan"];
  styleHeaderRow(header, 13);
  ws.autoFilter = { from: { row: headerRowNo, column: 1 }, to: { row: headerRowNo, column: 13 } };

  let rowNo = headerRowNo + 1;
  for (const { tx, balance } of rows) {
    const row = ws.getRow(rowNo);
    const clientName = typeof tx.client === "object" && tx.client ? tx.client.name : "";
    const orderNo = typeof tx.order === "object" && tx.order ? tx.order.number : "";
    row.values = [
      new Date(tx.date),
      unitLabel.get(tx.unit) ?? tx.unit,
      tx.type === "masuk" ? "Masuk" : "Keluar",
      categoryLabel.get(tx.category) ?? tx.category,
      isFinancing(tx.category) ? "Pendanaan" : "Operasional",
      tx.reference ?? "",
      clientName,
      orderNo,
      tx.method ?? "",
      tx.type === "masuk" ? tx.amount : null,
      tx.type === "keluar" ? tx.amount : null,
      balance,
      tx.notes ?? "",
    ];
    row.getCell(1).numFmt = DATE;
    for (const c of [10, 11, 12]) row.getCell(c).numFmt = IDR;
    row.getCell(10).font = font({ color: { argb: GREEN }, bold: true });
    row.getCell(11).font = font({ color: { argb: RED }, bold: true });
    row.getCell(12).font = font({ bold: true });
    for (let c = 1; c <= 13; c++) {
      const cell = row.getCell(c);
      cell.border = border;
      if (rowNo % 2 === 0) cell.fill = fill(SOFT);
      if (!cell.font) cell.font = font();
      cell.alignment = { vertical: "middle", wrapText: c === 6 || c === 13 };
    }
    rowNo += 1;
  }
  if (rows.length === 0) {
    ws.getCell(`A${rowNo}`).value = "Tidak ada transaksi pada periode ini.";
    ws.getCell(`A${rowNo}`).font = font({ italic: true, color: { argb: MUTED } });
    rowNo += 1;
  }

  const first = headerRowNo + 1;
  const last = Math.max(rowNo - 1, first);
  const total = ws.getRow(rowNo);
  total.getCell(1).value = "Total";
  total.getCell(10).value = rows.length ? { formula: `SUM(J${first}:J${last})`, result: ledger.masuk + ledger.fundingMasuk } : 0;
  total.getCell(11).value = rows.length ? { formula: `SUM(K${first}:K${last})`, result: ledger.keluar + ledger.fundingKeluar } : 0;
  total.getCell(12).value = ledger.closing;
  for (let c = 1; c <= 13; c++) {
    const cell = total.getCell(c);
    cell.fill = fill(SOFT);
    cell.font = font({ bold: true, color: { argb: NAVY } });
    cell.border = { ...border, top: { style: "medium", color: { argb: NAVY } } };
    if (c >= 10 && c <= 12) cell.numFmt = IDR;
  }
  ws.getCell(`A${rowNo + 2}`).value = "Masuk dan Keluar di ringkasan hanya operasional; total di tabel mencakup pendanaan. Saldo berjalan dihitung dari semua transaksi unit sejak awal.";
  ws.getCell(`A${rowNo + 2}`).font = font({ size: 9, italic: true, color: { argb: MUTED } });

  // Per category for the month.
  const byCat = new Map<string, { type: "masuk" | "keluar"; count: number; total: number }>();
  for (const { tx } of rows) {
    const cur = byCat.get(tx.category) ?? { type: tx.type, count: 0, total: 0 };
    cur.count += 1;
    cur.total += tx.amount;
    byCat.set(tx.category, cur);
  }
  const cats = [...byCat.entries()].sort((a, b) => a[1].type.localeCompare(b[1].type) || b[1].total - a[1].total);
  const ws2 = wb.addWorksheet("Per Kategori", {
    views: [{ state: "frozen", ySplit: 5 }],
    pageSetup: { orientation: "portrait", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    headerFooter: pageFooter(scope, period, "Per Kategori"),
  });
  ws2.columns = [{ width: 30 }, { width: 10 }, { width: 14 }, { width: 12 }, { width: 18 }, { width: 10 }];
  brandHeader(ws2, wb, "Ringkasan per Kategori", `${scope} · ${period}`, printedBy);
  const h2 = ws2.getRow(5);
  h2.values = ["Kategori", "Jenis", "Kelompok", "Transaksi", "Total", "Porsi"];
  styleHeaderRow(h2, 6);
  const inTotal = cats.filter(([, c]) => c.type === "masuk").reduce((s, [, c]) => s + c.total, 0);
  const outTotal = cats.filter(([, c]) => c.type === "keluar").reduce((s, [, c]) => s + c.total, 0);
  let r2 = 6;
  for (const [category, c] of cats) {
    const row = ws2.getRow(r2);
    const base = c.type === "masuk" ? inTotal : outTotal;
    row.values = [categoryLabel.get(category) ?? category, c.type === "masuk" ? "Masuk" : "Keluar", isFinancing(category) ? "Pendanaan" : "Operasional", c.count, c.total, base ? c.total / base : 0];
    row.getCell(5).numFmt = IDR;
    row.getCell(5).font = font({ bold: true, color: { argb: c.type === "masuk" ? GREEN : RED } });
    row.getCell(6).numFmt = "0%";
    for (let c2 = 1; c2 <= 6; c2++) {
      const cell = row.getCell(c2);
      cell.border = border;
      if (r2 % 2 === 0) cell.fill = fill(SOFT);
      if (!cell.font) cell.font = font();
    }
    r2 += 1;
  }
  if (cats.length === 0) {
    ws2.getCell(`A${r2}`).value = "Tidak ada transaksi pada periode ini.";
    ws2.getCell(`A${r2}`).font = font({ italic: true, color: { argb: MUTED } });
  }
}

export async function buildCashFlowWorkbook(opts: CashFlowSheetOptions): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Zynergy Hub";
  wb.created = new Date();
  await addCashFlowSheets(wb, opts);
  return Buffer.from(await wb.xlsx.writeBuffer());
}
