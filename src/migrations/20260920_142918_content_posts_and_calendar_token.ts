import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_events_content_platform" AS ENUM('instagram', 'facebook', 'tiktok', 'linkedin', 'website');
  CREATE TYPE "public"."enum_events_content_status" AS ENUM('ide', 'draf', 'siap', 'tayang');
  ALTER TYPE "public"."enum_events_kind" ADD VALUE 'konten' BEFORE 'lainnya';
  ALTER TABLE "events" ADD COLUMN "content_platform" "enum_events_content_platform";
  ALTER TABLE "events" ADD COLUMN "content_status" "enum_events_content_status" DEFAULT 'ide';
  ALTER TABLE "events" ADD COLUMN "content_design_url" varchar;
  ALTER TABLE "events" ADD COLUMN "content_post_url" varchar;
  ALTER TABLE "users" ADD COLUMN "calendar_token" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "events" ALTER COLUMN "kind" SET DEFAULT 'rapat-tim'::text;
  DROP TYPE "public"."enum_events_kind";
  CREATE TYPE "public"."enum_events_kind" AS ENUM('rapat-tim', 'meeting-klien', 'lainnya');
  ALTER TABLE "events" ALTER COLUMN "kind" SET DEFAULT 'rapat-tim'::"public"."enum_events_kind";
  ALTER TABLE "events" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_events_kind" USING "kind"::"public"."enum_events_kind";
  ALTER TABLE "events" DROP COLUMN "content_platform";
  ALTER TABLE "events" DROP COLUMN "content_status";
  ALTER TABLE "events" DROP COLUMN "content_design_url";
  ALTER TABLE "events" DROP COLUMN "content_post_url";
  ALTER TABLE "users" DROP COLUMN "calendar_token";
  DROP TYPE "public"."enum_events_content_platform";
  DROP TYPE "public"."enum_events_content_status";`)
}
