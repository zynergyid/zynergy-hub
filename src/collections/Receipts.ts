import type { CollectionConfig } from "payload";
import { createWith, enforceUnit, moneyRead, writeWith } from "@/lib/access";
import { units } from "@/lib/options";

/** Transfer proofs and invoices attached to transactions. Finance and admin only. */
export const Receipts: CollectionConfig = {
  slug: "receipts",
  labels: { singular: "Bukti", plural: "Bukti" },
  admin: { group: "Keuangan" },
  access: {
    read: moneyRead,
    create: createWith("editMoney"),
    update: writeWith("editMoney"),
    delete: writeWith("editMoney"),
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
