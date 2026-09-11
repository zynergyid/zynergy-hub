import type { CollectionConfig } from "payload";
import { clientCreate, clientRead, clientWrite, enforceUnit, isAdmin } from "@/lib/access";
import { businessTypes, clientStatuses, packages, units } from "@/lib/options";

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
    read: clientRead,
    create: clientCreate,
    update: clientWrite,
    delete: isAdmin,
  },
  defaultSort: "renewalDate",
  hooks: {
    beforeChange: [
      enforceUnit,
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
      options: [...businessTypes],
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
