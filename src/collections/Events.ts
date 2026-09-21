import type { CollectionConfig } from "payload";
import { createWith, isLoggedIn } from "@/lib/access";
import { contentPlatforms, contentStatuses, eventKinds } from "@/lib/options";
import { auditHooks } from "@/lib/audit";

/**
 * Calendar entries the team creates by hand: team meetings, client meetings,
 * other events, each with its agenda, notes, and follow-ups. Dates owned by
 * other modules (project targets, outreach follow-ups, PO deliveries, client
 * renewals) are never copied here; the calendar page reads them in place.
 */
const dayAndTime = { admin: { date: { pickerAppearance: "dayAndTime" as const } } };

export const Events: CollectionConfig = {
  slug: "events",
  labels: { singular: "Acara", plural: "Acara" },
  typescript: { interface: "HubEvent" },
  admin: { useAsTitle: "title", group: "Tim" },
  access: {
    read: isLoggedIn,
    create: createWith("team"),
    update: createWith("team"),
    delete: createWith("team"),
  },
  defaultSort: "-startAt",
  hooks: auditHooks({ title: (d) => String(d.title) }),
  fields: [
    { name: "title", type: "text", required: true, label: "Judul" },
    { name: "kind", type: "select", required: true, defaultValue: "rapat-tim", label: "Jenis", options: [...eventKinds] },
    {
      type: "row",
      fields: [
        { name: "startAt", type: "date", required: true, label: "Mulai", ...dayAndTime },
        { name: "endAt", type: "date", label: "Selesai", ...dayAndTime },
      ],
    },
    { name: "location", type: "text", label: "Tempat atau tautan" },
    { name: "participants", type: "relationship", relationTo: "users", hasMany: true, label: "Peserta" },
    {
      type: "row",
      fields: [
        { name: "client", type: "relationship", relationTo: "clients", label: "Klien" },
        { name: "project", type: "relationship", relationTo: "projects", label: "Proyek" },
        { name: "prospect", type: "relationship", relationTo: "prospects", label: "Target outreach" },
      ],
    },
    {
      // Only for kind "konten": where it goes, how far along it is, and the files.
      name: "content",
      type: "group",
      label: "Konten",
      admin: { condition: (data) => data?.kind === "konten" },
      fields: [
        {
          type: "row",
          fields: [
            { name: "platform", type: "select", label: "Platform", options: [...contentPlatforms] },
            { name: "status", type: "select", defaultValue: "ide", label: "Status", options: [...contentStatuses] },
          ],
        },
        { name: "designUrl", type: "text", label: "Tautan desain (Canva, Drive)" },
        { name: "postUrl", type: "text", label: "Tautan unggahan" },
      ],
    },
    { name: "photo", type: "upload", relationTo: "event-photos", label: "Foto" },
    { name: "agenda", type: "textarea", label: "Agenda pembahasan" },
    { name: "notes", type: "textarea", label: "Catatan" },
    {
      name: "followUps",
      type: "array",
      label: "Tindak lanjut",
      fields: [
        { name: "text", type: "text", required: true, label: "Apa" },
        {
          type: "row",
          fields: [
            { name: "owner", type: "relationship", relationTo: "users", label: "Siapa" },
            { name: "dueAt", type: "date", label: "Tenggat" },
            { name: "doneAt", type: "date", label: "Selesai pada" },
          ],
        },
      ],
    },
    /** Row id in the linked project's log that mirrors these notes, so a rewrite updates instead of duplicating. */
    { name: "projectLogId", type: "text", admin: { hidden: true } },
    { name: "createdBy", type: "relationship", relationTo: "users", admin: { hidden: true } },
  ],
};
