import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import sharp from "sharp";
import { Clients } from "@/collections/Clients";
import { Receipts } from "@/collections/Receipts";
import { Transactions } from "@/collections/Transactions";
import { Users } from "@/collections/Users";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  admin: {
    user: Users.slug,
    components: {
      graphics: {
        Logo: "@/components/admin/Branding#Logo",
        Icon: "@/components/admin/Branding#Icon",
      },
    },
    meta: { titleSuffix: " | Zynergy Team" },
  },
  collections: [Clients, Transactions, Receipts, Users],
  editor: lexicalEditor(),
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
      collections: { receipts: true },
      token: process.env.BLOB_READ_WRITE_TOKEN || "",
    }),
  ],
});
