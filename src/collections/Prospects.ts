import type { CollectionConfig } from "payload";
import { clientCreate, clientRead, clientWrite, enforceUnit } from "@/lib/access";
import { outreachChannels, outreachLogTypes, prospectSectors, prospectSources, prospectStatuses, units } from "@/lib/options";

/**
 * Outreach targets (Supply). One row per company: who they are, what the
 * research found, the draft message, and what happened after it was sent by
 * hand. No money here, so anyone in the unit may work on them; the viewer
 * reads only. AI research and drafts are written by the /outreach skill
 * (Claude Code on Danish's seat) through the REST API with an API key.
 */
export const Prospects: CollectionConfig = {
  slug: "prospects",
  labels: { singular: "Target", plural: "Target" },
  admin: { useAsTitle: "company", group: "Operasional" },
  access: {
    read: clientRead,
    create: clientCreate,
    update: clientWrite,
    delete: clientWrite,
  },
  hooks: { beforeChange: [enforceUnit] },
  defaultSort: "-updatedAt",
  fields: [
    { name: "unit", type: "select", required: true, defaultValue: "supply", label: "Unit bisnis", options: [...units] },
    { name: "company", type: "text", required: true, label: "Perusahaan" },
    {
      type: "row",
      fields: [
        { name: "sector", type: "select", label: "Sektor", options: [...prospectSectors] },
        { name: "city", type: "text", label: "Kota / lokasi" },
        { name: "source", type: "select", label: "Sumber", options: [...prospectSources] },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "website", type: "text", label: "Website" },
        { name: "linkedin", type: "text", label: "LinkedIn perusahaan" },
      ],
    },
    {
      name: "contacts",
      type: "array",
      label: "Kontak",
      fields: [
        {
          type: "row",
          fields: [
            { name: "name", type: "text", required: true, label: "Nama" },
            { name: "role", type: "text", label: "Jabatan" },
          ],
        },
        {
          type: "row",
          fields: [
            { name: "email", type: "email", label: "Email" },
            { name: "phone", type: "text", label: "WhatsApp / telepon" },
            { name: "linkedin", type: "text", label: "LinkedIn" },
          ],
        },
      ],
    },
    {
      name: "history",
      type: "textarea",
      label: "Riwayat hubungan",
      admin: { description: "Kapan terakhir kontak, dengan siapa, apa yang dipasok atau dibahas, hasilnya. Dipakai skill /outreach agar pesan membuka dengan pengingat yang spesifik." },
    },
    { name: "status", type: "select", required: true, defaultValue: "baru", options: [...prospectStatuses] },
    { name: "owner", type: "relationship", relationTo: "users", label: "Penanggung jawab" },
    { name: "research", type: "textarea", label: "Hasil riset" },
    { name: "researchedAt", type: "date", label: "Riset pada" },
    {
      type: "row",
      fields: [
        { name: "draftSubject", type: "text", label: "Subjek" },
        { name: "draftChannel", type: "select", label: "Kanal draf", options: [...outreachChannels] },
      ],
    },
    { name: "draft", type: "textarea", label: "Draf pesan" },
    {
      type: "row",
      fields: [
        { name: "lastSentAt", type: "date", label: "Terakhir dikirim" },
        { name: "sentChannel", type: "select", label: "Kanal kirim", options: [...outreachChannels] },
        { name: "nextFollowUpAt", type: "date", label: "Tindak lanjut berikutnya" },
        { name: "followUpCount", type: "number", defaultValue: 0, min: 0, label: "Jumlah tindak lanjut" },
      ],
    },
    { name: "repliedAt", type: "date", label: "Dibalas pada" },
    { name: "client", type: "relationship", relationTo: "clients", label: "Klien (setelah jadi)" },
    {
      name: "log",
      type: "array",
      label: "Riwayat",
      fields: [
        {
          type: "row",
          fields: [
            { name: "date", type: "date", required: true, label: "Tanggal" },
            { name: "type", type: "select", required: true, defaultValue: "catatan", label: "Jenis", options: [...outreachLogTypes] },
          ],
        },
        { name: "note", type: "textarea", label: "Catatan" },
      ],
    },
    { name: "notes", type: "textarea", label: "Catatan internal" },
  ],
};
