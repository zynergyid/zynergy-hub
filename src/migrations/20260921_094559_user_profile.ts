import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "avatars" (
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
  
  ALTER TABLE "users" ADD COLUMN "photo_id" integer;
  ALTER TABLE "users" ADD COLUMN "whatsapp" varchar;
  ALTER TABLE "users" ADD COLUMN "bio" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "avatars_id" integer;
  CREATE INDEX "avatars_updated_at_idx" ON "avatars" USING btree ("updated_at");
  CREATE INDEX "avatars_created_at_idx" ON "avatars" USING btree ("created_at");
  CREATE UNIQUE INDEX "avatars_filename_idx" ON "avatars" USING btree ("filename");
  ALTER TABLE "users" ADD CONSTRAINT "users_photo_id_avatars_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."avatars"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_avatars_fk" FOREIGN KEY ("avatars_id") REFERENCES "public"."avatars"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_photo_idx" ON "users" USING btree ("photo_id");
  CREATE INDEX "payload_locked_documents_rels_avatars_id_idx" ON "payload_locked_documents_rels" USING btree ("avatars_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "avatars" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "avatars" CASCADE;
  ALTER TABLE "users" DROP CONSTRAINT "users_photo_id_avatars_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_avatars_fk";
  
  DROP INDEX "users_photo_idx";
  DROP INDEX "payload_locked_documents_rels_avatars_id_idx";
  ALTER TABLE "users" DROP COLUMN "photo_id";
  ALTER TABLE "users" DROP COLUMN "whatsapp";
  ALTER TABLE "users" DROP COLUMN "bio";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "avatars_id";`)
}
