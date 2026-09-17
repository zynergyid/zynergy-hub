/** Shared option lists: used by collections (admin labels) and custom UI. */

export const units = [
  { label: "Digital", value: "digital" },
  { label: "Apps", value: "apps" },
  { label: "Supply", value: "supply" },
] as const;
export type Unit = (typeof units)[number]["value"];

/**
 * `kind` separates business cash (operasional) from financing (pendanaan:
 * capital, loans, owner draws). Financing moves the balance but is never
 * counted as income or cost in summaries and charts.
 */
export const transactionCategories = [
  { label: "Pembayaran klien", value: "pembayaran-klien", type: "masuk", kind: "operasional" },
  { label: "Perpanjangan klien", value: "perpanjangan", type: "masuk", kind: "operasional" },
  { label: "Penjualan barang (PO)", value: "penjualan-barang", type: "masuk", kind: "operasional" },
  { label: "Pemasukan lain", value: "pemasukan-lain", type: "masuk", kind: "operasional" },
  { label: "Setoran modal", value: "setoran-modal", type: "masuk", kind: "pendanaan" },
  { label: "Pinjaman diterima", value: "pinjaman-diterima", type: "masuk", kind: "pendanaan" },
  { label: "Pembelian barang", value: "pembelian-barang", type: "keluar", kind: "operasional" },
  { label: "Pengiriman & logistik", value: "logistik", type: "keluar", kind: "operasional" },
  { label: "Transportasi", value: "transportasi", type: "keluar", kind: "operasional" },
  { label: "Hosting & domain", value: "hosting-domain", type: "keluar", kind: "operasional" },
  { label: "Tools & langganan", value: "tools", type: "keluar", kind: "operasional" },
  { label: "Iklan", value: "iklan", type: "keluar", kind: "operasional" },
  { label: "Gaji & honor", value: "gaji-honor", type: "keluar", kind: "operasional" },
  { label: "Operasional", value: "operasional", type: "keluar", kind: "operasional" },
  { label: "Pajak", value: "pajak", type: "keluar", kind: "operasional" },
  { label: "Lainnya", value: "lainnya", type: "keluar", kind: "operasional" },
  { label: "Pengembalian pinjaman", value: "pengembalian-pinjaman", type: "keluar", kind: "pendanaan" },
  { label: "Prive / dividen", value: "prive-dividen", type: "keluar", kind: "pendanaan" },
] as const;
export type TransactionCategory = (typeof transactionCategories)[number]["value"];
export const categoryType = new Map<string, "masuk" | "keluar">(transactionCategories.map((c) => [c.value, c.type]));
const financingCategories = new Set<string>(transactionCategories.filter((c) => c.kind === "pendanaan").map((c) => c.value));
export const isFinancing = (category: string) => financingCategories.has(category);

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

/** Purchase order lifecycle, from receipt to cash in. */
export const orderStatuses = [
  { label: "Diterima", value: "diterima" },
  { label: "Sourcing", value: "sourcing" },
  { label: "Dikirim", value: "dikirim" },
  { label: "Ditagih", value: "ditagih" },
  { label: "Dibayar", value: "dibayar" },
  { label: "Batal", value: "batal" },
] as const;
export type OrderStatus = (typeof orderStatuses)[number]["value"];
export const openOrderStatuses: readonly OrderStatus[] = ["diterima", "sourcing", "dikirim", "ditagih"];
export const orderStatusLabel = new Map<string, string>(orderStatuses.map((s) => [s.value, s.label]));

/** Files that live on a purchase order. */
export const documentKinds = [
  { label: "PO pembeli", value: "po" },
  { label: "Invoice", value: "invoice" },
  { label: "Surat jalan", value: "surat-jalan" },
  { label: "Faktur Pajak", value: "faktur-pajak" },
  { label: "Bukti bayar", value: "bukti-bayar" },
  { label: "Lainnya", value: "lainnya" },
] as const;
export const documentKindLabel = new Map<string, string>(documentKinds.map((d) => [d.value, d.label]));

/** Outreach pipeline for Supply prospects: research, draft, send by hand, follow up. */
export const prospectStatuses = [
  { label: "Perlu riset", value: "baru" },
  { label: "Perlu draf", value: "riset" },
  { label: "Draf siap diperiksa", value: "draf" },
  { label: "Menunggu balasan", value: "terkirim" },
  { label: "Dibalas", value: "dibalas" },
  { label: "Pertemuan / penawaran", value: "pertemuan" },
  { label: "Jadi klien", value: "klien" },
  { label: "Berhenti", value: "berhenti" },
] as const;
export type ProspectStatus = (typeof prospectStatuses)[number]["value"];
export const prospectStatusLabel = new Map<string, string>(prospectStatuses.map((s) => [s.value, s.label]));
/** Order the queue is shown in: what needs a hand first. */
export const prospectStatusOrder: readonly ProspectStatus[] = ["draf", "terkirim", "baru", "riset", "dibalas", "pertemuan", "klien", "berhenti"];
export const openProspectStatuses: readonly ProspectStatus[] = ["baru", "riset", "draf", "terkirim", "dibalas", "pertemuan"];

