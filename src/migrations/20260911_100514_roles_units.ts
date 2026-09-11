import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_receipts_unit" AS ENUM('digital', 'products', 'supply');
  CREATE TYPE "public"."enum_users_units" AS ENUM('digital', 'products', 'supply');
  CREATE TYPE "public"."enum_users_title" AS ENUM('Lead', 'Developer', 'Designer', 'Marketing', 'Business', 'Finance', 'Komisaris', 'Lainnya');
  ALTER TYPE "public"."enum_clients_unit" ADD VALUE 'products' BEFORE 'supply';
  ALTER TYPE "public"."enum_transactions_unit" ADD VALUE 'products' BEFORE 'supply';
  ALTER TYPE "public"."enum_users_role" ADD VALUE 'viewer';
  CREATE TABLE "users_units" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_units",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "receipts" ADD COLUMN "unit" "enum_receipts_unit" DEFAULT 'digital' NOT NULL;
  ALTER TABLE "users" ADD COLUMN "title" "enum_users_title";
  ALTER TABLE "users_units" ADD CONSTRAINT "users_units_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_units_order_idx" ON "users_units" USING btree ("order");
  CREATE INDEX "users_units_parent_idx" ON "users_units" USING btree ("parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_units" CASCADE;
  ALTER TABLE "clients" ALTER COLUMN "unit" SET DATA TYPE text;
  ALTER TABLE "clients" ALTER COLUMN "unit" SET DEFAULT 'digital'::text;
  DROP TYPE "public"."enum_clients_unit";
  CREATE TYPE "public"."enum_clients_unit" AS ENUM('digital', 'supply');
  ALTER TABLE "clients" ALTER COLUMN "unit" SET DEFAULT 'digital'::"public"."enum_clients_unit";
  ALTER TABLE "clients" ALTER COLUMN "unit" SET DATA TYPE "public"."enum_clients_unit" USING "unit"::"public"."enum_clients_unit";
  ALTER TABLE "transactions" ALTER COLUMN "unit" SET DATA TYPE text;
  ALTER TABLE "transactions" ALTER COLUMN "unit" SET DEFAULT 'digital'::text;
  DROP TYPE "public"."enum_transactions_unit";
  CREATE TYPE "public"."enum_transactions_unit" AS ENUM('digital', 'supply');
  ALTER TABLE "transactions" ALTER COLUMN "unit" SET DEFAULT 'digital'::"public"."enum_transactions_unit";
  ALTER TABLE "transactions" ALTER COLUMN "unit" SET DATA TYPE "public"."enum_transactions_unit" USING "unit"::"public"."enum_transactions_unit";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'member'::text;
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'finance', 'member');
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'member'::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";
  ALTER TABLE "receipts" DROP COLUMN "unit";
  ALTER TABLE "users" DROP COLUMN "title";
  DROP TYPE "public"."enum_receipts_unit";
  DROP TYPE "public"."enum_users_units";
  DROP TYPE "public"."enum_users_title";`)
}
