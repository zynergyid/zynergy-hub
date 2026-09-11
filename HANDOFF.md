# HANDOFF, Zynergy Hub

> Aplikasi internal tim Zynergy. Baca penuh sebelum mengubah. Ikuti hard rules
> yang sama dengan repo `zynergy` (tanpa em dash, jangan deploy tanpa perintah
> "deploy", commit dan push biasa).

## State 2026-09-11 (sore)

- Modul 1 (Klien) dan 2 (Keuangan) dibangun dan diverifikasi lokal, dengan
  UI custom (bukan admin Payload) untuk pemakaian harian:
  app shell (sidebar 256px desktop, bottom tab HP; urutan alat dari
  sederhana ke kompleks di `src/components/hub/nav.ts`), `/` ringkasan per
  unit (Digital dan Supply), `/arus-kas` (segmented Digital/Supply/Semua,
  navigasi bulan, kartu masuk/keluar/selisih/saldo, daftar terkelompok per
  hari dengan saldo berjalan, filter kategori, cari, CSV per unit dan bulan,
  form cepat "Catat" sebagai bottom sheet dengan server action), `/klien`
  (kartu klien, status, hitung mundur perpanjangan, tombol WA), `/alat`
  (peta alat yang akan datang). Panel `/admin` (berlabel Zynergy Team)
  tetap ada untuk edit/hapus dan data jarang. Transaksi dan Klien punya
  field `unit` (digital|supply). Peran admin/finance/member diterapkan di
  access; member tidak melihat uang.
- Jebakan: `payload migrate` bertanya interaktif kalau dev server (mode push)
  sedang jalan; matikan dev server dulu atau jawab dengan `echo y |`. Untuk
  lokal, reset database lebih cepat: drop + create `zynergy_hub`, migrate,
  seed.
- Repo privat `danish-deepskill/zynergy-hub` (push 2026-09-11), Vercel
  project `zynergy-hub` (scope `devdanzen-projects`) dengan domain
  team.zynergy.co.id terpasang dan PAYLOAD_SECRET production sudah diset.
  BELUM ada database Neon: user harus klik Vercel > project zynergy-hub >
  Storage > Connect Database > Neon > database baru `zynergy-hub` (mengisi
  DATABASE_URL dan DATABASE_URL_UNPOOLED otomatis). Setelah itu deploy
  pertama (`vercel deploy --prod`), lalu user membuat admin pertama di
  team.zynergy.co.id/admin dengan admin@zynergy.co.id. `vercel.json`
  menjalankan migrate saat build.
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
