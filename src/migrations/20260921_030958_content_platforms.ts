import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events" ALTER COLUMN "content_platform" SET DATA TYPE text;
  DROP TYPE "public"."enum_events_content_platform";
  CREATE TYPE "public"."enum_events_content_platform" AS ENUM('instagram', 'threads', 'linkedin', 'facebook', 'youtube', 'tiktok', 'x', 'website');
  ALTER TABLE "events" ALTER COLUMN "content_platform" SET DATA TYPE "public"."enum_events_content_platform" USING "content_platform"::"public"."enum_events_content_platform";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events" ALTER COLUMN "content_platform" SET DATA TYPE text;
  DROP TYPE "public"."enum_events_content_platform";
  CREATE TYPE "public"."enum_events_content_platform" AS ENUM('instagram', 'facebook', 'tiktok', 'linkedin', 'website');
  ALTER TABLE "events" ALTER COLUMN "content_platform" SET DATA TYPE "public"."enum_events_content_platform" USING "content_platform"::"public"."enum_events_content_platform";`)
}
