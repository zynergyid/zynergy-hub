import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "vault_documents" ADD COLUMN "thumbnail_id" integer;
  ALTER TABLE "vault_documents" ADD CONSTRAINT "vault_documents_thumbnail_id_vault_files_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."vault_files"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "vault_documents_thumbnail_idx" ON "vault_documents" USING btree ("thumbnail_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "vault_documents" DROP CONSTRAINT "vault_documents_thumbnail_id_vault_files_id_fk";
  
  DROP INDEX "vault_documents_thumbnail_idx";
  ALTER TABLE "vault_documents" DROP COLUMN "thumbnail_id";`)
}
