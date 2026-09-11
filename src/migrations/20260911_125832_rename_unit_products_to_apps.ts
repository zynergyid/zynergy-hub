import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Zynergy Products became Zynergy Apps (2026-09-11). Postgres can rename an
// enum value in place, so existing rows keep working without a rewrite.
const enums = ['enum_clients_unit', 'enum_orders_unit', 'enum_receipts_unit', 'enum_transactions_unit', 'enum_users_units']

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const name of enums) {
    await db.execute(sql.raw(`ALTER TYPE "public"."${name}" RENAME VALUE 'products' TO 'apps';`))
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const name of enums) {
    await db.execute(sql.raw(`ALTER TYPE "public"."${name}" RENAME VALUE 'apps' TO 'products';`))
  }
}
