import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "seo_audits" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"path" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"fetched_at" timestamp(3) with time zone NOT NULL,
  	"status_code" numeric,
  	"ttfb_ms" numeric,
  	"html_bytes" numeric,
  	"title" varchar,
  	"description" varchar,
  	"passed" numeric,
  	"total" numeric,
  	"checks" jsonb,
  	"error" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "seo_audits_id" integer;
  CREATE UNIQUE INDEX "seo_audits_path_idx" ON "seo_audits" USING btree ("path");
  CREATE INDEX "seo_audits_updated_at_idx" ON "seo_audits" USING btree ("updated_at");
  CREATE INDEX "seo_audits_created_at_idx" ON "seo_audits" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_seo_audits_fk" FOREIGN KEY ("seo_audits_id") REFERENCES "public"."seo_audits"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_seo_audits_id_idx" ON "payload_locked_documents_rels" USING btree ("seo_audits_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "seo_audits" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "seo_audits" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_seo_audits_fk";
  
  DROP INDEX "payload_locked_documents_rels_seo_audits_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "seo_audits_id";`)
}
