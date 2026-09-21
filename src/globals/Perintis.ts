import type { GlobalConfig } from "payload";
import { createWith, isLoggedIn } from "@/lib/access";
import { REFLECTIONS, REPORT_INDICATORS, STAGES } from "@/content/perintis";
import { auditGlobalHook } from "@/lib/audit";

const reportStages = STAGES.filter((s) => s.months);

/** The team's own PERINTIS data: business name, group number (the mentor per session follows from it), and one report per stage (targets, reflections). */
export const Perintis: GlobalConfig = {
  slug: "perintis",
  label: "PERINTIS 2026",
  access: { read: isLoggedIn, update: createWith("team") },
  hooks: { afterChange: [auditGlobalHook("PERINTIS 2026")] },
  fields: [
    {
      type: "row",
      fields: [
        { name: "teamName", type: "text", defaultValue: "Zynergy", label: "Nama kelompok" },
        { name: "businessName", type: "text", label: "Nama usaha" },
        { name: "groupNumber", type: "number", min: 1, max: 9, label: "Nomor kelompok" },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "leader", type: "text", defaultValue: "Danish", label: "Ketua kelompok" },
        { name: "unit", type: "select", label: "Unit yang dihitung sebagai usaha kelompok", options: [{ label: "Digitalin", value: "digital" }, { label: "Apps", value: "apps" }, { label: "Supply", value: "supply" }, { label: "Semua", value: "semua" }], defaultValue: "digital" },
      ],
    },
    {
      name: "reports",
      type: "group",
      label: "Laporan progress",
      fields: reportStages.map((s) => ({
        name: s.key,
        type: "group" as const,
        label: s.name,
        fields: [
          {
            name: "targets",
            type: "group" as const,
            label: "Target awal",
            fields: REPORT_INDICATORS.map((i) => ({ name: i.key, type: "number" as const, min: 0, label: i.label })),
          },
          {
            name: "actualOverride",
            type: "group" as const,
            label: "Realisasi (kosongkan untuk memakai Arus Kas)",
            fields: REPORT_INDICATORS.map((i) => ({ name: i.key, type: "number" as const, min: 0, label: i.label })),
          },
          ...REFLECTIONS.map((r) => ({ name: r.key, type: "textarea" as const, label: r.label })),
          { name: "submittedAt", type: "date" as const, label: "Dikirim ke panitia pada" },
        ],
      })),
    },
  ],
};
