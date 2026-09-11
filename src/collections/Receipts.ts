import type { CollectionConfig } from "payload";
import { enforceUnit, moneyCreate, moneyRead, moneyWrite } from "@/lib/access";
import { units } from "@/lib/options";

/** Transfer proofs and invoices attached to transactions. Finance and admin only. */
export const Receipts: CollectionConfig = {
  slug: "receipts",
  labels: { singular: "Bukti", plural: "Bukti" },
  admin: { group: "Keuangan" },
  access: {
    read: moneyRead,
    create: moneyCreate,
    update: moneyWrite,
    delete: moneyWrite,
  },
  hooks: { beforeChange: [enforceUnit] },
  upload: {
    mimeTypes: ["image/*", "application/pdf"],
  },
  fields: [
    {
      name: "unit",
      type: "select",
      required: true,
      defaultValue: "digital",
      label: "Unit bisnis",
      options: [...units],
    },
  ],
};
