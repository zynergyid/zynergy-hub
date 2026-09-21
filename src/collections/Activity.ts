import type { CollectionConfig } from "payload";
import { isAdmin, activityRead } from "@/lib/access";
import { units } from "@/lib/options";

/**
 * The audit trail: who did what, when, to which record, and which fields
 * moved. Written only by hooks and routes through the Local API; nobody edits
 * or removes rows from the app. Admins may delete for housekeeping.
 */
export const Activity: CollectionConfig = {
  slug: "activity",
  labels: { singular: "Aktivitas", plural: "Aktivitas" },
  admin: { group: "Tim" },
  access: {
    read: activityRead,
    create: () => false,
    update: () => false,
    delete: isAdmin,
  },
  defaultSort: "-createdAt",
  fields: [
    { name: "actor", type: "relationship", relationTo: "users", label: "Oleh", index: true },
    { name: "actorName", type: "text", required: true, label: "Nama pelaku", admin: { description: "Disimpan terpisah supaya tetap terbaca setelah akun dihapus." } },
    {
      name: "action",
      type: "select",
      required: true,
      label: "Tindakan",
      options: [
        { label: "Membuat", value: "create" },
        { label: "Mengubah", value: "update" },
        { label: "Menghapus", value: "delete" },
        { label: "Masuk", value: "login" },
        { label: "Mengunduh", value: "export" },
      ],
      index: true,
    },
    { name: "collection", type: "text", required: true, label: "Bagian", index: true },
    { name: "docId", type: "number", label: "ID data", index: true },
    { name: "title", type: "text", required: true, label: "Data" },
    { name: "summary", type: "text", label: "Ringkasan" },
    { name: "changes", type: "json", label: "Perubahan" },
    { name: "unit", type: "select", label: "Unit", options: [...units] },
  ],
};
