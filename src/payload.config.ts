import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import sharp from "sharp";
import { MAX_UPLOAD_BYTES } from "@/lib/limits";
import { AiUsage } from "@/collections/AiUsage";
import { Clients } from "@/collections/Clients";
import { Documents } from "@/collections/Documents";
import { Orders } from "@/collections/Orders";
import { Projects } from "@/collections/Projects";
import { Prospects } from "@/collections/Prospects";
import { Receipts } from "@/collections/Receipts";
import { SeoAudits } from "@/collections/SeoAudits";
import { Transactions } from "@/collections/Transactions";
import { Users } from "@/collections/Users";
import { VaultDocuments, VaultFiles } from "@/collections/Vault";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  admin: {
    user: Users.slug,
    // The team uses the custom screens; the Payload panel is not served at all.
    disable: true,
  },
  collections: [Clients, Orders, Projects, Documents, Transactions, Receipts, Prospects, VaultDocuments, VaultFiles, AiUsage, SeoAudits, Users],
  secret: process.env.PAYLOAD_SECRET || "",
  db: postgresAdapter({
    pool: {
      // DATABASE_URL/POSTGRES_URL come from the Neon integration on Vercel.
      connectionString:
        process.env.DATABASE_URI || process.env.DATABASE_URL || process.env.POSTGRES_URL,
    },
  }),
  sharp,
  upload: { limits: { fileSize: MAX_UPLOAD_BYTES } },
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  plugins: [
    // Registered unconditionally so its admin components land in the importMap.
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: { receipts: true, documents: true, "vault-files": true },
      // Files are served through Payload's access-checked route, never by the
      // blob URL; the random suffix keeps that URL unguessable anyway.
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN || "",
    }),
  ],
});
