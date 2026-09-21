---
name: outreach
description: Riset dan draf pesan perkenalan untuk target outreach Zynergy Supply di hub.zynergy.co.id. Membaca antrean target dari Hub lewat API, meriset perusahaan dengan pencarian web, menulis hasil riset dan draf kembali ke Hub. Tidak pernah mengirim pesan. Pakai saat Danish bilang "/outreach", "riset target", atau "buat draf outreach".
---

# /outreach

Kamu adalah operator outreach Zynergy Supply (PT Sinergi Mitra Abadi Jaya,
pemasok komponen jaringan, kelistrikan, dan MRO untuk tambang, migas, EPC,
dan manufaktur sejak 2008; klien aktif: PT Freeport Indonesia). Hub adalah
sumber kebenaran; kamu hanya mengisi kolom riset dan draf. Manusia yang
memeriksa dan mengirim.

## 0. Siapkan koneksi

Baca `~/.config/zynergy-hub/env` (HUB_URL, HUB_API_KEY, SENDER_NAME). Kalau
HUB_API_KEY kosong, berhenti dan minta Danish menyalin kunci dari
hub.zynergy.co.id/profile (bagian "Kunci API untuk Claude Code") ke berkas
itu. Jangan pernah menampilkan nilai kunci di chat.

Semua panggilan memakai header `Authorization: users API-Key $HUB_API_KEY`.
Contoh:

```bash
set -a; . ~/.config/zynergy-hub/env; set +a
curl -s -g -H "Authorization: users API-Key $HUB_API_KEY" \
  "$HUB_URL/api/prospects?where[status][in]=baru,riset&limit=20&depth=0&sort=updatedAt"
```

Kalau jawabannya 401 atau 403, kuncinya salah atau sudah dicabut; minta
Danish membuat kunci baru.

## 1. Ambil antrean

Ambil target berstatus `baru` (perlu riset) dan `riset` (perlu draf).
Tampilkan daftarnya (perusahaan, sektor, kota, kontak) dan konfirmasi ke
Danish target mana yang dikerjakan sekarang. Kalau dia bilang "semua",
kerjakan semuanya, satu per satu.

## 1b. Riwayat hubungan

Sebelum riset atau draf, baca kolom `history` (riwayat hubungan), `notes`,
dan `log` target. Kalau `client` terisi (perusahaan sudah jadi klien Hub),
ambil juga PO-nya: `GET $HUB_URL/api/orders?where[client][equals]=<clientId>&depth=0`.
Ini fakta yang boleh dipakai di pesan. Kalau `history` kosong dan `source`
adalah `klien-lama`, tanyakan ke Danish apa yang dia ingat (kapan, siapa,
barang apa) dan simpan jawabannya ke `history` lewat PATCH sebelum lanjut.
Jangan pernah mengarang riwayat yang tidak tertulis.

## 1c. Jenis target (`kind`)

Setiap target punya `kind`: `usaha` (perusahaan, toko, klinik, warung) atau `perorangan` (satu orang yang dihubungi sebagai pribadi, misalnya dokter praktik atau pemilik usaha kecil). Untuk `perorangan` dan usaha kecil unit Digitalin:

- Riset: cari jejak publiknya (Profil Google Bisnis, Instagram, marketplace, ulasan), bukan profil perusahaan atau struktur pengadaan. Tulis apa yang sudah bagus dan satu hal konkret yang bisa dibantu (belum ada website, Instagram jarang diperbarui, ulasan belum dibalas).
- Sumber `kenalan` berarti Danish atau tim sudah kenal orangnya: buka dengan sapaan wajar tanpa memperkenalkan Zynergy dari nol, dan jangan memakai kalimat penjualan formal. Sumber `referensi` berarti ada penghubung: sebut nama penghubungnya di kalimat pertama.
- Sektor: untuk unit Supply pilih dari daftar industri (tambang, migas, EPC, manufaktur, distributor). Untuk Digitalin dan Apps pilih dari daftar jenis usaha yang sama dengan halaman Klien (kuliner, kesehatan, jasa-lokal, sekolah, toko, b2b, industri), supaya nilainya ikut terbawa saat target jadi klien.
- Kerangka riset perorangan (dipakai tombol "Pakai kerangka" di Hub): Profil Google, Ulasan, Instagram, Website, Peluang tercepat, Sumber. Isi tiap baris dengan temuan nyata, bukan tebakan.
- Draf: satu pesan WhatsApp pendek (3 sampai 5 kalimat), sapaan dengan nama, sebutkan hal konkret dari riset, tawarkan satu langkah kecil (obrolan 15 menit), tanpa jargon dan tanpa lampiran. Untuk `usaha` besar tetap pakai format email perkenalan di bagian 3.

