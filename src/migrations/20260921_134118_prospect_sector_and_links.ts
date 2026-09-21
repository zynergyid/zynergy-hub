import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_prospects_sector" ADD VALUE IF NOT EXISTS 'kuliner';
  ALTER TYPE "public"."enum_prospects_sector" ADD VALUE IF NOT EXISTS 'kesehatan';
  ALTER TYPE "public"."enum_prospects_sector" ADD VALUE IF NOT EXISTS 'jasa-lokal';
  ALTER TYPE "public"."enum_prospects_sector" ADD VALUE IF NOT EXISTS 'sekolah';
  ALTER TYPE "public"."enum_prospects_sector" ADD VALUE IF NOT EXISTS 'toko';
  ALTER TYPE "public"."enum_prospects_sector" ADD VALUE IF NOT EXISTS 'b2b';
  ALTER TYPE "public"."enum_prospects_sector" ADD VALUE IF NOT EXISTS 'industri';
  ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "google_profile" varchar;
  ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "instagram" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "prospects" ALTER COLUMN "sector" SET DATA TYPE text;
  DROP TYPE "public"."enum_prospects_sector";
  CREATE TYPE "public"."enum_prospects_sector" AS ENUM('tambang', 'migas', 'epc', 'manufaktur', 'distributor', 'lainnya');
  ALTER TABLE "prospects" ALTER COLUMN "sector" SET DATA TYPE "public"."enum_prospects_sector" USING "sector"::"public"."enum_prospects_sector";
  ALTER TABLE "prospects" DROP COLUMN "google_profile";
  ALTER TABLE "prospects" DROP COLUMN "instagram";`)
}
