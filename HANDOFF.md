# HANDOFF, Zynergy Hub

> Aplikasi internal tim Zynergy. Baca penuh sebelum mengubah. Ikuti hard rules
> yang sama dengan repo `zynergy` (tanpa em dash, jangan deploy tanpa perintah
> "deploy", commit dan push biasa).

## State 2026-09-11 (sore)

- Modul 1 (Klien) dan 2 (Keuangan) dibangun dan diverifikasi lokal, dengan
  UI custom (bukan admin Payload) untuk pemakaian harian:
  app shell (sidebar 256px desktop, bottom tab HP; urutan alat dari
  sederhana ke kompleks di `src/components/hub/nav.ts`), `/` ringkasan per
  unit (Digital dan Supply), `/cash-flow` (segmented Digital/Supply/Semua,
  navigasi bulan, kartu masuk/keluar/selisih/saldo, daftar terkelompok per
  hari dengan saldo berjalan, filter kategori, cari, CSV per unit dan bulan,
  form cepat "Catat" sebagai bottom sheet dengan server action), `/clients`
  (kartu klien, status, hitung mundur perpanjangan, tombol WA), `/tools`
  (peta alat yang akan datang). Bahasa visual (2026-09-11 malam, dari riset
  pola dashboard fintech dan sidebar app internal): KpiCard dengan ikon
  berwarna dan badge tren vs bulan lalu, BarChart SVG buatan sendiri (tanpa
  library), CategoryBars, Avatar inisial, Card, PageHeader; Arus Kas di
  desktop berupa tabel (Transaksi, Klien, Tanggal, Metode, Bukti, Nominal,
  Saldo), di HP daftar per hari. Komponen di `src/components/hub/`.
  Semua pekerjaan harian sekarang punya layar custom sehingga /admin tidak
  ditautkan dari sidebar: `/clients/new` dan `/clients/[id]` (ClientForm, server
  action saveClient/deleteClient), ubah dan hapus transaksi lewat sheet yang
  sama dengan Catat (`/cash-flow?edit=ID`, saveTransaction/deleteTransaction),
  `/team` untuk admin (tambah anggota dengan password sementara, ubah peran,
  hapus). Panel Payload dipaksa tema terang (`admin.theme: "light"`,
  `custom.scss`) dan hanya untuk keadaan darurat lewat URL.
  Panel `/admin` (berlabel Zynergy Team)
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

- Panel Payload DIMATIKAN (`admin.disable: true`); `/admin` 404, file
  panelnya dihapus. Payload hanya jadi lapisan data, auth, dan REST API.
  Login custom di `/login` (POST /api/users/login), tombol Keluar di sidebar
  dan header HP. Saat database belum punya user, `/login` menampilkan form
  "Buat admin pertama" (POST /api/users/first-register); ini cara membuat
  admin di prod. Reset password: admin mengatur password sementara dari
  halaman Tim (tanpa email server). Impor massal, kalau perlu, lewat script
  `payload run`.
- Kebersihan kode (audit 2026-09-11): opsi bersama di `src/lib/options.ts`,
  primitif form di `src/components/hub/form.tsx` (Input, Select, Label,
  RupiahInput, ErrorText), helper URL di `src/lib/search.ts`, tanggal di
  `src/lib/format.ts`. Editor rich text dilepas (tidak ada field rich text).
  Aturan: satu pintu per data untuk tim (layar custom); tambah field baru =
  ubah koleksi + form custom-nya, jangan hanya salah satu.

- Konvensi bahasa (2026-09-11): kode, route, dan parameter URL berbahasa
  Inggris (`/cash-flow?unit=&month=&category=`, `/clients`, `/team`,
  `/tools`, `/login`, `/profile`); teks di layar berbahasa Indonesia.
- Tim: `/team` daftar, `/team/new` tambah, `/team/[id]` ubah nama, email,
  peran, jabatan, unit, atur ulang password, hapus. `/profile`: tiap orang
  mengubah nama, email, dan password sendiri (wajib setelah login pertama
  dengan password sementara).

## Peran dan unit (diputuskan 2026-09-11)

- Tiga unit: `digital`, `products`, `supply` (field `unit` di Clients,
  Transactions, Receipts). Design berada di dalam Digital untuk urusan uang.
- Peran = tingkat akses, unit = ruang lingkup, jabatan = label saja.
  - `admin`: semua unit, kelola tim.
  - `finance`: klien dan arus kas hanya di unit yang ditugaskan (`users.units`).
  - `member` (Anggota): klien dan alat di unitnya, tanpa uang. Designer,
    marketing, business, developer masuk sini; jabatan diisi di `title`.
  - `viewer` (Pengawas, untuk komisaris): melihat semua unit, ringkasan, arus
    kas, klien; tidak bisa mengubah apa pun.
- Pembatasan dipaksa di lapisan data (`src/lib/access.ts`: moneyRead,
  moneyWrite, clientRead, clientWrite mengembalikan query `unit in units`),
  di hook `enforceUnit` untuk REST, dan di server action (`canWriteUnit`).
  UI hanya menyembunyikan; keamanannya di query.
- Klien: satu unit per klien. Kalau nanti Supply butuh field khusus (NPWP,
  nomor vendor, PIC pengadaan), tambahkan sebagai field bersyarat per unit.
- Seed lokal: dev@zynergy.local (admin), finance.digital@zynergy.local
  (finance, unit digital), pengawas@zynergy.local (viewer), semua password
  zynergy-dev-only.

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
