import type { CollectionConfig } from "payload";
import { hasRoleField, isAdmin, isLoggedIn } from "@/lib/access";
import { jobTitles, roles, units } from "@/lib/options";

/** Team accounts. Role = access level, units = scope, title = descriptive only. */
export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Anggota Tim", plural: "Anggota Tim" },
  auth: true,
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
