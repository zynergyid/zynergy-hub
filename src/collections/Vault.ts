import type { CollectionConfig } from "payload";
import { vaultRead, vaultWrite } from "@/lib/access";
import { vaultCategories } from "@/lib/options";

/**
 * Company documents (PT-level, not per unit): deeds, licences, tax, certificates,
 * profiles, references. One row per document with its file, number, and expiry.
 * The file lives in `vault-files`, which mirrors the confidential flag so the
 * file endpoint enforces the same rule.
 */
export const VaultDocuments: CollectionConfig = {
  slug: "vault-documents",
  labels: { singular: "Dokumen perusahaan", plural: "Dokumen perusahaan" },
  admin: { useAsTitle: "title", group: "Operasional" },
  access: {
    read: vaultRead,
    create: vaultWrite,
    update: vaultWrite,
    delete: vaultWrite,
  },
  defaultSort: "title",
  hooks: {
    afterDelete: [
      async ({ doc, req }) => {
        const fileId = typeof doc.file === "object" && doc.file ? doc.file.id : doc.file;
        if (fileId) await req.payload.delete({ collection: "vault-files", id: fileId, req }).catch(() => undefined);
      },
    ],
  },
  fields: [
    { name: "title", type: "text", required: true, label: "Nama dokumen" },
    { name: "category", type: "select", required: true, defaultValue: "lainnya", label: "Kategori", options: [...vaultCategories] },
    {
      type: "row",
      fields: [
        { name: "number", type: "text", label: "Nomor dokumen" },
        { name: "issuer", type: "text", label: "Penerbit" },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "issuedAt", type: "date", label: "Tanggal terbit" },
        { name: "expiresAt", type: "date", label: "Berlaku sampai" },
      ],
    },
    { name: "file", type: "upload", relationTo: "vault-files", required: true, label: "Berkas" },
    {
      name: "confidential",
      type: "checkbox",
      defaultValue: false,
      label: "Rahasia",
      admin: { description: "Hanya admin, finance, dan staf yang bisa melihat dan mengunduh." },
    },
    { name: "notes", type: "textarea", label: "Catatan" },
  ],
};

export const VaultFiles: CollectionConfig = {
  slug: "vault-files",
  labels: { singular: "Berkas dokumen", plural: "Berkas dokumen" },
  admin: { group: "Operasional" },
  access: {
    read: vaultRead,
    create: vaultWrite,
    update: vaultWrite,
    delete: vaultWrite,
  },
  upload: { mimeTypes: ["image/*", "application/pdf"] },
  fields: [{ name: "confidential", type: "checkbox", defaultValue: false, label: "Rahasia" }],
};
