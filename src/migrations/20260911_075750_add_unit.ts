import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_clients_unit" AS ENUM('digital', 'supply');
  CREATE TYPE "public"."enum_transactions_unit" AS ENUM('digital', 'supply');
  ALTER TYPE "public"."enum_clients_business_type" ADD VALUE 'industri' BEFORE 'lainnya';
  ALTER TYPE "public"."enum_transactions_category" ADD VALUE 'penjualan-barang' BEFORE 'hosting-domain';
  ALTER TYPE "public"."enum_transactions_category" ADD VALUE 'pemasukan-lain' BEFORE 'hosting-domain';
  ALTER TYPE "public"."enum_transactions_category" ADD VALUE 'pembelian-barang' BEFORE 'hosting-domain';
  ALTER TYPE "public"."enum_transactions_category" ADD VALUE 'logistik' BEFORE 'hosting-domain';
  ALTER TABLE "clients" ADD COLUMN "unit" "enum_clients_unit" DEFAULT 'digital' NOT NULL;
  ALTER TABLE "transactions" ADD COLUMN "unit" "enum_transactions_unit" DEFAULT 'digital' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "clients" ALTER COLUMN "business_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_clients_business_type";
  CREATE TYPE "public"."enum_clients_business_type" AS ENUM('kuliner', 'kesehatan', 'jasa-lokal', 'sekolah', 'toko', 'b2b', 'lainnya');
  ALTER TABLE "clients" ALTER COLUMN "business_type" SET DATA TYPE "public"."enum_clients_business_type" USING "business_type"::"public"."enum_clients_business_type";
  ALTER TABLE "transactions" ALTER COLUMN "category" SET DATA TYPE text;
  DROP TYPE "public"."enum_transactions_category";
  CREATE TYPE "public"."enum_transactions_category" AS ENUM('pembayaran-klien', 'perpanjangan', 'hosting-domain', 'tools', 'iklan', 'gaji-honor', 'operasional', 'pajak', 'lainnya');
  ALTER TABLE "transactions" ALTER COLUMN "category" SET DATA TYPE "public"."enum_transactions_category" USING "category"::"public"."enum_transactions_category";
  ALTER TABLE "clients" DROP COLUMN "unit";
  ALTER TABLE "transactions" DROP COLUMN "unit";
  DROP TYPE "public"."enum_clients_unit";
  DROP TYPE "public"."enum_transactions_unit";`)
}
