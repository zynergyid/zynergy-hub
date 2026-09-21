/**
 * PERINTIS (Pemuda Merintis Bisnis) 2026: the youth business programme by
 * Pengurus Muda-Mudi Cilandak that Zynergy takes part in as a team. Dates,
 * weights, and rules come from "Petunjuk Teknis Lomba PERINTIS Cilandak
 * 2026"; the team's own figures live in the `perintis` global.
 */
export const PROGRAM = {
  name: "PERINTIS 2026",
  longName: "Workshop Kewirausahaan PERINTIS, Pemuda Merintis Bisnis",
  organizer: "Pengurus Muda-Mudi Cilandak",
  period: "Agustus sampai Desember 2026",
  capital: 250_000,
  externalCapitalCapPerMonth: 10_000_000,
  charityShare: 20,
  reportDeadlineDay: 5,
};

export interface Stage {
  key: "kickoff" | "report1" | "report2" | "report3" | "final";
  order: number;
  name: string;
  short: string;
  date: string;
  form: string;
  weight: number;
  note: string;
  /** For reports: the months they cover, as YYYY-MM. */
  months?: string[];
}

export const STAGES: Stage[] = [
  { key: "kickoff", order: 1, name: "Kick-off, Seminar & Pitching Perdana", short: "Kick-off & Pitching", date: "2026-08-23", form: "FORM-02 (juri)", weight: 15, note: "5 menit presentasi ide, 3 menit tanya jawab. Seluruh anggota maju." },
  { key: "report1", order: 2, name: "Laporan Progress Bulanan I", short: "Laporan Progress I", date: "2026-10-04", form: "FORM-04.1", weight: 10, note: "Periode Agustus sampai September. Kualitas laporan, realisasi vs rencana, kelengkapan administrasi.", months: ["2026-08", "2026-09"] },
  { key: "report2", order: 3, name: "Laporan Progress Bulanan II", short: "Laporan Progress II", date: "2026-11-01", form: "FORM-04.2", weight: 10, note: "Periode Oktober. Perkembangan usaha, penyelesaian masalah, inovasi.", months: ["2026-10"] },
  { key: "report3", order: 4, name: "Laporan Progress Bulanan III", short: "Laporan Progress III", date: "2026-12-06", form: "FORM-04.3", weight: 10, note: "Periode November. Pertumbuhan omzet dan keberlanjutan rencana usaha.", months: ["2026-11"] },
  { key: "final", order: 5, name: "Presentasi Final & Malam Apresiasi", short: "Final & Malam Apresiasi", date: "2026-12-31", form: "FORM-05.A dan 05.B", weight: 55, note: "10 menit presentasi, 5 menit tanya jawab. Presentasi 25%, kinerja bisnis nyata 30%." },
];

export const WEIGHTS = [
  { label: "Pitching awal", value: 15 },
  { label: "Laporan I", value: 10 },
  { label: "Laporan II", value: 10 },
  { label: "Laporan III", value: 10 },
  { label: "Presentasi final", value: 25 },
  { label: "Kinerja bisnis nyata", value: 30 },
];

export const FINAL_RUBRIC = [
  { aspect: "Isi dan konten bisnis", max: 30, detail: "model bisnis, proposisi nilai, target pasar" },
  { aspect: "Kinerja keuangan", max: 25, detail: "omzet, laba bersih, tren pertumbuhan, kerapian pembukuan" },
  { aspect: "Inovasi dan kreativitas", max: 20, detail: "keunikan produk, adaptasi terhadap masukan" },
  { aspect: "Kemampuan presentasi", max: 15, detail: "percaya diri, komunikasi, penguasaan materi" },
  { aspect: "Potensi keberlanjutan", max: 10, detail: "rencana scale-up, visi jangka panjang, kelayakan investasi" },
];

export const PRIZES = [
  { place: "Terbaik 1", amount: 1_500_000, extra: "Sertifikat digital, berpotensi ditawari investasi" },
  { place: "Terbaik 2", amount: 1_250_000, extra: "Sertifikat digital, berpotensi ditawari investasi" },
  { place: "Terbaik 3", amount: 750_000, extra: "Sertifikat digital" },
];

export const MENTORS = [
  { name: "Bpk. Fahri", field: "F&B", groups: [[1, 2, 3], [7, 8, 9], [4, 5, 6]] },
  { name: "Bpk. Fadli", field: "Fashion dan konveksi", groups: [[4, 5, 6], [1, 2, 3], [7, 8, 9]] },
  { name: "Bpk. Andi", field: "Bisnis umum", groups: [[7, 8, 9], [4, 5, 6], [1, 2, 3]] },
];

