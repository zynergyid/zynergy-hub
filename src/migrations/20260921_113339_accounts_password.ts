import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_accounts_visibility" AS ENUM('tim', 'rahasia');
  ALTER TYPE "public"."enum_activity_action" ADD VALUE 'view';
  ALTER TABLE "accounts" ADD COLUMN "visibility" "enum_accounts_visibility" DEFAULT 'tim' NOT NULL;
  ALTER TABLE "accounts" ADD COLUMN "password_enc" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "activity" ALTER COLUMN "action" SET DATA TYPE text;
  DROP TYPE "public"."enum_activity_action";
  CREATE TYPE "public"."enum_activity_action" AS ENUM('create', 'update', 'delete', 'login', 'export');
  ALTER TABLE "activity" ALTER COLUMN "action" SET DATA TYPE "public"."enum_activity_action" USING "action"::"public"."enum_activity_action";
  ALTER TABLE "accounts" DROP COLUMN "visibility";
  ALTER TABLE "accounts" DROP COLUMN "password_enc";
  DROP TYPE "public"."enum_accounts_visibility";`)
}
