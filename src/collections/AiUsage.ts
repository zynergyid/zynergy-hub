import type { CollectionConfig } from "payload";
import { isAdmin, moneyRead } from "@/lib/access";
import { aiFeatures, units } from "@/lib/options";

/** One row per AI call, so the team sees what the automation costs without opening the provider dashboard. */
export const AiUsage: CollectionConfig = {
  slug: "ai-usage",
  labels: { singular: "Pemakaian AI", plural: "Pemakaian AI" },
  admin: { group: "Operasional" },
  access: {
    read: moneyRead,
    // Rows are written by server actions through the Local API only.
    create: () => false,
    update: () => false,
    delete: isAdmin,
  },
  defaultSort: "-createdAt",
  fields: [
    { name: "feature", type: "select", required: true, options: [...aiFeatures], label: "Fitur" },
    { name: "model", type: "text", required: true, label: "Model" },
    { name: "unit", type: "select", required: true, options: [...units], label: "Unit bisnis" },
    {
      type: "row",
      fields: [
        { name: "inputTokens", type: "number", required: true, min: 0, label: "Token masuk" },
        { name: "outputTokens", type: "number", required: true, min: 0, label: "Token keluar" },
        { name: "costUsd", type: "number", required: true, min: 0, label: "Biaya (USD)" },
      ],
    },
    { name: "user", type: "relationship", relationTo: "users", label: "Oleh" },
    { name: "note", type: "text", label: "Keterangan" },
  ],
};
