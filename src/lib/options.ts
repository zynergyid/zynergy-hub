/** Shared option lists: used by collections (admin labels) and custom UI. */

export const units = [
  { label: "Digitalin", value: "digital" },
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

/** A client is a business (UMKM, PT, CV) or one person (freelancer, professional, personal brand). */
export const clientKinds = [
  { label: "Usaha / perusahaan", value: "usaha" },
  { label: "Perorangan", value: "perorangan" },
] as const;
export type ClientKind = (typeof clientKinds)[number]["value"];

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
/** Where a company account lives. Social keys match `socialPlatforms` in site-seo.ts. */
export const accountPlatforms = [
  { label: "WhatsApp Business", value: "whatsapp" },
  { label: "Google Business Profile", value: "google-business" },
  { label: "Instagram", value: "instagram" },
  { label: "Threads", value: "threads" },
  { label: "LinkedIn", value: "linkedin" },
  { label: "GitHub", value: "github" },
  { label: "Facebook", value: "facebook" },
  { label: "YouTube", value: "youtube" },
  { label: "TikTok", value: "tiktok" },
  { label: "X", value: "x" },
  { label: "Email / Zoho", value: "email" },
  { label: "Domain / DNS", value: "domain" },
  { label: "Hosting / Vercel / Neon", value: "hosting" },
  { label: "Lainnya", value: "lainnya" },
] as const;
export const accountPlatformLabel = new Map<string, string>(accountPlatforms.map((p) => [p.value, p.label]));
export const accountStatuses = [
  { label: "Belum dibuat", value: "belum" },
  { label: "Aktif", value: "aktif" },
  { label: "Ditinggalkan", value: "ditinggalkan" },
] as const;
export const accountStatusLabel = new Map<string, string>(accountStatuses.map((s) => [s.value, s.label]));

/** Days ahead the vault warns about an expiry. */
export const VAULT_WARN_DAYS = 30;

/** USD per million tokens (input, output) for the models the Hub calls. Update when OpenAI changes prices. */
export const aiModels: Record<string, { input: number; output: number }> = {
  "gpt-5-mini": { input: 0.25, output: 2 },
};
/** Rough rate for showing AI cost in Rupiah; the exact bill is on the provider's dashboard. */
export const usdToIdrApprox = 16500;

export const aiFeatures = [{ label: "Impor PDF PO", value: "po-import" }] as const;

/**
 * Digital and Apps projects: the seven steps every agency runs (each ends with
 * a written artifact and a client sign-off), then closed. The hint says what
 * "done" means for the step; the project page shows it under the stepper.
 */
export const projectStages = [
  { label: "Discovery", value: "discovery", hint: "Brief satu halaman: tujuan, pengguna, alur sekarang, ukuran sukses. Klien mengonfirmasi brief." },
  { label: "Scope & DP", value: "scope", hint: "Scope tertulis: deliverable, milestone, harga, termin, kriteria terima, pengecualian. Ditandatangani, DP masuk." },
  { label: "Kickoff", value: "kickoff", hint: "Rencana: siapa mengerjakan apa, checklist aset dengan tanggal, kanal komunikasi, jadwal check-in mingguan." },
  { label: "Desain", value: "desain", hint: "Struktur lalu tampilan (aplikasi: layar dan model data). Persetujuan tertulis sebelum build; perubahan setelah ini paling mahal." },
  { label: "Build", value: "build", hint: "Versi staging yang berjalan, konten dan aset terpasang, QA internal sebelum klien melihat." },
  { label: "Review", value: "review", hint: "Klien menguji lewat satu kanal umpan balik; isu ditandai perbaiki sekarang atau setelah launch. Satu orang yang ditunjuk menandatangani serah terima; pelunasan jatuh tempo." },
  { label: "Launch", value: "launch", hint: "Checklist launch, kredensial, pelatihan singkat, dokumen serah terima. Review 30 hari setelah launch." },
  { label: "Selesai", value: "selesai", hint: "Proyek ditutup: review 30 hari selesai, catatan pelajaran ditulis." },
  { label: "Batal", value: "batal", hint: "Dihentikan sebelum selesai." },
] as const;
export type ProjectStage = (typeof projectStages)[number]["value"];
export const projectStageLabel = new Map<string, string>(projectStages.map((s) => [s.value, s.label]));
export const projectStageHint = new Map<string, string>(projectStages.map((s) => [s.value, s.hint]));
/** Stages a running project passes through, in order; the stepper shows these plus Selesai. */
export const openProjectStages: readonly ProjectStage[] = ["discovery", "scope", "kickoff", "desain", "build", "review", "launch"];

/** Weekly health flag, chosen by the owner, never computed. */
export const projectHealth = [
  { label: "Lancar", value: "lancar" },
  { label: "Berisiko", value: "berisiko" },
  { label: "Terhambat", value: "terhambat" },
] as const;
export type ProjectHealth = (typeof projectHealth)[number]["value"];
export const projectHealthLabel = new Map<string, string>(projectHealth.map((h) => [h.value, h.label]));

/** Dated entries on a project: the small-team version of a decision and change log. */
export const projectLogTypes = [
  { label: "Pertemuan", value: "pertemuan" },
  { label: "Catatan", value: "catatan" },
  { label: "Keputusan", value: "keputusan" },
  { label: "Perubahan scope", value: "perubahan" },
  { label: "Masukan klien", value: "klien" },
  { label: "Tahap", value: "tahap" },
  { label: "Status", value: "status" },
] as const;
export const projectLogLabel = new Map<string, string>(projectLogTypes.map((t) => [t.value, t.label]));

/** Files that live on a project. */
export const projectDocumentKinds = [
  { label: "Brief", value: "brief" },
  { label: "Presentasi / materi", value: "presentasi" },
  { label: "Scope / penawaran", value: "scope" },
  { label: "Invoice", value: "invoice" },
  { label: "Serah terima", value: "serah-terima" },
  { label: "Lainnya", value: "lainnya" },
] as const;

/** Units whose unit of work is a project; Supply's is a PO. */
export const projectUnits: readonly Unit[] = ["digital", "apps"];

export const categoryLabel = new Map<string, string>(
  transactionCategories.map((c) => [c.value, c.label]),
);
export const unitLabel = new Map<string, string>(units.map((u) => [u.value, u.label]));

/** Access level. Scope (which units) is a separate field on the user. */
/**
 * One role per person, named by the job. What a role may do is granted per
 * capability on the Hak akses page (`permissions` global, defaults below).
 * `users.isAdmin` sits on top: an admin has every capability and manages the
 * team and the grants.
 */
export const roles = [
  { label: "Lead", value: "Lead" },
  { label: "Developer", value: "Developer" },
  { label: "Designer", value: "Designer" },
  { label: "Marketing", value: "Marketing" },
  { label: "Business", value: "Business" },
  { label: "Staff", value: "Staff" },
  { label: "Finance", value: "Finance" },
  { label: "Commissioner", value: "Commissioner" },
  { label: "Other", value: "Other" },
] as const;
export type Role = (typeof roles)[number]["value"];
export const roleLabel = new Map<string, string>(roles.map((r) => [r.value, r.label]));
export const isRoleValue = (v: unknown): v is Role => typeof v === "string" && roles.some((r) => r.value === v);

export const capabilities = [
  { key: "viewMoney", label: "Melihat uang", hint: "Arus kas, harga PO, nilai proyek." },
  { key: "editMoney", label: "Mengubah arus kas", hint: "Mencatat dan mengubah transaksi; butuh Melihat uang juga." },
  { key: "editClients", label: "Mengubah klien dan outreach", hint: "Di unit yang ditugaskan. Termasuk skill /outreach." },
  { key: "editOrders", label: "Mengubah pesanan (PO)", hint: "Harga hanya terlihat dengan Melihat uang." },
  { key: "editProjects", label: "Mengubah proyek dan brief" },
  { key: "editVault", label: "Mengelola Brankas Dokumen", hint: "Unggah, hapus, dan melihat dokumen rahasia." },
  { key: "team", label: "Menulis kalender, catatan musyawarah, konten" },
  { key: "allUnits", label: "Melihat semua unit", hint: "Tanpa ini hanya unit yang ditugaskan di Tim." },
  { key: "seo", label: "Mengubah SEO situs" },
] as const;
export type Capability = (typeof capabilities)[number]["key"];
export const capabilityLabel = new Map<string, string>(capabilities.map((c) => [c.key, c.label]));
export type RoleGrants = Record<Role, Capability[]>;
/** Starting point; admins change it on Hak akses. */
export const defaultGrants: RoleGrants = {
  Lead: ["viewMoney", "editMoney", "editClients", "editOrders", "editProjects", "editVault", "team", "allUnits", "seo"],
  Developer: ["editProjects", "team"],
  Designer: ["team"],
  Marketing: ["editClients", "team", "seo"],
  Business: ["editClients", "editOrders", "team"],
  Staff: ["viewMoney", "editMoney", "editClients", "editOrders", "editVault", "team"],
  Finance: ["viewMoney", "editMoney", "editClients", "editOrders", "editVault", "team"],
  Commissioner: ["viewMoney", "allUnits"],
  Other: ["team"],
};

/** What a calendar entry is. "konten" is a planned social post with its own fields. */
export const eventKinds = [
  { label: "Musyawarah tim", value: "rapat-tim" },
  { label: "Meeting klien", value: "meeting-klien" },
  { label: "Mentoring", value: "mentoring" },
  { label: "Konten (unggahan)", value: "konten" },
  { label: "Fokus (waktu kerja sendiri)", value: "fokus" },
  { label: "Acara lain", value: "lainnya" },
] as const;
export type EventKind = (typeof eventKinds)[number]["value"];
export const eventKindLabel = new Map<string, string>(eventKinds.map((k) => [k.value, k.label]));

/** Where a post goes. Same set as the site's social profiles, plus the blog. */
export const contentPlatforms = [
  { label: "Instagram", value: "instagram" },
  { label: "Threads", value: "threads" },
  { label: "LinkedIn", value: "linkedin" },
  { label: "Facebook", value: "facebook" },
  { label: "YouTube", value: "youtube" },
  { label: "TikTok", value: "tiktok" },
  { label: "X", value: "x" },
  { label: "Website / blog", value: "website" },
] as const;
export const contentPlatformLabel = new Map<string, string>(contentPlatforms.map((p) => [p.value, p.label]));
/** A post moves left to right; "tayang" is the only finished state. */
export const contentStatuses = [
  { label: "Ide", value: "ide" },
  { label: "Draf", value: "draf" },
  { label: "Siap tayang", value: "siap" },
  { label: "Tayang", value: "tayang" },
] as const;
export type ContentStatus = (typeof contentStatuses)[number]["value"];
export const contentStatusLabel = new Map<string, string>(contentStatuses.map((s) => [s.value, s.label]));