/** Section C of the guide: what each month's contact with the mentor is for. Dates are agreed with the mentor, so the team logs them as "Mentoring" events in Kalender. */
export const MENTOR_AGENDA = [
  { month: "2026-08", agenda: "Perkenalan dan brainstorming", how: "Tatap muka setelah hari H seminar atau satu minggu setelahnya" },
  { month: "2026-09", agenda: "Review bulanan I", how: "Offline atau online; mentor mereview laporan dan memberi tanggapan tertulis" },
  { month: "2026-10", agenda: "Review bulanan II", how: "Offline atau online; fokus evaluasi kendala dan saran perbaikan" },
  { month: "2026-11", agenda: "Review bulanan III dan persiapan final", how: "Offline atau online; mentor memberi arahan presentasi final" },
  { month: "2026-12", agenda: "Final dan apresiasi", how: "Presentasi final di Malam Anugerah" },
];
export const SESSION_NUMERALS = ["I", "II", "III"];

export const RULES = [
  { title: "Modal Rp250.000 hanya untuk usaha", detail: "Bukan konsumsi pribadi. Setiap pengeluaran dicatat di buku kas, struk disimpan dan dilampirkan di laporan." },
  { title: "Tambahan modal luar maksimal Rp10 juta per bulan", detail: "Dari patungan atau sponsor, di luar hasil usaha. Sumbernya wajib dilaporkan di FORM-04." },
  { title: "20% keuntungan disodaqohkan ke desa", detail: "Sisanya sepenuhnya milik kelompok." },
  { title: "Laporan paling lambat tanggal 5", detail: "Terlambat dipotong 5 poin per laporan. Kirim PDF atau foto ke grup WhatsApp resmi atau sekretariat." },
  { title: "Boleh kerja sama antar kelompok", detail: "Kolaborasi dan barter layanan diizinkan, dilaporkan ke mentor. Dilarang meniru produk kelompok lain dan menggabungkan laporan keuangan." },
  { title: "Usaha harus sesuai syariat", detail: "Tanpa riba, judi, atau produk haram. Juri berhak mendiskualifikasi." },
];

export const SANCTIONS = [
  { violation: "Laporan progress terlambat", sanction: "Kurang 5 poin per laporan" },
  { violation: "Tidak hadir presentasi final tanpa izin", sanction: "Diskualifikasi" },
  { violation: "Penyalahgunaan modal usaha", sanction: "Diskualifikasi dan modal dikembalikan" },
  { violation: "Plagiarisme produk kelompok lain", sanction: "Peringatan dan kurang 15 poin" },
  { violation: "Merusak nama baik", sanction: "Diskualifikasi" },
];

export const FINAL_TIPS = [
  "10 menit presentasi, 5 menit tanya jawab; urutan diundi pada hari-H.",
  "Slide, video, atau demo produk langsung semuanya boleh.",
  "Seluruh anggota wajib hadir; yang absen tanpa alasan mengurangi nilai tim.",
  "Juri menilai kekompakan, jadi bagi peran bicara sejak latihan.",
];

/** Indicators FORM-04 asks for each month: target at the start, realisation at the end. */
export const REPORT_INDICATORS = [
  { key: "omzet", label: "Total omzet (penjualan kotor)", money: true },
  { key: "biaya", label: "Total biaya / HPP", money: true },
  { key: "laba", label: "Laba bersih (omzet dikurangi biaya)", money: true },
  { key: "transaksi", label: "Jumlah transaksi", money: false },
  { key: "unit", label: "Jumlah produk / jasa terjual", money: false },
  { key: "saldo", label: "Saldo kas akhir periode", money: true },
] as const;
export type ReportIndicator = (typeof REPORT_INDICATORS)[number]["key"];

export const REFLECTIONS = [
  { key: "good", label: "Apa yang berjalan baik" },
  { key: "problems", label: "Kendala yang dihadapi" },
  { key: "actions", label: "Solusi atau tindakan yang diambil" },
  { key: "next", label: "Target bulan depan" },
  { key: "innovation", label: "Inovasi atau strategi yang dilakukan" },
] as const;
export type ReflectionKey = (typeof REFLECTIONS)[number]["key"];
