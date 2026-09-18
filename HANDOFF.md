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
  (impor PDF, buyer per PO, laporan Excel) dari commit 7f4991a larut malam;
  deploy ketiga 2026-09-17 (Ingat saya 90 hari/4 jam, perbaikan tabel di HP,
  akun lokal admin) dari commit fced6b2; deploy keempat 2026-09-18 (roadmap
  Supply, Outreach + kunci API + skill, Brankas Dokumen) dari commit 5ae97a3;
  deploy kelima 2026-09-18 (batas unggahan 4 MB, pratinjau dokumen, pesan
  error OpenAI, plus OPENAI_API_KEY yang diperbaiki Danish di Vercel) dari
  commit d83b391; deploy keenam 2026-09-19 dini hari (modul Proyek + Brief,
  menu per unit, akar perbaikan geser samping, umpan balik navigasi, baris
  item PO) dari commit a1c51f9, dua migrasi (`projects`, `project_brief`)
  jalan di Neon saat build; catatan: `vercel deploy --prod` pertama kali
  menjawab "Not authorized", ulang dengan `--scope devdanzen-projects`
  berhasil. Semua atas perintah "deploy". Repo privat `zynergyid/zynergy-hub`
  (dipindah 2026-09-19 dari akun pribadi danish-deepskill ke organisasi
  GitHub `zynergyid` bersama repo situs; alamat lama dialihkan GitHub,
  remote lokal sudah diganti). Integrasi Git Vercel untuk repo ini TIDAK
  bisa: Vercel Hobby menolak repo privat milik organisasi (409 "Upgrade to
  Pro"), jadi hub tetap deploy lewat CLI `vercel deploy --prod --scope
  devdanzen-projects` atas perintah "deploy"; kalau nanti pindah ke Vercel
  Pro (berbayar, perlu persetujuan Danish), pakai pola yang sama dengan
  repo situs: produksi dari cabang `production`. Vercel project
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
  admin@zynergy.local / admin via `pnpm seed`. Port 3011.

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

## Proyek (Digital/Apps), 2026-09-19

Pemicu: klien Digital pertama (aplikasi asesmen ergonomi RULA, berbasis web)
dan pertanyaan Danish "kalau ada 6 proyek, bagaimana tahu status masing-
masing?". Aplikasi kliennya sendiri TIDAK dibangun di Hub (repo dan deploy
terpisah, pengguna luar); yang masuk Hub hanya sisi bisnisnya. Riset praktik
agensi/konsultan (ybug, Teamwork, PMBOK, RAID log) dirangkum jadi tujuh
tahap yang tiap tahap ditutup artefak tertulis dan persetujuan klien; Hub
memakai versi "agensi kecil", bukan versi enterprise.

- Koleksi `projects` (migrasi `20260918_184010_projects`): unit, name,
  client, stage (discovery, scope, kickoff, desain, build, review, launch,
  selesai, batal), health (lancar/berisiko/terhambat; dipilih PJ tiap minggu,
  tidak dihitung), owner, stageChangedAt (diisi hook saat stage berubah),
  value + dpPercent (field uang, akses level field seperti PO), startDate,
  targetDate, nextAction + nextActionAt, blocker ("menunggu apa"),
  deliverables[] (title, done, doneAt), log[] (date, type, note),
  documents[] (kind, file -> koleksi `documents`, note), links (repo,
  staging, live), notes. `transactions.project` menautkan DP dan pelunasan.
- Akses = aturan Pesanan: baca dan sentuh (tahap, status, deliverable,
  riwayat, dokumen) siapa pun di unit itu; buat/hapus dan data uang hanya
  peran uang; pengawas hanya melihat. Pilihan tahap, kesehatan, jenis
  riwayat, jenis dokumen, dan `projectUnits` ada di `lib/options.ts`;
  helper di `lib/projects.ts` (getProjects dengan urutan: berjalan dulu,
  lewat tenggat dulu, lalu terhambat > berisiko > lancar, lalu tenggat
  terdekat; getProjectSummary; getProjectPayments; nextPayment = DP sebelum
  ada uang masuk, lalu sisa).
- Layar: /projects (filter Berjalan/Selesai/Semua, tab unit hanya
  Digital/Apps), /projects/new (klien bisa diprefill `?client=`),
  /projects/[id] dengan kartu Tahap (stepper 7 langkah + Selesai, tombol
  "Lanjut ke ..." dengan catatan, select untuk mundur/batal), Status
  mingguan (kesehatan, menunggu apa, langkah berikutnya + tenggat),
  Deliverable (centang, progres), Riwayat (catatan/keputusan/perubahan
  scope/masukan klien; tahap dan status dicatat otomatis), form data,
  Dokumen, Transaksi proyek. Tombol "Catat DP"/"Catat pelunasan" membuka
  Arus Kas dengan nominal terisi (`/cash-flow?add=1&project=ID`).
- Ringkasan: kartu "Proyek berjalan" (jumlah + nilai, perlu perhatian,
  lewat tenggat, 5 teratas). Detail klien Digital/Apps: kartu "Proyek klien
  ini" + tombol "Proyek baru". Sidebar dan tab HP: Pesanan hanya untuk unit
  Supply, Proyek hanya Digital/Apps (`NavItem.units`, `canSeeNav`); admin
  melihat keduanya (6 tab di HP, muat di 375px).
- DRY: `components/hub/DocumentsCard.tsx` sekarang generik (dipakai PO dan
  proyek, menerima action dan nama field pemilik); `lib/documents.ts`
  `keepDocumentRows` dipakai kedua action.
- **Brief** (migrasi `20260918_191416_project_brief`, grup `brief` di
  proyek): tujuan bisnis, pengguna, alur sekarang, alur yang diinginkan,
  ukuran sukses, batasan, `confirmedAt`. Ini analisis bisnis satu halaman
  dari sesi discovery, ditulis di Hub (kartu Brief di halaman proyek) supaya
  bisa dijadikan syarat: `setStage` menolak meninggalkan Discovery (kecuali
  ke Batal) kalau tiga kolom wajib (tujuan, pengguna, alur sekarang) kosong,
  dengan pesan lewat `?error=brief`. Centang "klien sudah mengonfirmasi"
  mengisi `confirmedAt` dan mencatat riwayat "Brief dikonfirmasi klien".
  Keputusan Danish 2026-09-19 ("your choice"): perencanaan dibuat
  proporsional, kira-kira satu hari per minggu build; brief plus scope,
  bukan dokumen panjang. Draf brief RULA dan 15 pertanyaan discovery
  dikirim ke Danish sebagai file terpisah (bukan di repo, data klien).
- **Skill `/brief`** di `~/.claude/skills/brief/SKILL.md` (di luar repo,
  seat Claude Code Danish, pola sama dengan /outreach): dari catatan
  pertemuan dan dokumen klien (PDF, xlsx lewat openpyxl) menulis enam kolom
  brief lewat `PATCH /api/projects/<id>` (grup `brief` dikirim utuh,
  `confirmedAt` dipertahankan, `log` ditambah satu entri "Brief disusun
  /brief ..., perlu diperiksa"); mode `pertanyaan` menyusun pertanyaan
  discovery; mode `arsitektur` menulis ARCHITECTURE.md di repo aplikasi
  klien. Tidak pernah mencentang konfirmasi atau mengubah tahap. Baru bisa
  dipakai ke prod setelah modul Proyek di-deploy; untuk lokal buat
  `~/.config/zynergy-hub/env.local` (HUB_URL=http://localhost:3011 + kunci
  dari /profile lokal) dan bilang "lokal". Diputuskan 2026-09-19 setelah
  membandingkan dengan pola Charlie (tombol di Hub + antrean + worker di
  mesin Danish): skill dulu karena hanya Danish yang menulis brief;
  antrean dan worker (satu hari kerja) ditambahkan kalau orang kedua perlu
  menekan tombolnya, dan skill ini yang jadi otaknya.
- Seed lokal: satu proyek contoh (Klinik Gigi, tahap Build, berisiko,
  brief terisi dan dikonfirmasi).
- Jebakan migrasi: `payload migrate` bertanya "run in dev mode ... data
  loss will occur? (y/N)" karena server dev pernah push schema; jawab y
  (`printf 'y\n' | npx payload migrate`), data lokal tetap ada selama
  server dev dimatikan SEBELUM koleksi diubah. Dengan stdin kosong prompt
  itu menggantung tanpa pesan.
- Belum: laporan Excel keuangan belum memasukkan piutang proyek (baru PO);
  pengingat mingguan untuk mengisi status; skill Claude Code untuk menyusun
  brief/scope dari catatan discovery.

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

## Baris item PO menyesuaikan lebar (2026-09-18)

- Di halaman detail PO form hanya 3/5 lebar, jadi delapan kolom item dalam
  satu baris terpotong (qty, satuan, harga tidak terbaca; terlihat di prod
  setelah impor PO Freeport). OrderForm memakai container query Tailwind v4:
  section item `@container`; di bawah `@3xl` (48rem) tiap item dua baris
  dengan label kecil per kolom (`ItemField`), di atasnya satu baris dengan
  header kolom. Halaman PO baru (max-w-4xl) memakai satu baris, halaman
  detail dua baris.

## Umpan balik navigasi (2026-09-18)

- Keluhan: tab (Semua/Digital/..., filter status) "kadang tidak terklik".
  Penyebab: navigasi klien memuat halaman dinamis dari server (fungsi
  Vercel + query Neon, 1 sampai 3 detik saat dingin) tanpa tanda apa pun.
- Obat: `src/app/(hub)/loading.tsx` (kerangka abu-abu langsung tampil saat
  navigasi mulai, berlaku untuk semua halaman Hub) dan `SegmentedLinks`
  jadi client component dengan `useLinkStatus` (spinner kecil di tab yang
  diklik selama permintaannya berjalan). Kalau masih terasa lambat, langkah
  berikutnya adalah mempercepat query (Ringkasan memuat semua transaksi
  untuk KPI) atau menambah cache per request.

## Batas unggahan (2026-09-18, bug prod pertama Brankas)

- Gejala: "Simpan dokumen" di prod 500; log Vercel: "Body exceeded 1 MB
  limit" (bawaan server action Next). Uji lokal hanya memakai PDF kecil.
- Obat: `experimental.serverActions.bodySizeLimit: "4mb"` di next.config.ts;
  satu konstanta `src/lib/limits.ts` (MAX_UPLOAD_MB = 4, karena fungsi
  Vercel menolak body > 4,5 MB) dipakai Payload `upload.limits.fileSize`,
  semua server action, dan komponen `FileInput` (client) yang menolak berkas
  kebesaran SEBELUM dikirim (setCustomValidity + pesan), karena server action
  tidak pernah jalan saat body terlalu besar sehingga tidak bisa memberi
  pesan sendiri. FileInput dipakai di Brankas, bukti transaksi, PDF PO, dan
  dokumen PO.
- Kalau nanti butuh berkas > 4 MB (akta scan panjang): unggah langsung dari
  browser ke Vercel Blob (`@vercel/blob/client` + route handleUpload) lalu
  buat dokumennya, bukan lewat server action.

## Brankas Dokumen (2026-09-18)

- Dokumen legal PT, bukan per unit: koleksi `vault-documents` (title,
  category dari `vaultCategories`, number, issuer, issuedAt, expiresAt,
  file → `vault-files`, confidential, notes) dan koleksi upload
  `vault-files` (Vercel Blob; field `confidential` dicerminkan dari dokumen
  agar endpoint berkas menerapkan aturan yang sama). Akses (`vaultRead`,
  `vaultWrite` di access.ts): semua yang login boleh melihat dan mengunduh,
  kecuali dokumen `confidential` yang hanya untuk peran uang (admin,
  finance, staf); unggah, ubah, hapus hanya peran uang.
- Layar: `/vault` (dikelompokkan per kategori, filter chip kategori, cari,
  badge kedaluwarsa merah/kuning dari `expiryState`, tombol Unduh),
  `/vault/new`, `/vault/[id]` (form, ganti berkas, hapus; dokumen rahasia
  404 untuk peran non-uang). Ringkasan: kartu "Brankas Dokumen" berisi
  dokumen yang kedaluwarsa atau habis dalam 30 hari (`VAULT_WARN_DAYS`).
  Sidebar bagian Harian: "Brankas Dokumen"; tidak di tab HP (masuk lewat
  kartu Ringkasan). Logika di `src/lib/vault.ts`.
- Jebakan yang ketemu saat uji: halaman server memakai Local API
  (`payload.find`) yang MELEWATI access control, jadi aturan "rahasia"
  harus diterapkan lagi di query halaman (`visibility()` di lib/vault.ts,
  parameter `includeConfidential`). REST sudah aman lewat `vaultRead`.
  Berlaku umum: setiap aturan akses yang bukan per unit harus diulang di
  query halaman. Berkas ikut terhapus lewat hook `afterDelete` di
  vault-documents, jadi hapus lewat REST pun tidak meninggalkan berkas.
- `uploadFile(payload, collection, data, file)` sekarang generik untuk
  receipts, documents, vault-files.
- Pratinjau (thumbnail, 2026-09-18, permintaan Danish): dibuat di BROWSER
  saat berkas dipilih (`src/lib/thumbnail.ts`: pdf.js dimuat dinamis untuk
  halaman pertama PDF, canvas untuk gambar; lebar 320px, PNG), dikirim
  bersama form sebagai field `thumbnail`, disimpan sebagai dokumen kedua di
  `vault-files` dengan flag rahasia yang sama, ditautkan di
  `vault-documents.thumbnail`. Server tidak merender PDF (tidak ada poppler
  di Vercel). Tampil 56px di kiri baris daftar dan 80x112 di halaman
  dokumen; ikon berkas kalau tidak ada. Berkas baru menghapus pratinjau
  lama; hook afterDelete menghapus keduanya. Worker pdf.js disalin ke `public/pdf.worker.min.mjs` oleh
  `scripts/copy-pdf-worker.mjs` saat postinstall (di-ignore git, jadi selalu
  sama dengan versi pdfjs-dist yang terpasang); rujukan `import.meta.url`
  tidak menghasilkan aset di Turbopack (404).
- Belum: pengingat email/WA, "unduh paket" zip untuk registrasi vendor.

## Outreach (2026-09-17, modul pertama dari roadmap Supply)

- Keputusan runtime AI: riset dan draf TIDAK memanggil OpenAI dari Hub.
  Dikerjakan oleh skill Claude Code `/outreach` di seat Max Danish
  (`~/.claude/skills/outreach/SKILL.md`, di luar repo), lewat REST API Hub
  dengan kunci API per pengguna (`auth.useAPIKey` di Users; header
  `Authorization: users API-Key <kunci>`). Kunci dibuat/diganti/dicabut di
  `/profile` (kartu "Kunci API untuk Claude Code"), disimpan Danish di
  `~/.config/zynergy-hub/env` (HUB_URL, HUB_API_KEY, SENDER_NAME). Hub tidak
  pernah mengirim pesan; manusia yang mengirim lewat email/WA/LinkedIn.
- Koleksi `prospects` (`src/collections/Prospects.ts`): unit, company,
  sector, city, source, website, linkedin, contacts[] (name, role, email,
  phone, linkedin), history (riwayat hubungan: email lama, order lama, siapa
  yang kenal; skill membacanya agar pesan membuka dengan pengingat spesifik,
  ditambah 2026-09-17 atas permintaan Danish), status (baru → riset → draf → terkirim → dibalas →
  pertemuan → klien; berhenti), owner (user), research + researchedAt,
  draftSubject/draftChannel/draft, lastSentAt/sentChannel/nextFollowUpAt/
  followUpCount, repliedAt, client (relasi setelah jadi klien), log[]
  (date, type, note), notes. Akses seperti Klien (semua peran di unitnya,
  pengawas baca saja); bukan data uang.
- Layar: `/outreach` (tab unit, filter Aktif/Perlu riset/Draf siap/
  Menunggu/Dibalas/Semua, cari; urutan: tindak lanjut jatuh tempo dulu, lalu
  status yang butuh tangan), `/outreach/new`, `/outreach/[id]` (kartu Draf
  dengan Salin, Buka WhatsApp (wa.me?text=), Buka email (mailto); kartu
  Progres: Tandai terkirim → status terkirim + nextFollowUpAt = +7 hari;
  Catat tindak lanjut → count+1, +7 hari lagi; Catat balasan → dibalas;
  Jadikan klien → membuat Klien Supply dari data target dan menautkannya;
  Ubah status bebas; kartu Riset (`ResearchCard`: teks riset diurai
  `src/lib/research.ts` menjadi bagian berjudul plus daftar tautan Sumber
  sebagai chip; kotak teks hanya saat Ubah; URL di teks jadi tautan lewat
  `Linkify`); kartu Riwayat dengan catatan). Ringkasan
  punya kartu "Outreach hari ini" (tindak lanjut jatuh tempo, draf siap,
  perlu riset, menunggu) untuk semua peran. Logika di `src/lib/outreach.ts`
  (getProspects, getOutreachSummary, followUpDue, nextAction).
- Alur skill: GET prospects status in (baru, riset) → riset dengan
  WebSearch/WebFetch → PATCH research/researchedAt/status=riset + log →
  draf (email kalau ada email kontak, kalau tidak WhatsApp) → PATCH
  draft/draftSubject/draftChannel/status=draf + log → tampilkan tindak
  lanjut jatuh tempo. `log` diganti utuh saat PATCH, jadi skill mengambil
  log lama dulu. Skill tidak boleh mengubah status ke terkirim.
- Navigasi: "Outreach" di sidebar bagian Harian dan di tab HP (tab Alat dan
  Tim dikeluarkan dari HP; admin punya tautan "Kelola tim" di Profil).
  Halaman Alat: Antrean Outreach dan Tindak Lanjut dipindah ke "sudah
  jalan"; sisa: Registrasi Vendor, Brankas Dokumen, PO dari Email, RFQ.
- Migrasi `20260917_162501_outreach_prospects_api_keys` (tabel prospects +
  kolom api key di users) dan `20260917_163932_prospect_history`. Seed lokal menambah satu target contoh.
- Tautan ke Klien (2026-09-17, "sambungkan"): target dan klien tetap dua
  koleksi (daftar Klien = yang membayar; antrean = banyak nama yang tidak
  jadi), tapi satu perusahaan satu catatan: form target punya pilihan
  "Klien yang sudah ada" (plus saran otomatis via `matchClient` kalau nama
  mirip), halaman target menampilkan kartu "Klien terkait" dengan PO
  terakhir, halaman klien menampilkan kartu "Outreach" (status target
  terkait) dan tombol "Mulai outreach" (`startOutreachFromClient`: target
  terisi dari data klien, sumber klien-lama, tertaut). "Jadikan klien" pada
  target yang sudah tertaut hanya mengubah status, tidak membuat klien
  duplikat. Skill membaca PO klien terkait untuk draf reaktivasi.
- Belum: kirim otomatis (tidak akan), tarik LinkedIn, pengingat via email.

## Layar HP: tabel tidak boleh melebarkan halaman (2026-09-17)

- Gejala di prod (Chrome DevTools iPhone 16 Pro Max, 440px): header dan kartu
  atas lebih sempit dari bar bawah. Penyebab: kartu "Transaksi terbaru" di
  Ringkasan memakai `<table>` auto-layout; keterangan panjang plus nominal
  besar membuat tabel lebih lebar dari layar dan mendorong seluruh dokumen
  (scrollWidth > viewport). Data seed lokal pendek, jadi tidak pernah muncul.
- Obat: sel pertama `max-w-0` (kolom itu mengambil sisa lebar dan `truncate`
  bekerja), sel nominal `whitespace-nowrap`. Diterapkan di Ringkasan dan tabel
  desktop Arus Kas. Aturan ke depan: setiap `<table className="w-full">`
  yang punya teks bebas harus memakai pola ini, atau pakai daftar flex
  (`min-w-0` + `truncate`) seperti TxList.
- Sekalian: BarChart punya gutter kanan (`padR`) untuk label sumbu, dan label
  unit di tabel Arus Kas memakai `unitLabel` (sebelumnya ternary dua unit yang
  menampilkan Apps sebagai "Digital").
- Laptop kecil (lg, 1024px, sidebar terbuka, isi sekitar 700px): tabel Arus
  Kas hanya menampilkan Transaksi, Tanggal, Nominal, Saldo; kolom Klien,
  Metode, Bukti muncul mulai xl (1280px). Baris empat kartu KPI (Ringkasan,
  Arus Kas, detail PO, Alat) jadi empat kolom mulai xl, di bawahnya dua kolom,
  supaya nominal besar tidak patah baris.
- Kasus kedua (2026-09-18, Klien dan Outreach di prod): `SegmentedLinks`
  adalah `inline-flex` tanpa wrap; enam pil status ("Aktif ... Semua") lebar
  454px, lima pil Klien 408px = pas sekali di 440px, lalu lewat batas begitu
  fontnya Segoe UI (Windows) atau layarnya 390px. Obat di akar, bukan per
  halaman:
  1. `SegmentedLinks` sekarang `max-w-full flex-wrap` dengan label
     `whitespace-nowrap`: pil turun ke baris kedua, halaman tidak pernah
     ikut melebar. Berlaku untuk semua pemakainya (UnitTabs, filter status).
  2. `<main>` di `(hub)/layout.tsx` memakai `overflow-x-clip`: apa pun yang
     dirender halaman tidak bisa lagi mendorong dokumen lebih lebar dari
     layar HP. Konten yang terlalu lebar terpotong di tepi, bukan menggeser
     bar bawah.
  3. `OverflowGuard` (hanya `NODE_ENV !== "production"`) dipasang di layout:
     setelah tiap navigasi dan saat resize, `console.warn` menyebut elemen di
     dalam `<main>` yang lebih lebar dari layar, kecuali yang berada di dalam
     pembungkus `overflow-x-auto` (tabel yang memang boleh di-scroll). Jadi
     halaman baru yang melebar langsung ketahuan di console dev, tanpa harus
     menunggu laporan dari HP.
- Cara cek cepat yang benar: buka halaman di DevTools mode HP dan lihat
  console; jangan andalkan `scrollWidth == innerWidth`, karena emulasi HP
  Chrome ikut memperlebar `innerWidth` saat konten meluap (di sana 470 saat
  layar 440), sehingga perbandingan itu selalu tampak "sama".

## Sesi login dan "Ingat saya" (2026-09-17)

- Sebelumnya `auth: true` memakai bawaan Payload: token 2 jam, jadi tim
  harus login ulang beberapa kali sehari. Konstanta di
  `src/lib/auth-cookie.ts`: token maksimal 90 hari
  (`SESSION_MAX_AGE_SECONDS`, dipakai `tokenExpiration` Users), login biasa
  4 jam (`SHORT_SESSION_SECONDS`), perpanjangan saat token lebih tua dari
  1 hari (`REFRESH_AFTER_SECONDS`).
- Form login memanggil `/api/auth/login` (route Hub), bukan
  `/api/users/login`: `payload.login` lalu menulis cookie `payload-token`
  sendiri. Kotak "Ingat saya di perangkat ini" (default tercentang):
  cookie 90 hari plus cookie penanda `hub-remember` (bisa dibaca browser);
  tanpa centang cookie 4 jam dan penanda dihapus.
- Perpanjangan geser: `SessionKeepAlive` (dipasang di layout) memanggil
  `POST /api/auth/refresh` sekali per tab kalau penanda ada; route itu
  memakai `refreshOperation` Payload (token baru + `sessions.expiresAt`
  diperpanjang) hanya bila token lebih tua dari sehari, selain itu 204.
  Hasilnya: perangkat yang dipakai minimal sekali per 90 hari tidak pernah
  login ulang; perangkat yang ditinggalkan mati sendiri setelah 90 hari;
  menghapus akun dari Tim memutus akses seketika.
- Pesan salah password dan akun terkunci (5 kali gagal, 10 menit)
  diterjemahkan. Logout tetap `/api/users/logout` (menghapus sesi server).
- Catatan: token JWT tetap berlaku sampai `exp` walau cookie 4 jam sudah
  hilang; untuk alat internal ini diterima. "Keluar dari semua perangkat"
  (hapus `sessions` user) bisa ditambah nanti kalau perlu.

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
- Seed lokal: admin@zynergy.local (admin), finance.digital@zynergy.local
  (finance, unit digital), pengawas@zynergy.local (viewer),
  member@zynergy.local (anggota, digital), member.supply@zynergy.local
  (anggota, supply), staf.supply@zynergy.local (staf, supply), semua password "admin" (hanya lokal; diganti 2026-09-17 agar mudah).

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

## Roadmap modul (disinkronkan 2026-09-17 dengan keputusan strategis Danish)

Kerangka (dari rangkuman Danish sendiri, percakapan lain, dibagikan
2026-09-17): fokus **Supply** (PT sejak 2008, PO Freeport nyata); **Digital
pasif** (terima kalau datang sendiri, tidak dikejar); **Apps/ERP ditunda 1
sampai 3 tahun**. Cara kerja: outreach personal ("silaturahmi", bukan cold
outreach), pertanyaan gaya Mom Test, AI menyusun riset dan draf, manusia yang
memeriksa dan mengirim; balasan otomatis penuh tidak akan dibangun.
Kebiasaan yang ingin dia jaga: riset 5 kontak per hari, 1 pesan perkenalan
per hari, tindak lanjut H+7, review pipeline tiap Sabtu.

Selesai: Klien, Arus Kas (kategori pendanaan, Excel, laporan keuangan
ringkas), Pesanan (PO, dokumen, pembayaran, buyer per PO), impor PDF PO
(OpenAI, tahap periksa), peran dan unit (admin/finance/staf/anggota/pengawas),
"Ingat saya". Prinsip data yang dia minta (tabel PO terpisah dari tabel kas,
terhubung `transactions.order`) sudah terpenuhi.

Berikutnya, urut prioritas:

1. **Antrean Outreach.** Target = perusahaan + kontak (klien lama untuk
   reaktivasi: Trakindo, Hyundai E&C, Merdeka Copper, Sorikmas; klien baru:
   tambang/EPC menengah, IMA, Kadin, LinkedIn). Alur: riset AI (profil
   perusahaan, kebutuhan pengadaan, kontak) -> draf pesan perkenalan
   personal -> antrean periksa -> Danish edit dan setujui -> kirim MANUAL
   (email/WA/LinkedIn) -> catat tanggal kirim. Target 1 per hari. Butuh
   koleksi prospek/kontak + aktivitas. Model: OpenAI (kunci sudah ada), biaya
   dicatat di ai-usage.
2. **Tindak lanjut.** Pengingat H+7 dan H+14 tanpa balasan, tampil di
   Ringkasan; ringkasan mingguan untuk review Sabtu.
3. **Registrasi vendor.** Per perusahaan target: status pendaftaran, dokumen
   yang diminta, tenggat, PIC, portal vendor.
4. **Brankas dokumen.** Dokumen legal PT (akta, NIB, NPWP, sertifikat,
   company profile, referensi) dengan tanggal kedaluwarsa dan pengingat;
   koleksi upload terpisah, akses admin dan staf.
5. **PO dari email.** Sumber yang benar adalah Gmail lama PT (alamat vendor
   yang tercetak di PO Freeport adalah Gmail), BUKAN Zoho; Zoho hanya email
   brand. Gmail API baca email masuk -> deteksi PO (pola subjek/lampiran) ->
   impor PDF yang sudah ada -> draf PO -> Danish periksa dan simpan. Tetap
   ada tahap periksa (risiko salah baca angka).
6. **Invoice cetak dari PO** (menunggu contoh invoice lama yang diterima
   pembeli), lalu PO keluar ke distributor dan margin per PO.
7. **RFQ Supply** (kartu RFQ dari email, tenggat, template penawaran)
   setelah sesi 30 menit dengan Pak Rizal.
8. **WhatsApp:** tetap level 1 (tombol wa.me). Business API + draf AI dengan
   review hanya nanti; balasan otomatis penuh tidak dibangun (risiko
   reputasi, budaya butuh sentuhan personal).

Digital: klien pertama datang 2026-09-19 (aplikasi asesmen RULA berbasis web;
aplikasinya dibangun di repo terpisah, bukan di Hub). Yang dibangun di Hub:
modul Proyek (lihat bagian "Proyek"). Masih ditunda sampai ada kebutuhan
nyata: Cek Google, Laporan bulanan via WA, Portal klien. Dicatat di halaman
Alat sebagai "Ditunda", tidak lagi di sidebar.

Apps/ERP (visi Odoo + agen AI): tidak ada pekerjaan; visi jangka panjang.

Aplikasi native: Danish ingin aplikasi native "beneran" suatu saat.
Arsitektur yang disepakati: satu database + satu API (REST Payload sudah
ada) + dua tampilan (web Hub dan React Native/Expo). PWA dulu sampai ada
kebutuhan nyata; Play Store internal testing ($25 sekali), App Store $99/tahun
kalau perlu.

Tidak dipakai sekarang: n8n, OpenClaw/ML/DevOps, analitik kompleks.

Keputusan yang sudah dibahas: keuangan resmi PT tetap di pembukuan akuntan,
hub adalah buku kas operasional semua unit; dokumentasi tim tetap di Notion;
email marketing tidak dibangun.
