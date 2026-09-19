import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_projects_log_type" ADD VALUE 'pertemuan' BEFORE 'catatan';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects_log" ALTER COLUMN "type" SET DATA TYPE text;
  ALTER TABLE "projects_log" ALTER COLUMN "type" SET DEFAULT 'catatan'::text;
  DROP TYPE "public"."enum_projects_log_type";
  CREATE TYPE "public"."enum_projects_log_type" AS ENUM('catatan', 'keputusan', 'perubahan', 'klien', 'tahap', 'status');
  ALTER TABLE "projects_log" ALTER COLUMN "type" SET DEFAULT 'catatan'::"public"."enum_projects_log_type";
  ALTER TABLE "projects_log" ALTER COLUMN "type" SET DATA TYPE "public"."enum_projects_log_type" USING "type"::"public"."enum_projects_log_type";`)
}
