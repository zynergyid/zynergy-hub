import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_prospects_source" ADD VALUE IF NOT EXISTS 'kenalan' BEFORE 'referensi';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "prospects" ALTER COLUMN "source" SET DATA TYPE text;
  DROP TYPE "public"."enum_prospects_source";
  CREATE TYPE "public"."enum_prospects_source" AS ENUM('klien-lama', 'referensi', 'riset', 'asosiasi', 'linkedin', 'lainnya');
  ALTER TABLE "prospects" ALTER COLUMN "source" SET DATA TYPE "public"."enum_prospects_source" USING "source"::"public"."enum_prospects_source";`)
}
