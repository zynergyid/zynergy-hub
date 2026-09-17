import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_vault_documents_category" AS ENUM('akta', 'izin', 'pajak', 'sertifikat', 'profil', 'referensi', 'identitas', 'keuangan', 'kontrak', 'lainnya');
  CREATE TABLE "vault_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"category" "enum_vault_documents_category" DEFAULT 'lainnya' NOT NULL,
  	"number" varchar,
  	"issuer" varchar,
  	"issued_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone,
  	"file_id" integer NOT NULL,
  	"confidential" boolean DEFAULT false,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "vault_files" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"confidential" boolean DEFAULT false,
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
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "vault_documents_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "vault_files_id" integer;
  ALTER TABLE "vault_documents" ADD CONSTRAINT "vault_documents_file_id_vault_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."vault_files"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "vault_documents_file_idx" ON "vault_documents" USING btree ("file_id");
  CREATE INDEX "vault_documents_updated_at_idx" ON "vault_documents" USING btree ("updated_at");
  CREATE INDEX "vault_documents_created_at_idx" ON "vault_documents" USING btree ("created_at");
  CREATE INDEX "vault_files_updated_at_idx" ON "vault_files" USING btree ("updated_at");
  CREATE INDEX "vault_files_created_at_idx" ON "vault_files" USING btree ("created_at");
  CREATE UNIQUE INDEX "vault_files_filename_idx" ON "vault_files" USING btree ("filename");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_vault_documents_fk" FOREIGN KEY ("vault_documents_id") REFERENCES "public"."vault_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_vault_files_fk" FOREIGN KEY ("vault_files_id") REFERENCES "public"."vault_files"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_vault_documents_id_idx" ON "payload_locked_documents_rels" USING btree ("vault_documents_id");
  CREATE INDEX "payload_locked_documents_rels_vault_files_id_idx" ON "payload_locked_documents_rels" USING btree ("vault_files_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "vault_documents" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "vault_files" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "vault_documents" CASCADE;
  DROP TABLE "vault_files" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_vault_documents_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_vault_files_fk";
  
  DROP INDEX "payload_locked_documents_rels_vault_documents_id_idx";
  DROP INDEX "payload_locked_documents_rels_vault_files_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "vault_documents_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "vault_files_id";
  DROP TYPE "public"."enum_vault_documents_category";`)
}
