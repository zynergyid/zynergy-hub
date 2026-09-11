import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_ai_usage_feature" AS ENUM('po-import');
  CREATE TYPE "public"."enum_ai_usage_unit" AS ENUM('digital', 'apps', 'supply');
  CREATE TABLE "ai_usage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"feature" "enum_ai_usage_feature" NOT NULL,
  	"model" varchar NOT NULL,
  	"unit" "enum_ai_usage_unit" NOT NULL,
  	"input_tokens" numeric NOT NULL,
  	"output_tokens" numeric NOT NULL,
  	"cost_usd" numeric NOT NULL,
  	"user_id" integer,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ai_usage_id" integer;
  ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "ai_usage_user_idx" ON "ai_usage" USING btree ("user_id");
  CREATE INDEX "ai_usage_updated_at_idx" ON "ai_usage" USING btree ("updated_at");
  CREATE INDEX "ai_usage_created_at_idx" ON "ai_usage" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ai_usage_fk" FOREIGN KEY ("ai_usage_id") REFERENCES "public"."ai_usage"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_ai_usage_id_idx" ON "payload_locked_documents_rels" USING btree ("ai_usage_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "ai_usage" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "ai_usage" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ai_usage_fk";
  
  DROP INDEX "payload_locked_documents_rels_ai_usage_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ai_usage_id";
  DROP TYPE "public"."enum_ai_usage_feature";
  DROP TYPE "public"."enum_ai_usage_unit";`)
}
