import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_orders_documents_kind" AS ENUM('po', 'invoice', 'surat-jalan', 'faktur-pajak', 'bukti-bayar', 'lainnya');
  CREATE TYPE "public"."enum_orders_unit" AS ENUM('digital', 'products', 'supply');
  CREATE TYPE "public"."enum_orders_status" AS ENUM('diterima', 'sourcing', 'dikirim', 'ditagih', 'dibayar', 'batal');
  CREATE TABLE "orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"material" varchar,
  	"part_number" varchar,
  	"description" varchar NOT NULL,
  	"qty" numeric NOT NULL,
  	"uom" varchar DEFAULT 'each',
  	"unit_price" numeric NOT NULL
  );
  
  CREATE TABLE "orders_documents" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_orders_documents_kind" DEFAULT 'po' NOT NULL,
  	"file_id" integer NOT NULL,
  	"note" varchar
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"unit" "enum_orders_unit" DEFAULT 'supply' NOT NULL,
  	"number" varchar NOT NULL,
  	"revision" numeric DEFAULT 0,
  	"client_id" integer NOT NULL,
  	"order_date" timestamp(3) with time zone NOT NULL,
  	"delivery_date" timestamp(3) with time zone,
  	"ship_to" varchar,
  	"incoterm" varchar,
  	"payment_terms_days" numeric DEFAULT 30,
  	"subtotal" numeric,
  	"status" "enum_orders_status" DEFAULT 'diterima' NOT NULL,
  	"invoice_number" varchar,
  	"invoice_date" timestamp(3) with time zone,
  	"due_date" timestamp(3) with time zone,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "clients" ALTER COLUMN "whatsapp" DROP NOT NULL;
  ALTER TABLE "clients" ADD COLUMN "supply_legal_name" varchar;
  ALTER TABLE "clients" ADD COLUMN "supply_npwp" varchar;
  ALTER TABLE "clients" ADD COLUMN "supply_vendor_number" varchar;
  ALTER TABLE "clients" ADD COLUMN "supply_payment_terms_days" numeric;
  ALTER TABLE "clients" ADD COLUMN "supply_billing_address" varchar;
  ALTER TABLE "transactions" ADD COLUMN "order_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "orders_id" integer;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_documents" ADD CONSTRAINT "orders_documents_file_id_receipts_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."receipts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_documents" ADD CONSTRAINT "orders_documents_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "orders_items_order_idx" ON "orders_items" USING btree ("_order");
  CREATE INDEX "orders_items_parent_id_idx" ON "orders_items" USING btree ("_parent_id");
  CREATE INDEX "orders_documents_order_idx" ON "orders_documents" USING btree ("_order");
  CREATE INDEX "orders_documents_parent_id_idx" ON "orders_documents" USING btree ("_parent_id");
  CREATE INDEX "orders_documents_file_idx" ON "orders_documents" USING btree ("file_id");
  CREATE INDEX "orders_client_idx" ON "orders" USING btree ("client_id");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "transactions_order_idx" ON "transactions" USING btree ("order_id");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders_documents" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "orders_items" CASCADE;
  DROP TABLE "orders_documents" CASCADE;
  DROP TABLE "orders" CASCADE;
  ALTER TABLE "transactions" DROP CONSTRAINT "transactions_order_id_orders_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_orders_fk";
  
  DROP INDEX "transactions_order_idx";
  DROP INDEX "payload_locked_documents_rels_orders_id_idx";
  ALTER TABLE "clients" ALTER COLUMN "whatsapp" SET NOT NULL;
  ALTER TABLE "clients" DROP COLUMN "supply_legal_name";
  ALTER TABLE "clients" DROP COLUMN "supply_npwp";
  ALTER TABLE "clients" DROP COLUMN "supply_vendor_number";
  ALTER TABLE "clients" DROP COLUMN "supply_payment_terms_days";
  ALTER TABLE "clients" DROP COLUMN "supply_billing_address";
  ALTER TABLE "transactions" DROP COLUMN "order_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "orders_id";
  DROP TYPE "public"."enum_orders_documents_kind";
  DROP TYPE "public"."enum_orders_unit";
  DROP TYPE "public"."enum_orders_status";`)
}
