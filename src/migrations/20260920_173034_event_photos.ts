import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "event_photos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  ALTER TABLE "events" ADD COLUMN "photo_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "event_photos_id" integer;
  CREATE INDEX "event_photos_updated_at_idx" ON "event_photos" USING btree ("updated_at");
  CREATE INDEX "event_photos_created_at_idx" ON "event_photos" USING btree ("created_at");
  CREATE UNIQUE INDEX "event_photos_filename_idx" ON "event_photos" USING btree ("filename");
  ALTER TABLE "events" ADD CONSTRAINT "events_photo_id_event_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."event_photos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_event_photos_fk" FOREIGN KEY ("event_photos_id") REFERENCES "public"."event_photos"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "events_photo_idx" ON "events" USING btree ("photo_id");
  CREATE INDEX "payload_locked_documents_rels_event_photos_id_idx" ON "payload_locked_documents_rels" USING btree ("event_photos_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "event_photos" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "event_photos" CASCADE;
  ALTER TABLE "events" DROP CONSTRAINT "events_photo_id_event_photos_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_event_photos_fk";
  
  DROP INDEX "events_photo_idx";
  DROP INDEX "payload_locked_documents_rels_event_photos_id_idx";
  ALTER TABLE "events" DROP COLUMN "photo_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "event_photos_id";`)
}
