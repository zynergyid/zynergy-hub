import type ExcelJS from "exceljs";
import { logoPngBase64 } from "./logo";

/** One look for every workbook the Hub produces. */

export const NAVY = "FF0B1B3F";
export const LINE = "FFE6EAF2";
export const SOFT = "FFF4F7FB";
export const GREEN = "FF0E9F6E";
export const RED = "FFDC2626";
export const MUTED = "FF55617A";
export const INK = "FF0F1B33";
export const IDR = '"Rp "#,##0;[Red]-"Rp "#,##0';
export const DATE = "dd/mm/yyyy";
export const FONT = "Arial";

const thin: Partial<ExcelJS.Border> = { style: "thin", color: { argb: LINE } };
export const border: Partial<ExcelJS.Borders> = { top: thin, left: thin, bottom: thin, right: thin };
export const fill = (argb: string): ExcelJS.Fill => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
export const font = (o: Partial<ExcelJS.Font> = {}): Partial<ExcelJS.Font> => ({ name: FONT, size: 10, color: { argb: INK }, ...o });

const printedOn = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function styleHeaderRow(row: ExcelJS.Row, lastCol: number) {
  row.height = 22;
  for (let c = 1; c <= lastCol; c++) {
    const cell = row.getCell(c);
    cell.fill = fill(NAVY);
    cell.font = font({ bold: true, color: { argb: "FFFFFFFF" } });
    cell.alignment = { vertical: "middle" };
    cell.border = border;
  }
}

/** Logo, title, scope line, and the printed-by line in rows 1 to 3. */
export function brandHeader(ws: ExcelJS.Worksheet, wb: ExcelJS.Workbook, title: string, subtitle: string, printedBy: string) {
  const logo = wb.addImage({ base64: logoPngBase64, extension: "png" });
  ws.addImage(logo, { tl: { col: 0, row: 0 }, ext: { width: 52, height: 52 } });
  ws.getRow(1).height = 20;
  ws.getRow(2).height = 20;
  ws.getRow(3).height = 18;
  ws.getCell("B1").value = title;
  ws.getCell("B1").font = font({ bold: true, size: 18, color: { argb: NAVY } });
  ws.getCell("B2").value = subtitle;
  ws.getCell("B2").font = font({ size: 11, color: { argb: MUTED } });
  ws.getCell("B3").value = `PT Sinergi Mitra Abadi Jaya · Zynergy Hub · dicetak ${printedOn.format(new Date())} oleh ${printedBy}`;
  ws.getCell("B3").font = font({ size: 9, color: { argb: MUTED } });
}

/** Small uppercase label above a block of rows. */
export function sectionTitle(ws: ExcelJS.Worksheet, row: number, text: string) {
  const cell = ws.getCell(`A${row}`);
  cell.value = text;
  cell.font = font({ bold: true, size: 11, color: { argb: NAVY } });
  ws.getRow(row).height = 20;
}

export function pageFooter(scope: string, period: string, title: string) {
  return { oddFooter: `&L&8Zynergy Hub · ${title} ${scope} · ${period}&C&8Halaman &P dari &N&R&8&D` };
}