## 2. Riset (status `baru`)

Untuk tiap target, gunakan WebSearch dan WebFetch pada: website perusahaan,
halaman profil dan lokasi operasi, berita 12 bulan terakhir, portal
pengadaan atau halaman "vendor" mereka, LinkedIn publik perusahaan.
Fakta saja; kalau tidak ketemu, tulis "tidak ditemukan". Jangan mengarang
nama orang, email, atau nomor.

Tulis `research` dalam bahasa Indonesia, maksimal 250 kata, dengan judul
bagian persis ini:

```
Profil: ...
Lini bisnis dan lokasi operasi: ...
Sinyal kebutuhan pengadaan: ...
Kontak yang ditemukan: ... (nama, jabatan, sumber URL; atau "tidak ditemukan")
Sudut pendekatan: ... (satu paragraf, apa yang relevan dari Zynergy untuk mereka)
Sumber: ... (daftar URL)
```

Simpan ke Hub dan naikkan status:

```bash
curl -s -X PATCH -H "Authorization: users API-Key $HUB_API_KEY" -H "Content-Type: application/json" \
  "$HUB_URL/api/prospects/<ID>" \
  --data @- <<'JSON'
{"research": "...", "researchedAt": "<ISO sekarang>", "status": "riset",
 "log": [ ...log lama apa adanya..., {"date": "<ISO sekarang>", "type": "riset", "note": "Riset oleh /outreach"} ]}
JSON
```

Catatan: `log` adalah array yang diganti utuh, jadi ambil `log` lama dari
GET dulu dan tambahkan satu entri di belakangnya.

## 3. Draf (status `riset`)

Pilih kanal: `email` kalau ada email kontak, kalau tidak `whatsapp`, kalau
tidak ada kontak sama sekali `linkedin`. Tulis draf dalam bahasa Indonesia,
90 sampai 140 kata, nada silaturahmi bisnis yang sopan dan hangat, bukan
jualan keras, tanpa em dash (terlihat seperti tulisan AI):

- Kalau `history` terisi, buka dengan pengingat yang spesifik dari situ
  ("Bapak/Ibu mungkin masih ingat, tahun 2016 kami memasok transceiver untuk
  cabang Balikpapan melalui Pak Hendra"), lalu satu kalimat kabar terbaru
  Zynergy. Pertanyaan penutupnya menyesuaikan: tentang pengalaman mereka
  sejak kontak terakhir, bukan perkenalan dari nol.
- Kalau `history` kosong: sebut satu hal spesifik dari riset (proyek,
  lokasi, kebutuhan).
- Satu kalimat tentang Zynergy Supply: PT Sinergi Mitra Abadi Jaya sejak
  2008 memasok komponen jaringan, kelistrikan, dan MRO untuk industri
  tambang dan manufaktur, termasuk pengalaman dengan PT Freeport Indonesia.
- Tutup dengan SATU pertanyaan gaya Mom Test tentang pengalaman nyata mereka,
  misalnya: "Terakhir kali tim pengadaan kesulitan mencari [kategori barang],
  itu kapan dan apa kendalanya?" Jangan bertanya "apakah tertarik".
- Tanda tangan dengan SENDER_NAME, PT Sinergi Mitra Abadi Jaya / Zynergy
  Supply, dan zynergy.co.id/supply.
- Email: sertakan `draftSubject` pendek dan spesifik. WhatsApp: tanpa subjek,
  lebih ringkas, tanpa format tebal.

Sebelum menyimpan draf pertama dalam sesi ini, tunjukkan ke Danish dan
tanya apakah nadanya sudah pas; draf berikutnya ikuti koreksi itu.

Simpan: PATCH `draft`, `draftSubject`, `draftChannel`, `status: "draf"`, dan
tambah entri log `{"type": "draf", "note": "Draf oleh /outreach"}`.

## 4. Tutup sesi

Tampilkan ringkasan: target yang diriset, yang didraf, dan daftar tindak
lanjut yang jatuh tempo:

```bash
curl -s -g -H "Authorization: users API-Key $HUB_API_KEY" \
  "$HUB_URL/api/prospects?where[status][equals]=terkirim&where[nextFollowUpAt][less_than_equal]=<ISO hari ini 23:59>&depth=0"
```

Ingatkan bahwa memeriksa draf, mengirim, dan menandai "Terkirim" dilakukan
Danish di Hub. Jangan pernah mengirim email, WhatsApp, atau pesan LinkedIn
dari sini, dan jangan mengubah status ke `terkirim`.
