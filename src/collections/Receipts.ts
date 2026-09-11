import type { CollectionConfig } from "payload";
import { isFinance } from "@/lib/access";

/** Transfer proofs and invoices attached to transactions. Finance and admin only. */
export const Receipts: CollectionConfig = {
  slug: "receipts",
  labels: { singular: "Bukti", plural: "Bukti" },
  admin: { group: "Keuangan" },
  access: {
    read: isFinance,
    create: isFinance,
    update: isFinance,
    delete: isFinance,
  },
  upload: {
    mimeTypes: ["image/*", "application/pdf"],
  },
  fields: [],
};
