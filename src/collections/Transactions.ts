import type { CollectionConfig } from "payload";
import { isFinance } from "@/lib/access";

export const transactionCategories = [
  { label: "Pembayaran klien", value: "pembayaran-klien" },
  { label: "Perpanjangan klien", value: "perpanjangan" },
  { label: "Hosting & domain", value: "hosting-domain" },
  { label: "Tools & langganan", value: "tools" },
  { label: "Iklan", value: "iklan" },
  { label: "Gaji & honor", value: "gaji-honor" },
  { label: "Operasional", value: "operasional" },
  { label: "Pajak", value: "pajak" },
  { label: "Lainnya", value: "lainnya" },
] as const;

/** Cash in and out for Zynergy Digital. Finance and admin only. */
export const Transactions: CollectionConfig = {
  slug: "transactions",
  labels: { singular: "Transaksi", plural: "Transaksi" },
  admin: {
    useAsTitle: "reference",
    defaultColumns: ["date", "type", "category", "amount", "client"],
    group: "Keuangan",
  },
  access: {
    read: isFinance,
    create: isFinance,
    update: isFinance,
    delete: isFinance,
  },
  defaultSort: "-date",
  fields: [
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
          options: [...transactionCategories],
        },
        {
          name: "method",
          type: "select",
          label: "Metode",
          options: [
            { label: "Transfer", value: "transfer" },
            { label: "QRIS", value: "qris" },
            { label: "Tunai", value: "tunai" },
          ],
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
