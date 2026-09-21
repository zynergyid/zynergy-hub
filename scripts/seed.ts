/**
 * Dev seed: admin user + sample clients, transactions, and one Supply PO. Idempotent.
 * Login: admin@zynergy.local / admin (LOCAL ONLY; every seeded account uses the password "admin").
 */
import { getPayload } from "payload";
import config from "@payload-config";

const payload = await getPayload({ config });

const LOCAL_PASSWORD = "admin";
const users = await payload.find({ collection: "users", where: { email: { equals: "admin@zynergy.local" } }, limit: 1 });
if (users.totalDocs === 0) {
  await payload.create({
    collection: "users",
    data: { email: "admin@zynergy.local", password: LOCAL_PASSWORD, name: "Admin Lokal", role: "Lead", isAdmin: true },
  });
  payload.logger.info("Seeded local admin");
}

const existing = await payload.find({ collection: "clients", limit: 1 });
const supplyTx = await payload.find({ collection: "transactions", where: { unit: { equals: "supply" } }, limit: 1 });
if (existing.totalDocs === 0) {
  const today = new Date();
  const iso = (d: Date) => d.toISOString();
  const daysAgo = (n: number) => new Date(today.getTime() - n * 86400000);
  const clients = [
    { name: "Warung Nasi Uduk Pak Wawan", owner: "Pak Wawan", whatsapp: "6281200000001", city: "Jakarta Selatan", businessType: "kuliner", package: "business", annualFee: 950000, startDate: iso(daysAgo(340)), status: "aktif" },
    { name: "Klinik Gigi drg. Sari", owner: "drg. Sari", whatsapp: "6281200000002", city: "Jakarta Timur", businessType: "kesehatan", package: "premium", annualFee: 1500000, startDate: iso(daysAgo(120)), status: "aktif" },
    { name: "Laundry Mas Adi", owner: "Mas Adi", whatsapp: "6281200000003", city: "Tangerang Selatan", businessType: "jasa-lokal", package: "starter", annualFee: 500000, startDate: iso(daysAgo(30)), status: "aktif" },
  ] as const;
  const ids: number[] = [];
  for (const c of clients) {
    const doc = await payload.create({ collection: "clients", data: { ...c, unit: "digital", kind: "usaha" } });
    ids.push(doc.id);
  }
  const tx = [
    { date: daysAgo(340), type: "masuk", category: "pembayaran-klien", amount: 950000, client: ids[0], method: "transfer", reference: "INV-2025-001" },
    { date: daysAgo(120), type: "masuk", category: "pembayaran-klien", amount: 1500000, client: ids[1], method: "transfer", reference: "INV-2026-002" },
    { date: daysAgo(30), type: "masuk", category: "pembayaran-klien", amount: 500000, client: ids[2], method: "qris", reference: "INV-2026-003" },
    { date: daysAgo(200), type: "keluar", category: "hosting-domain", amount: 180000, reference: "Domain zynergy.co.id" },
    { date: daysAgo(60), type: "keluar", category: "tools", amount: 166000, reference: "Zoho Mail Lite sales@" },
    { date: daysAgo(15), type: "keluar", category: "iklan", amount: 300000, reference: "Meta Ads uji coba" },
    { date: daysAgo(3), type: "keluar", category: "operasional", amount: 75000, reference: "Cetak kartu nama" },
  ] as const;
  for (const t of tx) {
    await payload.create({ collection: "transactions", data: { ...t, unit: "digital", date: iso(t.date) } });
  }
  payload.logger.info("Seeded sample clients and transactions");
}

if (supplyTx.totalDocs === 0) {
  const today = new Date();
  const daysAgo = (n: number) => new Date(today.getTime() - n * 86400000).toISOString();
  const rows = [
    { date: daysAgo(40), type: "masuk", category: "penjualan-barang", amount: 18500000, method: "transfer", reference: "PO transceiver SFP 20 unit" },
    { date: daysAgo(45), type: "keluar", category: "pembelian-barang", amount: 14200000, method: "transfer", reference: "Beli SFP dari supplier" },
    { date: daysAgo(38), type: "keluar", category: "logistik", amount: 650000, method: "transfer", reference: "Ekspedisi ke site" },
    { date: daysAgo(6), type: "masuk", category: "penjualan-barang", amount: 7400000, method: "transfer", reference: "PO kabel CAT6A 10 roll" },
  ] as const;
  for (const r of rows) await payload.create({ collection: "transactions", data: { ...r, unit: "supply" } });
  payload.logger.info("Seeded sample supply transactions");
}

const orders = await payload.find({ collection: "orders", limit: 1 });
if (orders.totalDocs === 0) {
  const today = new Date();
  const shift = (n: number) => new Date(today.getTime() + n * 86400000).toISOString();
  const buyer = await payload.create({
    collection: "clients",
    data: {
      unit: "supply",
      kind: "usaha",
      name: "PT Tambang Nusantara (contoh)",
      owner: "Bagian Pengadaan",
      email: "procurement@contoh.local",
      city: "Jakarta Selatan",
      businessType: "industri",
      status: "aktif",
      supply: { legalName: "PT Tambang Nusantara", npwp: "00.000.000.0-000.000", vendorNumber: "V-000123", paymentTermsDays: 30, billingAddress: "Jl. Contoh No. 1, Jakarta Selatan" },
    },
  });
  await payload.create({
    collection: "orders",
    data: {
      unit: "supply",
      number: "PO-2026-000123",
      revision: 1,
      client: buyer.id,
      orderDate: shift(-31),
      deliveryDate: shift(4),
      shipTo: "Gudang Cakung Cilincing, Jakarta Utara",
      incoterm: "DDP",
      paymentTermsDays: 30,
      status: "sourcing",
      items: [{ material: "MAT-000123", partNumber: "SFP-10G-CONTOH", description: "Transceiver SFP+ 10G (contoh)", qty: 12, uom: "each", unitPrice: 2500000 }],
      notes: "Contoh PO dari seed lokal.",
    },
  });
  payload.logger.info("Seeded sample supply buyer and PO");
}

