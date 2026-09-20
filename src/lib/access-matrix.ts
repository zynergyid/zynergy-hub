import { roles, type Role, type RoleGrants } from "@/lib/options";
import { can } from "@/lib/grants-cache";

/**
 * The per-module rights table shown on /access, derived from the grants,
 * so the page can never disagree with the rules. "admin" is a virtual
 * column: the flag, not a role.
 */
export type Right = "ubah" | "lihat" | "tidak";
export type MatrixColumn = Role | "admin";
export const matrixColumns: MatrixColumn[] = ["admin", ...roles.map((r) => r.value)];
export interface AccessRow {
  module: string;
  note?: string;
  rights: Record<MatrixColumn, Right>;
}

export function buildAccessMatrix(grants: RoleGrants): AccessRow[] {
  const who = (c: MatrixColumn) => (c === "admin" ? { isAdmin: true } : { role: c });
  const forAll = (f: (c: MatrixColumn) => Right) => Object.fromEntries(matrixColumns.map((c) => [c, f(c)])) as Record<MatrixColumn, Right>;
  const has = (c: MatrixColumn, cap: Parameters<typeof can>[1]) => can(who(c), cap, grants);
  return [
    { module: "Klien dan Outreach", note: "dalam unit masing-masing, kecuali yang melihat semua unit", rights: forAll((c) => (has(c, "editClients") ? "ubah" : "lihat")) },
    { module: "Pesanan (PO)", note: "harga hanya untuk yang melihat uang", rights: forAll((c) => (has(c, "editOrders") ? "ubah" : "lihat")) },
    { module: "Proyek dan brief", note: "nilai proyek hanya untuk yang melihat uang", rights: forAll((c) => (has(c, "editProjects") ? "ubah" : "lihat")) },
    { module: "Arus Kas", rights: forAll((c) => (has(c, "editMoney") && has(c, "viewMoney") ? "ubah" : has(c, "viewMoney") ? "lihat" : "tidak")) },
    { module: "Brankas Dokumen", note: "dokumen rahasia hanya untuk yang mengelola", rights: forAll((c) => (has(c, "editVault") ? "ubah" : "lihat")) },
    { module: "Kalender, catatan musyawarah, tindak lanjut, konten", rights: forAll((c) => (has(c, "team") ? "ubah" : "lihat")) },
    { module: "Web (statistik)", rights: forAll(() => "lihat") },
    { module: "SEO", note: "judul dan deskripsi situs", rights: forAll((c) => (has(c, "seo") ? "ubah" : "lihat")) },
    { module: "Tim, peran, unit, hak akses", note: "selalu admin saja", rights: forAll((c) => (c === "admin" ? "ubah" : "tidak")) },
  ];
}
