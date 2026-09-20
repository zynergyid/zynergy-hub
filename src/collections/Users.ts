import type { CollectionConfig } from "payload";
import { adminField, isAdmin, isLoggedIn } from "@/lib/access";
import { roles, units } from "@/lib/options";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/auth-cookie";

/** Team accounts. Role = the job (grants come from Hak akses), isAdmin = everything plus team management, units = scope. */
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
      const user = req.user as { id: number | string; isAdmin?: boolean | null } | null;
      if (!user) return false;
      if (user.isAdmin) return true;
      return { id: { equals: user.id } };
    },
  },
  fields: [
    { name: "name", type: "text", required: true, label: "Nama" },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "Other",
      label: "Peran (jabatan)",
      options: [...roles],
      access: { update: adminField },
    },
    {
      name: "isAdmin",
      type: "checkbox",
      defaultValue: false,
      label: "Admin",
      admin: { description: "Semua hak, kelola tim dan hak akses." },
      access: { update: adminField },
    },
    {
      name: "units",
      type: "select",
      hasMany: true,
      label: "Unit bisnis",
      options: [...units],
      access: { update: adminField },
      admin: { description: "Ruang lingkup untuk peran tanpa hak Melihat semua unit." },
    },
    {
      // Secret in the personal calendar-feed URL (read-only feed). Visible to its owner and admins only.
      name: "calendarToken",
      type: "text",
      admin: { hidden: true },
      access: {
        read: ({ req, doc }) => {
          const user = req.user as { id: number | string; isAdmin?: boolean | null } | null;
          return Boolean(user && (user.isAdmin || doc?.id === user.id));
        },
        update: adminField,
      },
    },
  ],
};
