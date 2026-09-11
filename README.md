# Zynergy Hub

Zynergy Hub (hub.zynergy.co.id): satu aplikasi untuk tim dan, nanti, klien.
Klien, keuangan, lalu riset klien, laporan bulanan, area klien, RFQ Supply.

## Stack

Next.js 16 (App Router) + Payload CMS 3 + Postgres, Tailwind v4, deploy Vercel.
Pola dan toolchain sama dengan repo `zynergy` (situs marketing).

## Struktur

```
src/
├── app/(hub)/        # Dashboard tim (/) + API internal (ekspor CSV)
├── app/(payload)/    # Panel admin Payload (/admin) + REST (/api)
├── collections/      # Clients, Transactions, Receipts, Users (dengan peran)
├── lib/              # access (peran), session, finance (ringkasan), format
└── payload.config.ts
```

Peran user: `admin` (semua), `finance` (klien + keuangan), `member` (klien saja).
Transaksi dan bukti hanya bisa dibaca admin dan finance, di panel maupun API.

## Menjalankan lokal

```bash
docker start zynergy-pg          # Postgres lokal, database zynergy_hub
pnpm install
cp .env.example .env.local       # isi PAYLOAD_SECRET (openssl rand -hex 32)
pnpm payload migrate
pnpm seed                        # admin dev + data contoh (lokal saja)
pnpm dev                         # http://localhost:3011, admin di /admin
pnpm build && pnpm lint
```

Ubah skema? `pnpm payload migrate:create <nama>` lalu commit migrasinya,
dan `pnpm generate:types`.
