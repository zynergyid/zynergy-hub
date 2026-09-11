# HANDOFF, Zynergy Hub

> Aplikasi internal tim Zynergy. Baca penuh sebelum mengubah. Ikuti hard rules
> yang sama dengan repo `zynergy` (tanpa em dash, jangan deploy tanpa perintah
> "deploy", commit dan push biasa).

## State 2026-09-11 (malam)

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
  Panel `/admin` (berlabel Zynergy Hub)
  tetap ada untuk edit/hapus dan data jarang. Transaksi dan Klien punya
  field `unit` (digital|supply). Peran admin/finance/member diterapkan di
  access; member tidak melihat uang.
- Jebakan: `payload migrate` bertanya interaktif kalau dev server (mode push)
  sedang jalan; matikan dev server dulu atau jawab dengan `echo y |`. Untuk
  lokal, reset database lebih cepat: drop + create `zynergy_hub`, migrate,
  seed. Jebakan kedua (2026-09-11 malam): MATIKAN dev server SEBELUM mengubah
  koleksi. Mode push langsung menerapkan skema baru ke database lokal, lalu
  `migrate` gagal dengan "already exists". Obatnya reset database seperti di
  atas; berkas migrasinya sendiri tetap benar dan itulah yang dipakai prod.
  Jebakan ketiga: `next build` bisa panic (Turbopack "generate_source_map
  was canceled") kalau dijalankan saat dev server hidup dengan cache lama;
  obatnya matikan dev server, `rm -rf .next`, build lagi.
- LIVE di https://hub.zynergy.co.id (dan zynergy-hub.vercel.app) sejak
  2026-09-11 malam, deploy pertama dari commit 3e5c90c; deploy kedua
  (impor PDF, buyer per PO, laporan Excel) dari commit 7f4991a larut malam,
  keduanya atas perintah "deploy". Repo privat `danish-deepskill/zynergy-hub`, Vercel project
  `zynergy-hub` (scope `devdanzen-projects`). Neon `zynergy-hub` (paket
  gratis) dan Blob store `zynergy-hub-files` (region sin1) dibuat lewat
  CLI (`vercel integration add neon`, `vercel blob create-store`) dengan
  persetujuan Danish; env Production: PAYLOAD_SECRET, DATABASE_URL,
  DATABASE_URL_UNPOOLED, BLOB_READ_WRITE_TOKEN. `vercel.json` menjalankan
  migrate saat build (tujuh migrasi jalan bersih di Neon). Database prod
  masih kosong: Danish membuat admin pertama lewat form "Buat admin pertama"
  di hub.zynergy.co.id/login, lalu akun tim dari halaman Tim. Seed lokal
  tidak dipakai di prod. Deploy berikutnya: `vercel deploy --prod` dari repo
  ini, hanya atas perintah "deploy".
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

## Laporan Keuangan Ringkas untuk komisaris (2026-09-11 malam)

- Tombol "Laporan Excel" di Ringkasan (peran uang, termasuk Pengawas)
  mengunduh `/api/export/financial-report?unit=&month=`
  (`src/lib/export/financial-report-xlsx.ts`): lembar "Ringkasan" berisi
  laba rugi basis kas bulan ini dan tahun berjalan per unit + total
  (pendapatan per kategori, beban per kategori, surplus), pendanaan bersih,
  posisi kas akhir bulan per unit, ringkasan piutang PO dan PO berjalan,
  blok tanda tangan Disiapkan/Diperiksa; lembar "Piutang & PO" (rincian PO
  dikirim/ditagih belum lunas dengan jatuh tempo dan keterlambatan, dan PO
  diterima belum dikirim); lalu lampiran "Arus Kas" dan "Per Kategori"
  (dipakai ulang dari `addCashFlowSheets`). Gaya bersama di
  `src/lib/export/style.ts`. Data: `getPnl`, `getBalancesAt` (finance.ts),
  `getOrderBook` (orders.ts).
- Diberi label "basis kas" secara eksplisit: laporan keuangan resmi sesuai
  SAK (neraca, laba rugi akrual, catatan) tetap disusun akuntan PT; Hub
  tidak akan menjadi software akuntansi (keputusan 2026-09-11).

## Laporan Excel Arus Kas (2026-09-11 malam)

- Tombol "Excel" di Arus Kas mengunduh `/api/export/cash-flow?unit=&month=`:
  workbook bergaya (exceljs, `src/lib/export/cash-flow-xlsx.ts`) dengan logo
  (PNG di-inline base64 di `export/logo.ts` karena serverless tidak bisa
  membaca `public/` lewat fs), judul, unit dan periode, blok ringkasan
  (saldo awal, masuk/keluar operasional, pendanaan bila ada, saldo akhir),
  tabel transaksi dengan saldo berjalan, format Rupiah, total berformula,
  freeze header, autofilter, zebra, siap cetak landscape A4 dengan footer
  halaman; lembar kedua "Per Kategori". Angka dari `getLedger`, sama dengan
  layar. CSV mentah tetap ada sebagai tautan kecil untuk impor ke software
  akuntansi.

## Impor PDF PO dengan OpenAI (2026-09-11 malam)

- Tombol "Baca PDF dan isi form" di `/orders/new` (bagian atas OrderForm).
  Alur: pilih PDF di kolom "PDF PO pembeli", tekan Baca, server action
  `importOrderPdf` mengirim PDF (base64) ke OpenAI Responses API model
  `gpt-5-mini` dengan JSON schema strict (`src/lib/ai/openai.ts`), hasilnya
  jadi `OrderDraft` yang mengisi ulang form (blok field diberi `key` agar
  defaultValue ter-render ulang; input file di luar blok itu supaya PDF-nya
  tetap terpilih dan ikut tersimpan sebagai dokumen PO saat Simpan).
- Klien dicocokkan dari nama pembeli di PDF ke klien unit itu
  (`matchClient` di lib/orders: persis, lalu mengandung, lalu kata pertama).
  Peringatan ditampilkan untuk: nomor/tanggal tidak terbaca, klien tidak
  ketemu, item tanpa harga, jumlah item beda dari total PO, mata uang bukan
  IDR. Tidak ada yang tersimpan sebelum Simpan ditekan.
- Kunci: env `OPENAI_API_KEY` di Vercel (Production, Sensitive), dipasang
  Danish sendiri, batas belanja diatur di dashboard OpenAI. Di lokal tanpa
  kunci, `extractPurchaseOrder` mengembalikan contoh berlabel "mock"
  (hanya di NODE_ENV development) agar layar bisa diuji gratis. Untuk uji
  nyata lokal, Danish menaruh kunci di `.env.local` (di-ignore git), Claude
  tidak pernah membaca atau menampilkan nilainya.
- Pemakaian dicatat di koleksi `ai-usage` (feature, model, unit, token
  masuk/keluar, biaya USD dari tabel `aiModels` di options.ts, user, nama
  berkas). Halaman Alat menampilkan "Biaya AI bulan ini" untuk peran uang,
  dengan konversi kasar `usdToIdrApprox`. Angka resmi tetap di dashboard
  OpenAI (Usage per project dan per kunci).
- Keputusan penyedia: Danish memilih OpenAI (GPT-5 mini, $0,25/$2 per juta
  token) setelah membandingkan harga; sekitar Rp50 per PO dua halaman.
  Kode dibuat tanpa SDK (fetch langsung), jadi ganti penyedia hanya
  menyentuh `src/lib/ai/openai.ts`.

## Kategori pendanaan (2026-09-11 malam)

- Kategori transaksi punya `kind`: `operasional` atau `pendanaan`
  (`src/lib/options.ts`, helper `isFinancing`). Pendanaan: Setoran modal,
  Pinjaman diterima (masuk), Pengembalian pinjaman, Prive / dividen
  (keluar). Uang investor dicatat sebagai Setoran modal (saham) atau
  Pinjaman diterima, di unit yang akan memakai uangnya.
- Saldo menghitung semuanya. "Masuk/Keluar bulan ini", delta vs bulan lalu,
  grafik 12 bulan, dan pengeluaran per kategori hanya operasional; kartu KPI
  memberi catatan "belum termasuk Rp X pendanaan" saat ada. CSV punya kolom
  `kelompok` untuk akuntan.
- Kategori keluar baru `Transportasi` (ojek, bensin, parkir) untuk perjalanan
  umum; ongkos jalan demi PO tertentu tetap Pengiriman & logistik dan
  ditautkan ke PO-nya agar masuk margin PO.
- Pembukuan resmi PT (RUPS, notaris, AHU untuk perubahan modal) tetap di
  luar Hub.

## Peran dan unit (diputuskan 2026-09-11)

- Tiga unit: `digital`, `apps`, `supply` (field `unit` di Clients,
  Transactions, Receipts). Design berada di dalam Digital untuk urusan uang.
- Peran = tingkat akses, unit = ruang lingkup, jabatan = label saja.
  - `admin`: semua unit, kelola tim.
  - `finance`: klien, arus kas, dan pesanan penuh hanya di unit yang
    ditugaskan (`users.units`).
  - `staff` (Staf, ditambah 2026-09-11 malam atas permintaan Danish): untuk
    SEMENTARA haknya sama persis dengan finance (`seesMoney`/`editsMoney` di
    access.ts). Dibuat karena orang yang menjalankan Supply sehari-hari
    (Pak Rizal) butuh akses uang tanpa disebut "Finance". Dibedakan nanti
    kalau kebutuhannya berbeda.
  - `member` (Anggota): klien dan alat di unitnya, tanpa uang. Sejak
    2026-09-11 malam juga bisa membuka Pesanan di unitnya TANPA harga
    (daftar, detail, item tanpa harga satuan, dokumen), mengubah status dan
    catatan (kartu "Ubah status"), dan mengunggah/menghapus dokumen. Tidak
    bisa membuat atau menghapus PO, tidak melihat nilai PO, pembayaran,
    penagihan. Designer, marketing, business, developer masuk sini.
  - `viewer` (Pengawas, untuk komisaris): melihat semua unit, ringkasan, arus
    kas, klien, pesanan; tidak bisa mengubah apa pun.
- Harga di PO dilindungi di lapisan data: field `items.unitPrice` dan
  `subtotal` punya `access.read` untuk peran uang saja (`moneyFieldRead`),
  dan semua field data PO punya `access.update` untuk peran uang saja
  (`moneyFieldWrite`); anggota lewat REST hanya bisa mengubah `status`,
  `documents`, `notes`. Halaman server memakai Local API (overrideAccess),
  jadi UI menyembunyikan harga lewat prop `showMoney`; server action
  `updateOrderStatus`, `addDocument`, `removeDocument` memakai
  `canTouchOrder` (siapa pun di unit itu kecuali pengawas).
- Berkas dipisah dua koleksi: `receipts` (bukti transfer, akses uang) dan
  `documents` (PDF PO, invoice, surat jalan; akses seperti klien, jadi
  anggota bisa membukanya). Keduanya ke Vercel Blob di prod.
- Pembatasan dipaksa di lapisan data (`src/lib/access.ts`: moneyRead,
  moneyWrite, clientRead, clientWrite mengembalikan query `unit in units`),
  di hook `enforceUnit` untuk REST, dan di server action (`canWriteUnit`).
  UI hanya menyembunyikan; keamanannya di query.
- Klien: satu unit per klien. Klien Supply punya grup `supply` (nama badan
  hukum, NPWP, nomor vendor, termin, alamat penagihan) dan WhatsApp opsional;
  form klien menampilkan bagian itu saat unit = supply dan menyembunyikan
  paket/perpanjangan (lihat bagian Pesanan).
- Seed lokal: dev@zynergy.local (admin), finance.digital@zynergy.local
  (finance, unit digital), pengawas@zynergy.local (viewer),
  member@zynergy.local (anggota, digital), member.supply@zynergy.local
  (anggota, supply), staf.supply@zynergy.local (staf, supply), semua
  password zynergy-dev-only.

## Pesanan (PO Supply), 2026-09-11 malam

Pemicu: PO nyata dari pembeli industri untuk PT (Supply). Prinsipnya: satu
PO = satu berkas, berisi data terstruktur (untuk dashboard, piutang, dan
nanti invoice) plus semua dokumen aslinya. PDF PO asli hanya masuk ke Hub
(repo privat, Blob privat), tidak pernah ke repo situs yang publik, dan
tidak pernah ke skrip seed; data nyata diisi lewat UI di prod.

- Koleksi `orders` (`src/collections/Orders.ts`): `unit`, `number`,
  `revision`, `client` (relasi), `orderDate`, `deliveryDate`, `shipTo`,
  `incoterm`, `paymentTermsDays` (default 30), `buyerName`, `buyerEmail` (buyer per PO,
  ditambah 2026-09-11 malam karena satu perusahaan punya banyak buyer; kontak
  di data klien hanya default), `currency`, `items[]`
  (material, partNumber, description, qty, uom, unitPrice), `subtotal`,
  `status` (diterima, sourcing, dikirim, ditagih, dibayar, batal),
  `invoiceNumber`, `invoiceDate`, `dueDate`, `documents[]` (kind + upload ke
  `receipts` + note), `notes`. Hook: subtotal dihitung dari item kalau ada
  item; dueDate = invoiceDate + termin kalau kosong. Akses mengikuti aturan
  uang (admin, finance di unitnya, pengawas lihat saja) karena PO berisi harga.
- `transactions.order`: relasi ke PO. Saat uang masuk ditautkan ke PO dan
  total yang diterima >= nilai PO, status PO otomatis jadi `dibayar`
  (`settleOrder` di `cash-flow/actions.ts`).
- Layar: `/orders` (filter unit, Berjalan/Dibayar/Semua, cari nomor PO,
  invoice, nama klien; urut PO berjalan berdasarkan tenggat terdekat),
  `/orders/new` (`?client=ID` memilih klien), `/orders/[id]` (KPI nilai,
  dibayar, sisa, tenggat; OrderForm; kartu Dokumen dengan unggah dan hapus;
  kartu Transaksi PO). Tombol "Catat pembayaran" membuka Arus Kas dengan
  sheet terisi (`/cash-flow?unit=supply&add=1&order=ID`, nominal = sisa).
  Ringkasan punya kartu "Pesanan berjalan" saat unit Supply tercakup.
  Detail klien Supply menampilkan PO-nya dan tombol PO baru.
- Logika di `src/lib/orders.ts` (orderTotal, nextDate, getOrders,
  getOrderSummary, getOrderPayments, getClientOptions). Helper bersama baru:
  `src/lib/form-data.ts` (text, digits, pick, dateOrNull) dan
  `src/lib/uploads.ts` (uploadReceipt, MAX_UPLOAD_BYTES), dipakai semua
  server action. `daysLabel` di `format.ts` untuk semua hitung mundur.
- Aturan hapus: klien yang punya PO tidak bisa dihapus (redirect
  `?blocked=N`); menghapus PO ikut menghapus berkas dokumennya; transaksi
  yang tertaut tetap ada (relasi jadi null).
- Tab HP: Pesanan tampil untuk semua peran; Alat hanya tampil di tab HP
  untuk anggota (semua isinya masih "Segera").
- Migrasi `20260911_120916_supply_orders` (orders, kolom supply_* di
  clients, whatsapp nullable, transactions.order_id). Seed menambah klien
  Supply contoh "PT Tambang Nusantara (contoh)" dengan satu PO, dan akun
  member@zynergy.local.
- `/clients` (2026-09-11 malam, permintaan Danish): pemilah unit
  Semua/Digital/Apps/Supply seperti Arus Kas dan Pesanan; "Semua"
  menampilkan satu bagian per unit dengan judul dan jumlah, bukan satu
  daftar campur. `/clients/new?unit=supply` memulai form di unit itu.
- Perapian (audit DRY/YAGNI/KISS, 2026-09-11 malam, permintaan Danish):
  `resolveUnit` (lib/finance) dan `UnitTabs` dipakai Ringkasan, Arus Kas,
  Klien, Pesanan; "Semua" selalu paling kiri dan jadi default untuk yang
  punya lebih dari satu unit (Arus Kas dulu default Digital). Komponen
  bersama baru: EmptyState, SearchForm, TxList, OrdersCard, deadline.ts
  (deadlineTone/deadlinePill/deadlineText), kelas buttonPrimary,
  buttonOutline, fileInputClass di form.tsx; ConfirmButton dipakai semua
  tombol hapus. Field mata uang PO dihapus (tidak pernah dipakai, semua
  nominal Rupiah). `allTransactions` dibungkus React `cache` agar dashboard
  memuat transaksi sekali per request. Dua migrasi malam ini digabung jadi
  satu (`supply_orders`) karena belum pernah dideploy.
- Belum dibuat: halaman invoice cetak, PO keluar ke supplier, margin, ekspor
  CSV pesanan.

## Peta subdomain (diputuskan 2026-09-11)

- zynergy.co.id: situs marketing (repo `zynergy`).
- hub.zynergy.co.id: Zynergy Hub, satu aplikasi untuk tim DAN klien (klien
  = peran tersendiri nanti, bukan subdomain terpisah). Diputuskan 2026-09-11
  menggantikan rencana team. + portal.
- app.zynergy.co.id: Zynergy Apps (bernama Products sampai 2026-09-11;
  diganti karena pelanggan bilang "aplikasi" dan "Products" bentrok dengan
  barang di Supply), project terpisah per aplikasi. Nilai unit di database
  ikut diganti lewat migrasi `rename_unit_products_to_apps` (RENAME VALUE
  pada lima enum unit).

## Roadmap modul

1. Klien + Keuangan (selesai).
2. Cek Google (riset klien): input nama + lokasi, cek profil Google, ulasan,
   website, IG, visibilitas kata kunci; laporan satu halaman. Google Places API.
3. Laporan bulanan: tarik angka Google Business Profile per klien, susun teks
   laporan, kirim manual via WA Business dulu, WhatsApp Cloud API nanti
   (nomor kedua, biaya per pesan, minta persetujuan dulu).
4. Portal klien (portal.zynergy.co.id): laporan, langganan, edit isi website
   (platform template, project terpisah).
5. Supply: PO masuk dan piutang SELESAI (modul Pesanan, 2026-09-11 malam).
   Berikutnya: halaman invoice cetak dari PO (menunggu contoh invoice lama
   yang diterima pembeli sebagai spesifikasi), lalu PO keluar ke distributor
   dan margin per PO. RFQ dari inbox sales@ (kartu RFQ, tenggat, template
   penawaran) dibangun setelah sesi 30 menit dengan Pak Rizal; email masuk
   via Zoho Mail API, forwarding ke webhook, atau IMAP (Mail Lite).
6. Claude API untuk ringkasan/draf/laporan: akun console dengan admin@,
   batas pengeluaran bulanan, minta persetujuan sebelum aktif.

Keputusan yang sudah dibahas: keuangan resmi PT tetap di pembukuan akuntan,
hub adalah buku kas operasional Digital; dokumentasi tim tetap di Notion;
email marketing tidak dibangun; aplikasi native ditunda, PWA dulu.
