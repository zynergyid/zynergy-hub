/**
 * Dev seed: admin user + sample clients and transactions. Idempotent.
 * Login: dev@zynergy.local / zynergy-dev-only (LOCAL ONLY).
 */
import { getPayload } from "payload";
import config from "@payload-config";

const payload = await getPayload({ config });

const users = await payload.find({ collection: "users", where: { email: { equals: "dev@zynergy.local" } }, limit: 1 });
if (users.totalDocs === 0) {
  await payload.create({
    collection: "users",
    data: { email: "dev@zynergy.local", password: "zynergy-dev-only", name: "Dev Admin", role: "admin" },
  });
  payload.logger.info("Seeded dev admin");
}

const existing = await payload.find({ collection: "clients", limit: 1 });
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
    const doc = await payload.create({ collection: "clients", data: { ...c } });
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
    await payload.create({ collection: "transactions", data: { ...t, date: iso(t.date) } });
  }
  payload.logger.info("Seeded sample clients and transactions");
}

payload.logger.info("Seed complete");
process.exit(0);
