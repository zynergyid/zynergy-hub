import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_prospects_log_type" AS ENUM('riset', 'draf', 'kirim', 'tindak-lanjut', 'balasan', 'catatan', 'status');
  CREATE TYPE "public"."enum_prospects_unit" AS ENUM('digital', 'apps', 'supply');
  CREATE TYPE "public"."enum_prospects_sector" AS ENUM('tambang', 'migas', 'epc', 'manufaktur', 'distributor', 'lainnya');
  CREATE TYPE "public"."enum_prospects_source" AS ENUM('klien-lama', 'referensi', 'riset', 'asosiasi', 'linkedin', 'lainnya');
  CREATE TYPE "public"."enum_prospects_status" AS ENUM('baru', 'riset', 'draf', 'terkirim', 'dibalas', 'pertemuan', 'klien', 'berhenti');
  CREATE TYPE "public"."enum_prospects_draft_channel" AS ENUM('email', 'whatsapp', 'linkedin', 'telepon', 'pertemuan');
  CREATE TYPE "public"."enum_prospects_sent_channel" AS ENUM('email', 'whatsapp', 'linkedin', 'telepon', 'pertemuan');
  CREATE TABLE "prospects_contacts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" varchar,
  	"email" varchar,
  	"phone" varchar,
  	"linkedin" varchar
  );
  
  CREATE TABLE "prospects_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"type" "enum_prospects_log_type" DEFAULT 'catatan' NOT NULL,
  	"note" varchar
  );
  
  CREATE TABLE "prospects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"unit" "enum_prospects_unit" DEFAULT 'supply' NOT NULL,
  	"company" varchar NOT NULL,
  	"sector" "enum_prospects_sector",
  	"city" varchar,
  	"source" "enum_prospects_source",
  	"website" varchar,
  	"linkedin" varchar,
  	"status" "enum_prospects_status" DEFAULT 'baru' NOT NULL,
  	"owner_id" integer,
  	"research" varchar,
  	"researched_at" timestamp(3) with time zone,
  	"draft_subject" varchar,
  	"draft_channel" "enum_prospects_draft_channel",
  	"draft" varchar,
  	"last_sent_at" timestamp(3) with time zone,
  	"sent_channel" "enum_prospects_sent_channel",
  	"next_follow_up_at" timestamp(3) with time zone,
  	"follow_up_count" numeric DEFAULT 0,
  	"replied_at" timestamp(3) with time zone,
  	"client_id" integer,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users" ADD COLUMN "enable_a_p_i_key" boolean;
  ALTER TABLE "users" ADD COLUMN "api_key" varchar;
  ALTER TABLE "users" ADD COLUMN "api_key_index" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "prospects_id" integer;
  ALTER TABLE "prospects_contacts" ADD CONSTRAINT "prospects_contacts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "prospects_log" ADD CONSTRAINT "prospects_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "prospects" ADD CONSTRAINT "prospects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "prospects" ADD CONSTRAINT "prospects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "prospects_contacts_order_idx" ON "prospects_contacts" USING btree ("_order");
  CREATE INDEX "prospects_contacts_parent_id_idx" ON "prospects_contacts" USING btree ("_parent_id");
  CREATE INDEX "prospects_log_order_idx" ON "prospects_log" USING btree ("_order");
  CREATE INDEX "prospects_log_parent_id_idx" ON "prospects_log" USING btree ("_parent_id");
  CREATE INDEX "prospects_owner_idx" ON "prospects" USING btree ("owner_id");
  CREATE INDEX "prospects_client_idx" ON "prospects" USING btree ("client_id");
  CREATE INDEX "prospects_updated_at_idx" ON "prospects" USING btree ("updated_at");
  CREATE INDEX "prospects_created_at_idx" ON "prospects" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_prospects_fk" FOREIGN KEY ("prospects_id") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_prospects_id_idx" ON "payload_locked_documents_rels" USING btree ("prospects_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "prospects_contacts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "prospects_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "prospects" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "prospects_contacts" CASCADE;
  DROP TABLE "prospects_log" CASCADE;
  DROP TABLE "prospects" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_prospects_fk";
  
  DROP INDEX "payload_locked_documents_rels_prospects_id_idx";
  ALTER TABLE "users" DROP COLUMN "enable_a_p_i_key";
  ALTER TABLE "users" DROP COLUMN "api_key";
  ALTER TABLE "users" DROP COLUMN "api_key_index";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "prospects_id";
  DROP TYPE "public"."enum_prospects_log_type";
  DROP TYPE "public"."enum_prospects_unit";
  DROP TYPE "public"."enum_prospects_sector";
  DROP TYPE "public"."enum_prospects_source";
  DROP TYPE "public"."enum_prospects_status";
  DROP TYPE "public"."enum_prospects_draft_channel";
  DROP TYPE "public"."enum_prospects_sent_channel";`)
}
