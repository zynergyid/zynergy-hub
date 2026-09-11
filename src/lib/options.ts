/** Shared option lists: used by collections (admin labels) and custom UI. */

export const units = [
  { label: "Digital", value: "digital" },
  { label: "Supply", value: "supply" },
] as const;
export type Unit = (typeof units)[number]["value"];

export const transactionCategories = [
  { label: "Pembayaran klien", value: "pembayaran-klien", type: "masuk" },
  { label: "Perpanjangan klien", value: "perpanjangan", type: "masuk" },
  { label: "Penjualan barang (PO)", value: "penjualan-barang", type: "masuk" },
  { label: "Pemasukan lain", value: "pemasukan-lain", type: "masuk" },
  { label: "Pembelian barang", value: "pembelian-barang", type: "keluar" },
  { label: "Pengiriman & logistik", value: "logistik", type: "keluar" },
  { label: "Hosting & domain", value: "hosting-domain", type: "keluar" },
  { label: "Tools & langganan", value: "tools", type: "keluar" },
  { label: "Iklan", value: "iklan", type: "keluar" },
  { label: "Gaji & honor", value: "gaji-honor", type: "keluar" },
  { label: "Operasional", value: "operasional", type: "keluar" },
  { label: "Pajak", value: "pajak", type: "keluar" },
  { label: "Lainnya", value: "lainnya", type: "keluar" },
] as const;
export type TransactionCategory = (typeof transactionCategories)[number]["value"];

export const paymentMethods = [
  { label: "Transfer", value: "transfer" },
  { label: "QRIS", value: "qris" },
  { label: "Tunai", value: "tunai" },
] as const;

export const packages = [
  { label: "Starter", value: "starter" },
  { label: "Business", value: "business" },
  { label: "Premium", value: "premium" },
  { label: "Custom", value: "custom" },
] as const;

export const clientStatuses = [
  { label: "Prospek", value: "prospek" },
  { label: "Aktif", value: "aktif" },
  { label: "Jatuh tempo", value: "jatuh-tempo" },
  { label: "Berhenti", value: "berhenti" },
] as const;

export const businessTypes = [
  { label: "Kuliner / warung / catering", value: "kuliner" },
  { label: "Klinik / kesehatan", value: "kesehatan" },
  { label: "Laundry / jasa lokal", value: "jasa-lokal" },
  { label: "Sekolah / lembaga", value: "sekolah" },
  { label: "Toko / produk", value: "toko" },
  { label: "Company profile / B2B", value: "b2b" },
  { label: "Industri / pengadaan", value: "industri" },
  { label: "Lainnya", value: "lainnya" },
] as const;

export const categoryLabel = new Map<string, string>(
  transactionCategories.map((c) => [c.value, c.label]),
);
export const unitLabel = new Map<string, string>(units.map((u) => [u.value, u.label]));
