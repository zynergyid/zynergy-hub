import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_projects_documents_kind" ADD VALUE 'presentasi' BEFORE 'scope';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects_documents" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "projects_documents" ALTER COLUMN "kind" SET DEFAULT 'scope'::text;
  DROP TYPE "public"."enum_projects_documents_kind";
  CREATE TYPE "public"."enum_projects_documents_kind" AS ENUM('brief', 'scope', 'invoice', 'serah-terima', 'lainnya');
  ALTER TABLE "projects_documents" ALTER COLUMN "kind" SET DEFAULT 'scope'::"public"."enum_projects_documents_kind";
  ALTER TABLE "projects_documents" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_projects_documents_kind" USING "kind"::"public"."enum_projects_documents_kind";`)
}
