import type { CollectionConfig } from "payload";
import { isAdmin, isLoggedIn } from "@/lib/access";

export const packages = [
  { label: "Starter", value: "starter" },
  { label: "Business", value: "business" },
  { label: "Premium", value: "premium" },
  { label: "Custom", value: "custom" },
] as const;

export const clientStatuses = [
  { label: "Prospek", value: "prospek" },
  { label: "Aktif", value: "aktif" },
  { label: "Jatuh tempo", value: "jatuh-tempo" },
  { label: "Berhenti", value: "berhenti" },
] as const;

/** Paying clients of Zynergy Digital: who they are, what they pay, when it renews. */
export const Clients: CollectionConfig = {
  slug: "clients",
  labels: { singular: "Klien", plural: "Klien" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "status", "package", "renewalDate", "city"],
    group: "Operasional",
    listSearchableFields: ["name", "owner", "city"],
  },
  access: {
    read: isLoggedIn,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isAdmin,
  },
  defaultSort: "renewalDate",
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Yearly model: renewal defaults to one year after start.
        if (data?.startDate && !data.renewalDate) {
          const renewal = new Date(data.startDate);
          renewal.setFullYear(renewal.getFullYear() + 1);
          data.renewalDate = renewal.toISOString();
        }
        return data;
      },
    ],
  },
  fields: [
    {
      type: "row",
      fields: [
        { name: "name", type: "text", required: true, label: "Nama usaha" },
        { name: "owner", type: "text", label: "Pemilik / PIC" },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "whatsapp", type: "text", required: true, label: "WhatsApp" },
        { name: "email", type: "email" },
        { name: "city", type: "text", label: "Kota / area" },
      ],
    },
    {
      name: "businessType",
      type: "select",
      label: "Jenis usaha",
      options: [
        { label: "Kuliner / warung / catering", value: "kuliner" },
        { label: "Klinik / kesehatan", value: "kesehatan" },
        { label: "Laundry / jasa lokal", value: "jasa-lokal" },
        { label: "Sekolah / lembaga", value: "sekolah" },
        { label: "Toko / produk", value: "toko" },
        { label: "Company profile / B2B", value: "b2b" },
        { label: "Lainnya", value: "lainnya" },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "package", type: "select", label: "Paket", options: [...packages] },
        {
          name: "annualFee",
          type: "number",
          label: "Biaya per tahun (Rp)",
          min: 0,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "startDate",
          type: "date",
          label: "Mulai",
          admin: { date: { pickerAppearance: "dayOnly" } },
        },
        {
          name: "renewalDate",
          type: "date",
          label: "Jatuh tempo perpanjangan",
          admin: {
            date: { pickerAppearance: "dayOnly" },
            description: "Kosongkan untuk otomatis satu tahun setelah tanggal mulai.",
          },
        },
      ],
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "aktif",
      options: [...clientStatuses],
      admin: { position: "sidebar" },
    },
    {
      name: "links",
      type: "group",
      label: "Tautan",
      fields: [
        { name: "website", type: "text", label: "Website" },
        { name: "googleProfile", type: "text", label: "Profil Google Bisnis" },
        { name: "instagram", type: "text", label: "Instagram" },
      ],
    },
    { name: "notes", type: "textarea", label: "Catatan" },
  ],
};
