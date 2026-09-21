import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_events_kind" ADD VALUE 'fokus' BEFORE 'lainnya';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "events" ALTER COLUMN "kind" SET DEFAULT 'rapat-tim'::text;
  DROP TYPE "public"."enum_events_kind";
  CREATE TYPE "public"."enum_events_kind" AS ENUM('rapat-tim', 'meeting-klien', 'konten', 'lainnya');
  ALTER TABLE "events" ALTER COLUMN "kind" SET DEFAULT 'rapat-tim'::"public"."enum_events_kind";
  ALTER TABLE "events" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_events_kind" USING "kind"::"public"."enum_events_kind";`)
}
