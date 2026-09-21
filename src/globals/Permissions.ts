import type { GlobalConfig } from "payload";
import { isAdmin } from "@/lib/access";
import { capabilities, defaultGrants, roles } from "@/lib/options";
import { auditGlobalHook } from "@/lib/audit";

/**
 * Which capabilities each role (job) has. Edited by admins on the Hak akses
 * page; read by every access rule through `lib/grants-cache.ts`. The admin
 * flag is not here on purpose: an admin always has everything.
 */
export const Permissions: GlobalConfig = {
  slug: "permissions",
  label: "Hak akses",
  access: { read: isAdmin, update: isAdmin },
  hooks: { afterChange: [auditGlobalHook("Hak akses")] },
  fields: roles.map((r) => ({
    name: r.value,
    type: "group" as const,
    label: r.label,
    fields: capabilities.map((c) => ({ name: c.key, type: "checkbox" as const, label: c.label, defaultValue: defaultGrants[r.value].includes(c.key) })),
  })),
};
