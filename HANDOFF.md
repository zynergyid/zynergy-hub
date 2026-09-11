# HANDOFF, Zynergy Hub

> Aplikasi internal tim Zynergy. Baca penuh sebelum mengubah. Ikuti hard rules
> yang sama dengan repo `zynergy` (tanpa em dash, jangan deploy tanpa perintah
> "deploy", commit dan push biasa).

## State 2026-09-11

- Modul 1 (Klien) dan 2 (Keuangan) dibangun dan diverifikasi lokal:
  dashboard di `/` (ringkasan bulan ini, saldo, grafik 12 bulan, jatuh tempo
  30 hari, pengeluaran per kategori, transaksi terbaru, ekspor CSV), data
  entry lewat `/admin`. Peran admin/finance/member diterapkan di access.
- Belum ada repo GitHub, project Vercel, atau database Neon. Rencana:
  repo privat `danish-deepskill/zynergy-hub`, Vercel project `zynergy-hub`
  (scope `devdanzen-projects`), domain team.zynergy.co.id, database baru di
  Neon lewat integrasi Vercel Storage (user yang klik, supaya tidak ada
  connection string lewat chat). `vercel.json` menjalankan migrate saat build.
- Lokal: Postgres docker `zynergy-pg` database `zynergy_hub`, dev admin
  dev@zynergy.local / zynergy-dev-only via `pnpm seed`. Port 3011.

## Peta subdomain (diputuskan 2026-09-11)

- zynergy.co.id: situs marketing (repo `zynergy`).
- team.zynergy.co.id: aplikasi ini, sisi tim.
- portal.zynergy.co.id: aplikasi ini, sisi klien (nanti, via proxy.ts host
  routing).
- app.zynergy.co.id: Zynergy Products, project terpisah per produk.

## Roadmap modul

1. Klien + Keuangan (selesai).
2. Cek Google (riset klien): input nama + lokasi, cek profil Google, ulasan,
   website, IG, visibilitas kata kunci; laporan satu halaman. Google Places API.
3. Laporan bulanan: tarik angka Google Business Profile per klien, susun teks
   laporan, kirim manual via WA Business dulu, WhatsApp Cloud API nanti
   (nomor kedua, biaya per pesan, minta persetujuan dulu).
4. Portal klien (portal.zynergy.co.id): laporan, langganan, edit isi website
   (platform template, project terpisah).
5. RFQ Supply: inbox sales@ jadi kartu RFQ, tenggat, template penawaran,
   tindak lanjut. Dibangun setelah sesi 30 menit dengan Pak Rizal.
   Email masuk via Zoho Mail API, forwarding ke webhook, atau IMAP (Mail Lite).
6. Claude API untuk ringkasan/draf/laporan: akun console dengan admin@,
   batas pengeluaran bulanan, minta persetujuan sebelum aktif.

Keputusan yang sudah dibahas: keuangan resmi PT tetap di pembukuan akuntan,
hub adalah buku kas operasional Digital; dokumentasi tim tetap di Notion;
email marketing tidak dibangun; aplikasi native ditunda, PWA dulu.
