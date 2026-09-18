import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_projects_log_type" AS ENUM('catatan', 'keputusan', 'perubahan', 'klien', 'tahap', 'status');
  CREATE TYPE "public"."enum_projects_documents_kind" AS ENUM('brief', 'scope', 'invoice', 'serah-terima', 'lainnya');
  CREATE TYPE "public"."enum_projects_unit" AS ENUM('digital', 'apps', 'supply');
  CREATE TYPE "public"."enum_projects_stage" AS ENUM('discovery', 'scope', 'kickoff', 'desain', 'build', 'review', 'launch', 'selesai', 'batal');
  CREATE TYPE "public"."enum_projects_health" AS ENUM('lancar', 'berisiko', 'terhambat');
  CREATE TABLE "projects_deliverables" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"done" boolean DEFAULT false,
  	"done_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "projects_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"type" "enum_projects_log_type" DEFAULT 'catatan' NOT NULL,
  	"note" varchar
  );
  
  CREATE TABLE "projects_documents" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_projects_documents_kind" DEFAULT 'scope' NOT NULL,
  	"file_id" integer NOT NULL,
  	"note" varchar
  );
  
  CREATE TABLE "projects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"unit" "enum_projects_unit" DEFAULT 'digital' NOT NULL,
  	"name" varchar NOT NULL,
  	"client_id" integer NOT NULL,
  	"stage" "enum_projects_stage" DEFAULT 'discovery' NOT NULL,
  	"health" "enum_projects_health" DEFAULT 'lancar' NOT NULL,
  	"owner_id" integer,
  	"stage_changed_at" timestamp(3) with time zone,
  	"value" numeric,
  	"dp_percent" numeric DEFAULT 50,
  	"start_date" timestamp(3) with time zone,
  	"target_date" timestamp(3) with time zone,
  	"next_action" varchar,
  	"next_action_at" timestamp(3) with time zone,
  	"blocker" varchar,
  	"links_repo" varchar,
  	"links_staging" varchar,
  	"links_live" varchar,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "transactions" ADD COLUMN "project_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "projects_id" integer;
  ALTER TABLE "projects_deliverables" ADD CONSTRAINT "projects_deliverables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_log" ADD CONSTRAINT "projects_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_documents" ADD CONSTRAINT "projects_documents_file_id_documents_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_documents" ADD CONSTRAINT "projects_documents_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "projects_deliverables_order_idx" ON "projects_deliverables" USING btree ("_order");
  CREATE INDEX "projects_deliverables_parent_id_idx" ON "projects_deliverables" USING btree ("_parent_id");
  CREATE INDEX "projects_log_order_idx" ON "projects_log" USING btree ("_order");
  CREATE INDEX "projects_log_parent_id_idx" ON "projects_log" USING btree ("_parent_id");
  CREATE INDEX "projects_documents_order_idx" ON "projects_documents" USING btree ("_order");
  CREATE INDEX "projects_documents_parent_id_idx" ON "projects_documents" USING btree ("_parent_id");
  CREATE INDEX "projects_documents_file_idx" ON "projects_documents" USING btree ("file_id");
  CREATE INDEX "projects_client_idx" ON "projects" USING btree ("client_id");
  CREATE INDEX "projects_owner_idx" ON "projects" USING btree ("owner_id");
  CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
  CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");
  ALTER TABLE "transactions" ADD CONSTRAINT "transactions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "transactions_project_idx" ON "transactions" USING btree ("project_id");
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects_deliverables" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_documents" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "projects_deliverables" CASCADE;
  DROP TABLE "projects_log" CASCADE;
  DROP TABLE "projects_documents" CASCADE;
  DROP TABLE "projects" CASCADE;
  ALTER TABLE "transactions" DROP CONSTRAINT "transactions_project_id_projects_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_projects_fk";
  
  DROP INDEX "transactions_project_idx";
  DROP INDEX "payload_locked_documents_rels_projects_id_idx";
  ALTER TABLE "transactions" DROP COLUMN "project_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "projects_id";
  DROP TYPE "public"."enum_projects_log_type";
  DROP TYPE "public"."enum_projects_documents_kind";
  DROP TYPE "public"."enum_projects_unit";
  DROP TYPE "public"."enum_projects_stage";
  DROP TYPE "public"."enum_projects_health";`)
}