const prospects = await payload.find({ collection: "prospects", limit: 1 });
if (prospects.totalDocs === 0) {
  await payload.create({
    collection: "prospects",
    data: {
      unit: "supply",
      kind: "usaha",
      company: "PT Kontraktor Nusantara (contoh)",
      sector: "epc",
      city: "Balikpapan",
      source: "klien-lama",
      website: "https://contoh.local",
      contacts: [{ name: "Bu Ratna", role: "Procurement Supervisor", email: "ratna@contoh.local", phone: "6281200000009" }],
      status: "baru",
      notes: "Contoh target dari seed lokal.",
    },
  });
  payload.logger.info("Seeded sample prospect");
}

const projects = await payload.find({ collection: "projects", limit: 1 });
if (projects.totalDocs === 0) {
  const klinik = await payload.find({ collection: "clients", where: { name: { contains: "Klinik Gigi" } }, limit: 1 });
  const admin = await payload.find({ collection: "users", where: { email: { equals: "admin@zynergy.local" } }, limit: 1 });
  if (klinik.totalDocs > 0) {
    const today = new Date();
    const shift = (n: number) => new Date(today.getTime() + n * 86400000).toISOString();
    await payload.create({
      collection: "projects",
      data: {
        unit: "digital",
        name: "Website klinik + booking WhatsApp",
        client: klinik.docs[0].id,
        owner: admin.docs[0]?.id,
        stage: "build",
        health: "berisiko",
        value: 4500000,
        dpPercent: 50,
        startDate: shift(-21),
        targetDate: shift(14),
        nextAction: "Kirim link staging untuk review",
        nextActionAt: shift(2),
        blocker: "Foto ruang praktik dari klien",
        brief: {
          goals: "Pasien baru menemukan klinik lewat Google dan langsung booking lewat WhatsApp tanpa telepon.",
          users: "Pasien (HP), resepsionis yang menerima booking, drg. Sari yang memeriksa jadwal.",
          currentFlow: "Pasien cari di Google, telepon klinik, resepsionis catat di buku, sering bentrok jadwal.",
          targetFlow: "Pasien buka website, lihat layanan dan harga, tekan tombol WhatsApp dengan pesan terisi, resepsionis balas dan catat.",
          successMeasure: "Minimal 10 booking lewat WhatsApp per bulan setelah 3 bulan.",
          constraints: "Foto ruang praktik belum ada. Domain lama masih di penyedia lain.",
          references: "- Situs klinik gigi sejenis di kota lain (contoh): https://contoh.local/klinik, alur booking WhatsApp di halaman depan.\n- Google Business Profile: https://business.google.com, syarat verifikasi alamat.",
          confirmedAt: shift(-19),
        },
        deliverables: [
          { title: "Struktur halaman disetujui", done: true, doneAt: shift(-14) },
          { title: "Desain halaman utama disetujui", done: true, doneAt: shift(-7) },
          { title: "Halaman layanan dan harga", done: false },
          { title: "Tombol booking WhatsApp", done: false },
          { title: "Google Business Profile terhubung", done: false },
        ],
        log: [
          { date: shift(-21), type: "tahap", note: "Proyek dibuat, mulai di Discovery" },
          { date: shift(-20), type: "pertemuan", note: "Bertemu drg. Sari di klinik. Pasien baru rata-rata 3 per hari, hampir semua dari Google lalu telepon. Resepsionis mencatat di buku, dua kali seminggu jadwal bentrok. Ingin booking lewat WhatsApp tanpa telepon." },
          { date: shift(-18), type: "keputusan", note: "Klien pilih paket Business, DP 50% masuk" },
          { date: shift(-7), type: "klien", note: "Minta warna lebih terang di halaman utama" },
          { date: shift(-1), type: "status", note: "Berisiko, menunggu foto ruang praktik dari klien" },
        ],
        notes: "Contoh proyek dari seed lokal.",
      },
    });
    payload.logger.info("Seeded sample project");
  }
}

for (const u of [
  { email: "finance.digital@zynergy.local", name: "Finance Digital", role: "Finance", units: ["digital"] },
  { email: "pengawas@zynergy.local", name: "Pengawas Test", role: "Commissioner", units: [] },
  { email: "member@zynergy.local", name: "Anggota Digital", role: "Marketing", units: ["digital"] },
  { email: "member.supply@zynergy.local", name: "Anggota Supply", role: "Business", units: ["supply"] },
  { email: "staf.supply@zynergy.local", name: "Staf Supply", role: "Staff", units: ["supply"] },
] as const) {
  const found = await payload.find({ collection: "users", where: { email: { equals: u.email } }, limit: 1 });
  if (found.totalDocs === 0) {
    await payload.create({ collection: "users", data: { ...u, units: [...u.units], password: LOCAL_PASSWORD } });
    payload.logger.info(`Seeded ${u.email}`);
  }
}

payload.logger.info("Seed complete");
process.exit(0);
