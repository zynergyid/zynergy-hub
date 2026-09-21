import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_accounts_login_method" AS ENUM('password', 'google', 'github', 'apple', 'facebook', 'otp', 'lainnya');
  CREATE TABLE "accounts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  ALTER TABLE "accounts" DROP CONSTRAINT "accounts_holder_id_users_id_fk";
  
  DROP INDEX "accounts_holder_idx";
  ALTER TABLE "accounts" ADD COLUMN "login_method" "enum_accounts_login_method" DEFAULT 'password' NOT NULL;
  ALTER TABLE "accounts" ADD COLUMN "via_account_id" integer;
  ALTER TABLE "accounts_rels" ADD CONSTRAINT "accounts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "accounts_rels" ADD CONSTRAINT "accounts_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "accounts_rels_order_idx" ON "accounts_rels" USING btree ("order");
  CREATE INDEX "accounts_rels_parent_idx" ON "accounts_rels" USING btree ("parent_id");
  CREATE INDEX "accounts_rels_path_idx" ON "accounts_rels" USING btree ("path");
  CREATE INDEX "accounts_rels_users_id_idx" ON "accounts_rels" USING btree ("users_id");
  ALTER TABLE "accounts" ADD CONSTRAINT "accounts_via_account_id_accounts_id_fk" FOREIGN KEY ("via_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "accounts_via_account_idx" ON "accounts" USING btree ("via_account_id");
  INSERT INTO "accounts_rels" ("order", "parent_id", "path", "users_id") SELECT 1, "id", 'holders', "holder_id" FROM "accounts" WHERE "holder_id" IS NOT NULL;
  ALTER TABLE "accounts" DROP COLUMN "holder_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "accounts_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "accounts_rels" CASCADE;
  ALTER TABLE "accounts" DROP CONSTRAINT "accounts_via_account_id_accounts_id_fk";
  
  DROP INDEX "accounts_via_account_idx";
  ALTER TABLE "accounts" ADD COLUMN "holder_id" integer;
  ALTER TABLE "accounts" ADD CONSTRAINT "accounts_holder_id_users_id_fk" FOREIGN KEY ("holder_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "accounts_holder_idx" ON "accounts" USING btree ("holder_id");
  ALTER TABLE "accounts" DROP COLUMN "login_method";
  ALTER TABLE "accounts" DROP COLUMN "via_account_id";
  DROP TYPE "public"."enum_accounts_login_method";`)
}
