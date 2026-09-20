import type { CollectionConfig } from "payload";
import { createWith, vaultRead } from "@/lib/access";
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
    create: createWith("editVault"),
    update: createWith("editVault"),
    delete: createWith("editVault"),
  },
  defaultSort: "title",
  hooks: {
    afterDelete: [
      async ({ doc, req }) => {
        for (const ref of [doc.file, doc.thumbnail]) {
          const fileId = typeof ref === "object" && ref ? ref.id : ref;
          if (fileId) await req.payload.delete({ collection: "vault-files", id: fileId, req }).catch(() => undefined);
        }
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
      name: "thumbnail",
      type: "upload",
      relationTo: "vault-files",
      label: "Pratinjau",
      admin: { description: "PNG kecil halaman pertama, dirender di browser saat unggah." },
    },
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
    create: createWith("editVault"),
    update: createWith("editVault"),
    delete: createWith("editVault"),
  },
  upload: { mimeTypes: ["image/*", "application/pdf"] },
  fields: [{ name: "confidential", type: "checkbox", defaultValue: false, label: "Rahasia" }],
};
