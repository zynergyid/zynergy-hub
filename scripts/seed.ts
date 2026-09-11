/**
 * Dev seed: admin user + sample clients, transactions, and one Supply PO. Idempotent.
 * Login: dev@zynergy.local / zynergy-dev-only (LOCAL ONLY).
 */
import { getPayload } from "payload";
import config from "@payload-config";

const payload = await getPayload({ config });

const users = await payload.find({ collection: "users", where: { email: { equals: "dev@zynergy.local" } }, limit: 1 });
if (users.totalDocs === 0) {
  await payload.create({
    collection: "users",
    data: { email: "dev@zynergy.local", password: "zynergy-dev-only", name: "Dev Admin", role: "admin", title: "Lead" },
  });
  payload.logger.info("Seeded dev admin");
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
    const doc = await payload.create({ collection: "clients", data: { ...c, unit: "digital" } });
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
      items: [{ material: "40400001", partNumber: "SGX5150202ES", description: "Device server 1 Ethernet, 2 serial, 1 USB", qty: 12, uom: "each", unitPrice: 13719000 }],
      notes: "Contoh PO dari seed lokal.",
    },
  });
  payload.logger.info("Seeded sample supply buyer and PO");
}

for (const u of [
  { email: "finance.digital@zynergy.local", name: "Finance Digital", role: "finance", units: ["digital"], title: "Finance" },
  { email: "pengawas@zynergy.local", name: "Pengawas Test", role: "viewer", units: [], title: "Komisaris" },
  { email: "member@zynergy.local", name: "Anggota Digital", role: "member", units: ["digital"], title: "Marketing" },
  { email: "member.supply@zynergy.local", name: "Anggota Supply", role: "member", units: ["supply"], title: "Business" },
  { email: "staf.supply@zynergy.local", name: "Staf Supply", role: "staff", units: ["supply"], title: "Staf" },
] as const) {
  const found = await payload.find({ collection: "users", where: { email: { equals: u.email } }, limit: 1 });
  if (found.totalDocs === 0) {
    await payload.create({ collection: "users", data: { ...u, units: [...u.units], password: "zynergy-dev-only" } });
    payload.logger.info(`Seeded ${u.email}`);
  }
}

payload.logger.info("Seed complete");
process.exit(0);
