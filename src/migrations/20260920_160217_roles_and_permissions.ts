import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "permissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"pengelola_edit" boolean DEFAULT true,
  	"pengelola_money" boolean DEFAULT true,
  	"pengelola_team" boolean DEFAULT true,
  	"pengelola_all_units" boolean DEFAULT false,
  	"pengelola_seo" boolean DEFAULT false,
  	"member_edit" boolean DEFAULT false,
  	"member_money" boolean DEFAULT true,
  	"member_team" boolean DEFAULT true,
  	"member_all_units" boolean DEFAULT false,
  	"member_seo" boolean DEFAULT false,
  	"viewer_edit" boolean DEFAULT false,
  	"viewer_money" boolean DEFAULT true,
  	"viewer_team" boolean DEFAULT false,
  	"viewer_all_units" boolean DEFAULT true,
  	"viewer_seo" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'member'::text;
  -- Finance and Staf had identical rights; both become Pengelola before the enum is rebuilt.
  UPDATE "users" SET "role" = 'pengelola' WHERE "role" IN ('finance', 'staff');
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'pengelola', 'member', 'viewer');
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'member'::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "permissions" CASCADE;
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'member'::text;
  UPDATE "users" SET "role" = 'finance' WHERE "role" = 'pengelola';
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'finance', 'staff', 'member', 'viewer');
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'member'::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";`)
}
