import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_perintis_unit" AS ENUM('digital', 'apps', 'supply', 'semua');
  CREATE TABLE "perintis" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"team_name" varchar DEFAULT 'Zynergy',
  	"business_name" varchar,
  	"group_number" numeric,
  	"leader" varchar DEFAULT 'Danish',
  	"unit" "enum_perintis_unit" DEFAULT 'digital',
  	"reports_report1_targets_omzet" numeric,
  	"reports_report1_targets_biaya" numeric,
  	"reports_report1_targets_laba" numeric,
  	"reports_report1_targets_transaksi" numeric,
  	"reports_report1_targets_unit" numeric,
  	"reports_report1_targets_saldo" numeric,
  	"reports_report1_actual_override_omzet" numeric,
  	"reports_report1_actual_override_biaya" numeric,
  	"reports_report1_actual_override_laba" numeric,
  	"reports_report1_actual_override_transaksi" numeric,
  	"reports_report1_actual_override_unit" numeric,
  	"reports_report1_actual_override_saldo" numeric,
  	"reports_report1_good" varchar,
  	"reports_report1_problems" varchar,
  	"reports_report1_actions" varchar,
  	"reports_report1_next" varchar,
  	"reports_report1_innovation" varchar,
  	"reports_report1_submitted_at" timestamp(3) with time zone,
  	"reports_report2_targets_omzet" numeric,
  	"reports_report2_targets_biaya" numeric,
  	"reports_report2_targets_laba" numeric,
  	"reports_report2_targets_transaksi" numeric,
  	"reports_report2_targets_unit" numeric,
  	"reports_report2_targets_saldo" numeric,
  	"reports_report2_actual_override_omzet" numeric,
  	"reports_report2_actual_override_biaya" numeric,
  	"reports_report2_actual_override_laba" numeric,
  	"reports_report2_actual_override_transaksi" numeric,
  	"reports_report2_actual_override_unit" numeric,
  	"reports_report2_actual_override_saldo" numeric,
  	"reports_report2_good" varchar,
  	"reports_report2_problems" varchar,
  	"reports_report2_actions" varchar,
  	"reports_report2_next" varchar,
  	"reports_report2_innovation" varchar,
  	"reports_report2_submitted_at" timestamp(3) with time zone,
  	"reports_report3_targets_omzet" numeric,
  	"reports_report3_targets_biaya" numeric,
  	"reports_report3_targets_laba" numeric,
  	"reports_report3_targets_transaksi" numeric,
  	"reports_report3_targets_unit" numeric,
  	"reports_report3_targets_saldo" numeric,
  	"reports_report3_actual_override_omzet" numeric,
  	"reports_report3_actual_override_biaya" numeric,
  	"reports_report3_actual_override_laba" numeric,
  	"reports_report3_actual_override_transaksi" numeric,
  	"reports_report3_actual_override_unit" numeric,
  	"reports_report3_actual_override_saldo" numeric,
  	"reports_report3_good" varchar,
  	"reports_report3_problems" varchar,
  	"reports_report3_actions" varchar,
  	"reports_report3_next" varchar,
  	"reports_report3_innovation" varchar,
  	"reports_report3_submitted_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "perintis" CASCADE;
  DROP TYPE "public"."enum_perintis_unit";`)
}