export const prospectSectors = [
  { label: "Tambang & mineral", value: "tambang" },
  { label: "Migas & energi", value: "migas" },
  { label: "EPC & kontraktor", value: "epc" },
  { label: "Manufaktur", value: "manufaktur" },
  { label: "Distributor & trading", value: "distributor" },
  { label: "Lainnya", value: "lainnya" },
] as const;

export const prospectSources = [
  { label: "Klien lama", value: "klien-lama" },
  { label: "Referensi", value: "referensi" },
  { label: "Riset sendiri", value: "riset" },
  { label: "Asosiasi (IMA, Kadin)", value: "asosiasi" },
  { label: "LinkedIn", value: "linkedin" },
  { label: "Lainnya", value: "lainnya" },
] as const;

export const outreachChannels = [
  { label: "Email", value: "email" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "LinkedIn", value: "linkedin" },
  { label: "Telepon", value: "telepon" },
  { label: "Pertemuan", value: "pertemuan" },
] as const;
export type OutreachChannel = (typeof outreachChannels)[number]["value"];

export const outreachLogTypes = [
  { label: "Riset", value: "riset" },
  { label: "Draf", value: "draf" },
  { label: "Terkirim", value: "kirim" },
  { label: "Tindak lanjut", value: "tindak-lanjut" },
  { label: "Balasan", value: "balasan" },
  { label: "Catatan", value: "catatan" },
  { label: "Status", value: "status" },
] as const;
export const outreachLogLabel = new Map<string, string>(outreachLogTypes.map((t) => [t.value, t.label]));

/** Days after a message (and after each follow-up) before the next nudge is due. */
export const FOLLOW_UP_DAYS = 7;

/** Company documents kept in the vault. Order = how they appear on the page. */
export const vaultCategories = [
  { label: "Akta & perubahan", value: "akta" },
  { label: "NIB & izin usaha", value: "izin" },
  { label: "NPWP & SPPKP", value: "pajak" },
  { label: "Sertifikat (ISO, K3, keagenan)", value: "sertifikat" },
  { label: "Company profile & katalog", value: "profil" },
  { label: "Referensi & pengalaman kerja", value: "referensi" },
  { label: "Identitas pengurus", value: "identitas" },
  { label: "Rekening & keuangan", value: "keuangan" },
  { label: "Kontrak & perjanjian", value: "kontrak" },
  { label: "Lainnya", value: "lainnya" },
] as const;
export type VaultCategory = (typeof vaultCategories)[number]["value"];
export const vaultCategoryLabel = new Map<string, string>(vaultCategories.map((c) => [c.value, c.label]));
/** Days ahead the vault warns about an expiry. */
export const VAULT_WARN_DAYS = 30;

/** USD per million tokens (input, output) for the models the Hub calls. Update when OpenAI changes prices. */
export const aiModels: Record<string, { input: number; output: number }> = {
  "gpt-5-mini": { input: 0.25, output: 2 },
};
/** Rough rate for showing AI cost in Rupiah; the exact bill is on the provider's dashboard. */
export const usdToIdrApprox = 16500;

export const aiFeatures = [{ label: "Impor PDF PO", value: "po-import" }] as const;

export const categoryLabel = new Map<string, string>(
  transactionCategories.map((c) => [c.value, c.label]),
);
export const unitLabel = new Map<string, string>(units.map((u) => [u.value, u.label]));

/** Access level. Scope (which units) is a separate field on the user. */
export const roles = [
  { label: "Admin (semua unit, kelola tim)", value: "admin" },
  { label: "Finance (klien + arus kas + pesanan di unitnya)", value: "finance" },
  { label: "Staf (sementara sama dengan Finance)", value: "staff" },
  { label: "Anggota (klien + pesanan tanpa harga di unitnya)", value: "member" },
  { label: "Pengawas (lihat semua, tanpa mengubah)", value: "viewer" },
] as const;
export type Role = (typeof roles)[number]["value"];
export const roleLabel = new Map<string, string>(roles.map((r) => [r.value, r.label.split(" (")[0]]));

/** Job titles are descriptive only; they never grant access. */
export const jobTitles = [
  "Lead",
  "Developer",
  "Designer",
  "Marketing",
  "Business",
  "Staf",
  "Finance",
  "Komisaris",
  "Lainnya",
] as const;
