import type { CollectionConfig } from "payload";
import { clientCreate, clientRead, clientWrite, enforceUnit } from "@/lib/access";
import { units } from "@/lib/options";

/** Files that belong to orders: buyer PO, invoice, delivery note. Visible to everyone in the unit. */
export const Documents: CollectionConfig = {
  slug: "documents",
  labels: { singular: "Dokumen", plural: "Dokumen" },
  admin: { group: "Operasional" },
  access: {
    read: clientRead,
    create: clientCreate,
    update: clientWrite,
    delete: clientWrite,
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
      defaultValue: "supply",
      label: "Unit bisnis",
      options: [...units],
    },
  ],
};
