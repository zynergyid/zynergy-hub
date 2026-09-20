import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ALTER COLUMN "title" SET DATA TYPE text;
  -- Existing titles move to their English spelling before the enum is rebuilt.
  UPDATE "users" SET "title" = 'Staff' WHERE "title" = 'Staf';
  UPDATE "users" SET "title" = 'Commissioner' WHERE "title" = 'Komisaris';
  UPDATE "users" SET "title" = 'Other' WHERE "title" = 'Lainnya';
  DROP TYPE "public"."enum_users_title";
  CREATE TYPE "public"."enum_users_title" AS ENUM('Lead', 'Developer', 'Designer', 'Marketing', 'Business', 'Staff', 'Finance', 'Commissioner', 'Other');
  ALTER TABLE "users" ALTER COLUMN "title" SET DATA TYPE "public"."enum_users_title" USING "title"::"public"."enum_users_title";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ALTER COLUMN "title" SET DATA TYPE text;
  UPDATE "users" SET "title" = 'Staf' WHERE "title" = 'Staff';
  UPDATE "users" SET "title" = 'Komisaris' WHERE "title" = 'Commissioner';
  UPDATE "users" SET "title" = 'Lainnya' WHERE "title" = 'Other';
  DROP TYPE "public"."enum_users_title";
  CREATE TYPE "public"."enum_users_title" AS ENUM('Lead', 'Developer', 'Designer', 'Marketing', 'Business', 'Staf', 'Finance', 'Komisaris', 'Lainnya');
  ALTER TABLE "users" ALTER COLUMN "title" SET DATA TYPE "public"."enum_users_title" USING "title"::"public"."enum_users_title";`)
}
