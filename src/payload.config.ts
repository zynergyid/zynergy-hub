import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import sharp from "sharp";
import { Clients } from "@/collections/Clients";
import { Documents } from "@/collections/Documents";
import { Orders } from "@/collections/Orders";
import { Receipts } from "@/collections/Receipts";
import { Transactions } from "@/collections/Transactions";
import { Users } from "@/collections/Users";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  admin: {
    user: Users.slug,
    // The team uses the custom screens; the Payload panel is not served at all.
    disable: true,
  },
  collections: [Clients, Orders, Documents, Transactions, Receipts, Users],
  secret: process.env.PAYLOAD_SECRET || "",
  db: postgresAdapter({
    pool: {
      // DATABASE_URL/POSTGRES_URL come from the Neon integration on Vercel.
      connectionString:
        process.env.DATABASE_URI || process.env.DATABASE_URL || process.env.POSTGRES_URL,
    },
  }),
  sharp,
  upload: { limits: { fileSize: 8 * 1024 * 1024 } },
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  plugins: [
    // Registered unconditionally so its admin components land in the importMap.
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: { receipts: true, documents: true },
      // Files are served through Payload's access-checked route, never by the
      // blob URL; the random suffix keeps that URL unguessable anyway.
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN || "",
    }),
  ],
});
