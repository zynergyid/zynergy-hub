import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_clients_kind" AS ENUM('usaha', 'perorangan');
  ALTER TABLE "clients" ADD COLUMN "kind" "enum_clients_kind" DEFAULT 'usaha' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "clients" DROP COLUMN "kind";
  DROP TYPE "public"."enum_clients_kind";`)
}
