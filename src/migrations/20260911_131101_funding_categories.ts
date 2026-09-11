import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_transactions_category" ADD VALUE 'setoran-modal' BEFORE 'pembelian-barang';
  ALTER TYPE "public"."enum_transactions_category" ADD VALUE 'pinjaman-diterima' BEFORE 'pembelian-barang';
  ALTER TYPE "public"."enum_transactions_category" ADD VALUE 'transportasi' BEFORE 'hosting-domain';
  ALTER TYPE "public"."enum_transactions_category" ADD VALUE 'pengembalian-pinjaman';
  ALTER TYPE "public"."enum_transactions_category" ADD VALUE 'prive-dividen';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "transactions" ALTER COLUMN "category" SET DATA TYPE text;
  DROP TYPE "public"."enum_transactions_category";
  CREATE TYPE "public"."enum_transactions_category" AS ENUM('pembayaran-klien', 'perpanjangan', 'penjualan-barang', 'pemasukan-lain', 'pembelian-barang', 'logistik', 'hosting-domain', 'tools', 'iklan', 'gaji-honor', 'operasional', 'pajak', 'lainnya');
  ALTER TABLE "transactions" ALTER COLUMN "category" SET DATA TYPE "public"."enum_transactions_category" USING "category"::"public"."enum_transactions_category";`)
}
