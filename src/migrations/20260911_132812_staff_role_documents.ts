import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_documents_unit" AS ENUM('digital', 'apps', 'supply');
  ALTER TYPE "public"."enum_users_role" ADD VALUE 'staff' BEFORE 'member';
  ALTER TYPE "public"."enum_users_title" ADD VALUE 'Staf' BEFORE 'Finance';
  CREATE TABLE "documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"unit" "enum_documents_unit" DEFAULT 'supply' NOT NULL,
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
  
  ALTER TABLE "orders_documents" DROP CONSTRAINT "orders_documents_file_id_receipts_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "documents_id" integer;
  CREATE INDEX "documents_updated_at_idx" ON "documents" USING btree ("updated_at");
  CREATE INDEX "documents_created_at_idx" ON "documents" USING btree ("created_at");
  CREATE UNIQUE INDEX "documents_filename_idx" ON "documents" USING btree ("filename");
  ALTER TABLE "orders_documents" ADD CONSTRAINT "orders_documents_file_id_documents_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_documents_fk" FOREIGN KEY ("documents_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_documents_id_idx" ON "payload_locked_documents_rels" USING btree ("documents_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "documents" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "documents" CASCADE;
  ALTER TABLE "orders_documents" DROP CONSTRAINT "orders_documents_file_id_documents_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_documents_fk";
  
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'member'::text;
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'finance', 'member', 'viewer');
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'member'::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "title" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_title";
  CREATE TYPE "public"."enum_users_title" AS ENUM('Lead', 'Developer', 'Designer', 'Marketing', 'Business', 'Finance', 'Komisaris', 'Lainnya');
  ALTER TABLE "users" ALTER COLUMN "title" SET DATA TYPE "public"."enum_users_title" USING "title"::"public"."enum_users_title";
  DROP INDEX "payload_locked_documents_rels_documents_id_idx";
  ALTER TABLE "orders_documents" ADD CONSTRAINT "orders_documents_file_id_receipts_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."receipts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "documents_id";
  DROP TYPE "public"."enum_documents_unit";`)
}
