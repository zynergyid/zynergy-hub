import type { CollectionConfig } from "payload";
import { enforceUnit, moneyCreate, moneyRead, moneyWrite } from "@/lib/access";
import { paymentMethods, transactionCategories, units } from "@/lib/options";

/** Cash in and out per unit. Admin everywhere, finance in their units, viewer read-only. */
export const Transactions: CollectionConfig = {
  slug: "transactions",
  labels: { singular: "Transaksi", plural: "Transaksi" },
  admin: {
    useAsTitle: "reference",
    defaultColumns: ["date", "type", "category", "amount", "client"],
    group: "Keuangan",
  },
  access: {
    read: moneyRead,
    create: moneyCreate,
    update: moneyWrite,
    delete: moneyWrite,
  },
  hooks: { beforeChange: [enforceUnit] },
  defaultSort: "-date",
  fields: [
    {
      name: "unit",
      type: "select",
      required: true,
      defaultValue: "digital",
      label: "Unit bisnis",
      options: [...units],
      admin: { position: "sidebar" },
    },
    {
      type: "row",
      fields: [
        {
          name: "date",
          type: "date",
          required: true,
          label: "Tanggal",
          defaultValue: () => new Date().toISOString(),
          admin: { date: { pickerAppearance: "dayOnly" } },
        },
        {
          name: "type",
          type: "select",
          required: true,
          label: "Jenis",
          options: [
            { label: "Masuk", value: "masuk" },
            { label: "Keluar", value: "keluar" },
          ],
        },
        {
          name: "amount",
          type: "number",
          required: true,
          min: 0,
          label: "Nominal (Rp)",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "category",
          type: "select",
          required: true,
          label: "Kategori",
          options: transactionCategories.map(({ label, value }) => ({ label, value })),
        },
        {
          name: "method",
          type: "select",
          label: "Metode",
          options: [...paymentMethods],
        },
      ],
    },
    { name: "client", type: "relationship", relationTo: "clients", label: "Klien" },
    {
      name: "reference",
      type: "text",
      label: "Nomor invoice / referensi",
      admin: { description: "Nomor invoice, nomor referensi transfer, atau keterangan singkat." },
    },
    { name: "receipt", type: "upload", relationTo: "receipts", label: "Bukti" },
    { name: "notes", type: "textarea", label: "Catatan" },
  ],
};
