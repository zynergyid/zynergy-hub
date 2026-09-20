import type { CollectionConfig, Validate } from "payload";
import { createWith, enforceUnit, isAdmin, unitRead, writeWith } from "@/lib/access";
import { businessTypes, clientKinds, clientStatuses, packages, units } from "@/lib/options";

/** Supply buyers are companies reached by email; everyone else needs a WhatsApp number. */
const whatsappRequiredOutsideSupply: Validate<string> = (value, { siblingData }) => {
  const unit = (siblingData as { unit?: string } | undefined)?.unit;
  if (unit === "supply" || (typeof value === "string" && value.trim())) return true;
  return "WhatsApp wajib diisi.";
};

/** Clients of every unit. Digital: package and renewal. Supply: legal data for POs and invoices. */
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
    read: unitRead,
    create: createWith("editClients"),
    update: writeWith("editClients"),
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
      name: "kind",
      type: "select",
      required: true,
      defaultValue: "usaha",
      label: "Bentuk klien",
      options: [...clientKinds],
      admin: { position: "sidebar" },
    },
    {
      type: "row",
      fields: [
        { name: "name", type: "text", required: true, label: "Nama" },
        { name: "owner", type: "text", label: "Pemilik / PIC" },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "whatsapp",
          type: "text",
          label: "WhatsApp",
          validate: whatsappRequiredOutsideSupply,
        },
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
    {
      name: "supply",
      type: "group",
      label: "Data resmi (Supply)",
      fields: [
        {
          type: "row",
          fields: [
            { name: "legalName", type: "text", label: "Nama badan hukum" },
            { name: "npwp", type: "text", label: "NPWP" },
          ],
        },
        {
          type: "row",
          fields: [
            { name: "vendorNumber", type: "text", label: "Nomor vendor" },
            { name: "paymentTermsDays", type: "number", min: 0, label: "Termin (hari)" },
          ],
        },
        { name: "billingAddress", type: "textarea", label: "Alamat penagihan" },
      ],
    },
    { name: "notes", type: "textarea", label: "Catatan" },
  ],
};
