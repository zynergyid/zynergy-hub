import type { CollectionConfig } from "payload";
import { hasRoleField, isAdmin, isLoggedIn } from "@/lib/access";

/** Team accounts. Role decides what a person can see and change. */
export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Anggota Tim", plural: "Anggota Tim" },
  auth: true,
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "role"],
    group: "Admin",
  },
  access: {
    // The Payload panel is an escape hatch for admins; everyone else uses the custom screens.
    admin: ({ req }) => (req.user as { role?: string } | null)?.role === "admin",
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
      options: [
        { label: "Admin (semua akses)", value: "admin" },
        { label: "Finance (klien + keuangan)", value: "finance" },
        { label: "Member (klien saja)", value: "member" },
      ],
      access: { update: hasRoleField("admin") },
      admin: { position: "sidebar" },
    },
  ],
};
