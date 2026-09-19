import type { CollectionConfig } from "payload";
import { clientCreate, clientRead, clientWrite, enforceUnit } from "@/lib/access";
import { units } from "@/lib/options";
import { DOCUMENT_MIME_TYPES } from "@/lib/limits";

/** Files that belong to orders and projects: buyer PO, invoice, briefs, decks. Visible to everyone in the unit. */
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
    mimeTypes: [...DOCUMENT_MIME_TYPES],
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
