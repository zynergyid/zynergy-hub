import type { CollectionConfig } from "payload";
import { hasRoleField, isAdmin, isLoggedIn } from "@/lib/access";
import { jobTitles, roles, units } from "@/lib/options";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/auth-cookie";

/** Team accounts. Role = access level, units = scope, title = descriptive only. */
export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Anggota Tim", plural: "Anggota Tim" },
  auth: {
    // Longest a token may live. The login route gives remembered devices this
    // much (renewed on use) and other devices four hours.
    tokenExpiration: SESSION_MAX_AGE_SECONDS,
    // Per-user API keys for the /outreach Claude Code skill (header: "users API-Key <key>").
    useAPIKey: true,
  },
  admin: { useAsTitle: "name" },
  access: {
    read: isLoggedIn,
    create: isAdmin,
    delete: isAdmin,
    update: ({ req }) => {
      const user = req.user as { id: number | string; role?: string } | null;
      if (!user) return false;
      if (user.role === "admin") return true;
      return { id: { equals: user.id } };
    },
  },
  fields: [
    { name: "name", type: "text", required: true, label: "Nama" },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "member",
      label: "Peran",
      options: [...roles],
      access: { update: hasRoleField("admin") },
    },
    {
      name: "units",
      type: "select",
      hasMany: true,
      label: "Unit bisnis",
      options: [...units],
      access: { update: hasRoleField("admin") },
      admin: { description: "Ruang lingkup finance dan anggota. Admin dan pengawas otomatis semua unit." },
    },
    {
      name: "title",
      type: "select",
      label: "Jabatan",
      options: jobTitles.map((t) => ({ label: t, value: t })),
    },
  ],
};
