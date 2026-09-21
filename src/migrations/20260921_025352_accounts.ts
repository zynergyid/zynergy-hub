import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_accounts_platform" AS ENUM('whatsapp', 'google-business', 'instagram', 'threads', 'linkedin', 'github', 'facebook', 'youtube', 'tiktok', 'x', 'email', 'domain', 'hosting', 'lainnya');
  CREATE TYPE "public"."enum_accounts_status" AS ENUM('belum', 'aktif', 'ditinggalkan');
  CREATE TABLE "accounts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"platform" "enum_accounts_platform" DEFAULT 'lainnya' NOT NULL,
  	"status" "enum_accounts_status" DEFAULT 'belum' NOT NULL,
  	"name" varchar NOT NULL,
  	"url" varchar,
  	"holder_id" integer,
  	"login_email" varchar,
  	"phone" varchar,
  	"two_factor" varchar,
  	"password_where" varchar,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "accounts_id" integer;
  ALTER TABLE "accounts" ADD CONSTRAINT "accounts_holder_id_users_id_fk" FOREIGN KEY ("holder_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "accounts_holder_idx" ON "accounts" USING btree ("holder_id");
  CREATE INDEX "accounts_updated_at_idx" ON "accounts" USING btree ("updated_at");
  CREATE INDEX "accounts_created_at_idx" ON "accounts" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_accounts_fk" FOREIGN KEY ("accounts_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_accounts_id_idx" ON "payload_locked_documents_rels" USING btree ("accounts_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "accounts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "accounts" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_accounts_fk";
  
  DROP INDEX "payload_locked_documents_rels_accounts_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "accounts_id";
  DROP TYPE "public"."enum_accounts_platform";
  DROP TYPE "public"."enum_accounts_status";`)
}
