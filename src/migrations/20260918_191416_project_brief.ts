import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects" ADD COLUMN "brief_goals" varchar;
  ALTER TABLE "projects" ADD COLUMN "brief_users" varchar;
  ALTER TABLE "projects" ADD COLUMN "brief_current_flow" varchar;
  ALTER TABLE "projects" ADD COLUMN "brief_target_flow" varchar;
  ALTER TABLE "projects" ADD COLUMN "brief_success_measure" varchar;
  ALTER TABLE "projects" ADD COLUMN "brief_constraints" varchar;
  ALTER TABLE "projects" ADD COLUMN "brief_confirmed_at" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects" DROP COLUMN "brief_goals";
  ALTER TABLE "projects" DROP COLUMN "brief_users";
  ALTER TABLE "projects" DROP COLUMN "brief_current_flow";
  ALTER TABLE "projects" DROP COLUMN "brief_target_flow";
  ALTER TABLE "projects" DROP COLUMN "brief_success_measure";
  ALTER TABLE "projects" DROP COLUMN "brief_constraints";
  ALTER TABLE "projects" DROP COLUMN "brief_confirmed_at";`)
}
