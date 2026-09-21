import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_activity_action" AS ENUM('create', 'update', 'delete', 'login', 'export');
  CREATE TYPE "public"."enum_activity_unit" AS ENUM('digital', 'apps', 'supply');
  CREATE TABLE "activity" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"actor_id" integer,
  	"actor_name" varchar NOT NULL,
  	"action" "enum_activity_action" NOT NULL,
  	"collection" varchar NOT NULL,
  	"doc_id" numeric,
  	"title" varchar NOT NULL,
  	"summary" varchar,
  	"changes" jsonb,
  	"unit" "enum_activity_unit",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp(3) with time zone;
  ALTER TABLE "users" ADD COLUMN "last_seen_at" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "activity_id" integer;
  ALTER TABLE "activity" ADD CONSTRAINT "activity_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "activity_actor_idx" ON "activity" USING btree ("actor_id");
  CREATE INDEX "activity_action_idx" ON "activity" USING btree ("action");
  CREATE INDEX "activity_collection_idx" ON "activity" USING btree ("collection");
  CREATE INDEX "activity_doc_id_idx" ON "activity" USING btree ("doc_id");
  CREATE INDEX "activity_updated_at_idx" ON "activity" USING btree ("updated_at");
  CREATE INDEX "activity_created_at_idx" ON "activity" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_activity_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_activity_id_idx" ON "payload_locked_documents_rels" USING btree ("activity_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "activity" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "activity" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_activity_fk";
  
  DROP INDEX "payload_locked_documents_rels_activity_id_idx";
  ALTER TABLE "users" DROP COLUMN "last_login_at";
  ALTER TABLE "users" DROP COLUMN "last_seen_at";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "activity_id";
  DROP TYPE "public"."enum_activity_action";
  DROP TYPE "public"."enum_activity_unit";`)
}
