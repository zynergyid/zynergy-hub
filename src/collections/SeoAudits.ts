import type { CollectionConfig } from "payload";
import { isAdmin, isLoggedIn } from "@/lib/access";

/**
 * Latest technical check of one public page of zynergy.co.id, written by the
 * SEO audit (daily cron or the "Periksa sekarang" button). One row per path,
 * overwritten on every run; history is not kept on purpose.
 */
export const SeoAudits: CollectionConfig = {
  slug: "seo-audits",
  labels: { singular: "Audit SEO", plural: "Audit SEO" },
  admin: { useAsTitle: "path", group: "Situs" },
  access: {
    read: isLoggedIn,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: "path", type: "text", required: true, unique: true, label: "Path" },
    { name: "url", type: "text", required: true, label: "URL" },
    { name: "fetchedAt", type: "date", required: true, label: "Diperiksa pada" },
    { name: "statusCode", type: "number", label: "Status HTTP" },
    { name: "ttfbMs", type: "number", label: "Waktu respons (ms)" },
    { name: "htmlBytes", type: "number", label: "Ukuran HTML (byte)" },
    { name: "title", type: "text", label: "Judul yang tampil" },
    { name: "description", type: "textarea", label: "Deskripsi yang tampil" },
    { name: "passed", type: "number", label: "Lolos" },
    { name: "total", type: "number", label: "Total pemeriksaan" },
    { name: "checks", type: "json", label: "Hasil pemeriksaan" },
    { name: "error", type: "text", label: "Kesalahan" },
  ],
};
