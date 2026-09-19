import type { CollectionConfig } from "payload";
import { enforceUnit, moneyFieldRead, moneyFieldWrite, orderCreate, orderDelete, orderRead, orderWrite } from "@/lib/access";
import { projectDocumentKinds, projectHealth, projectLogTypes, projectStages, units } from "@/lib/options";

/**
 * Digital and Apps projects: one row per client engagement, walked through
 * the seven agency stages. Everyone in the unit may move the stage, tick
 * deliverables, and write the log; value and DP are money fields; creating
 * and deleting stay with the money roles, the same rules as orders.
 */
const moneyHidden = { access: { read: moneyFieldRead, update: moneyFieldWrite } };
export const Projects: CollectionConfig = {
  slug: "projects",
  labels: { singular: "Proyek", plural: "Proyek" },
  admin: { useAsTitle: "name", group: "Operasional" },
  access: {
    read: orderRead,
    create: orderCreate,
    update: orderWrite,
    delete: orderDelete,
  },
  hooks: {
    beforeChange: [
      enforceUnit,
      ({ data, originalDoc, operation }) => {
        // When the stage changed, so the page can say how long the project has sat in it.
        // An action may pass its own date (a project entered into the Hub late).
        if ((operation === "create" || (data?.stage && data.stage !== originalDoc?.stage)) && !data?.stageChangedAt) {
          data.stageChangedAt = new Date().toISOString();
        }
        return data;
      },
    ],
  },
  defaultSort: "-updatedAt",
  fields: [
    { name: "unit", type: "select", required: true, defaultValue: "digital", label: "Unit bisnis", options: [...units] },
    { name: "name", type: "text", required: true, label: "Nama proyek" },
    { name: "client", type: "relationship", relationTo: "clients", required: true, label: "Klien" },
    {
      type: "row",
      fields: [
        { name: "stage", type: "select", required: true, defaultValue: "discovery", label: "Tahap", options: projectStages.map(({ label, value }) => ({ label, value })) },
        { name: "health", type: "select", required: true, defaultValue: "lancar", label: "Kesehatan", options: [...projectHealth] },
        { name: "owner", type: "relationship", relationTo: "users", label: "Penanggung jawab" },
      ],
    },
    { name: "stageChangedAt", type: "date", label: "Di tahap ini sejak" },
    {
      type: "row",
      fields: [
        { name: "value", type: "number", min: 0, label: "Nilai proyek", ...moneyHidden },
        { name: "dpPercent", type: "number", min: 0, max: 100, defaultValue: 50, label: "DP (%)", ...moneyHidden },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "startDate", type: "date", label: "Mulai" },
        { name: "targetDate", type: "date", label: "Target launch" },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "nextAction", type: "text", label: "Langkah berikutnya" },
        { name: "nextActionAt", type: "date", label: "Tenggat langkah" },
      ],
    },
    { name: "blocker", type: "text", label: "Menunggu apa", admin: { description: "Biasanya sesuatu dari klien: aset, jawaban, pembayaran." } },
    {
      // The Discovery artifact. A project cannot leave Discovery until the core of it is written.
      name: "brief",
      type: "group",
      label: "Brief",
      fields: [
        { name: "goals", type: "textarea", label: "Tujuan bisnis" },
        { name: "users", type: "textarea", label: "Pengguna" },
        { name: "currentFlow", type: "textarea", label: "Alur sekarang" },
        { name: "targetFlow", type: "textarea", label: "Alur yang diinginkan" },
        { name: "successMeasure", type: "textarea", label: "Ukuran sukses" },
        { name: "constraints", type: "textarea", label: "Batasan" },
        { name: "references", type: "textarea", label: "Referensi", admin: { description: "Aplikasi pembanding, standar atau metode, contoh laporan. Nama, tautan, satu baris pelajaran." } },
        { name: "confirmedAt", type: "date", label: "Dikonfirmasi klien pada" },
      ],
    },
    {
      name: "deliverables",
      type: "array",
      label: "Deliverable",
      fields: [
        { name: "title", type: "text", required: true, label: "Item" },
        { name: "done", type: "checkbox", defaultValue: false, label: "Selesai" },
        { name: "doneAt", type: "date", label: "Selesai pada" },
      ],
    },
    {
      name: "log",
      type: "array",
      label: "Riwayat",
      fields: [
        {
          type: "row",
          fields: [
            { name: "date", type: "date", required: true, label: "Tanggal" },
            { name: "type", type: "select", required: true, defaultValue: "catatan", label: "Jenis", options: [...projectLogTypes] },
          ],
        },
        { name: "note", type: "textarea", label: "Catatan" },
      ],
    },
    {
      name: "documents",
      type: "array",
      label: "Dokumen",
      fields: [
        { name: "kind", type: "select", required: true, defaultValue: "scope", label: "Jenis", options: [...projectDocumentKinds] },
        { name: "file", type: "upload", relationTo: "documents", required: true, label: "Berkas" },
        { name: "note", type: "text", label: "Keterangan" },
      ],
    },
    {
      name: "links",
      type: "group",
      label: "Tautan",
      fields: [
        { name: "repo", type: "text", label: "Repo" },
        { name: "staging", type: "text", label: "Staging" },
        { name: "live", type: "text", label: "Live" },
      ],
    },
    { name: "notes", type: "textarea", label: "Catatan" },
  ],
};
