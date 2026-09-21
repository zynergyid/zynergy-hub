import type { CollectionConfig } from "payload";
import { isLoggedIn } from "@/lib/access";

/** Profile photos: one small square per person, shrunk in the browser. Anyone logged in may see them; the owner writes theirs from Profil. */
export const Avatars: CollectionConfig = {
  slug: "avatars",
  labels: { singular: "Foto profil", plural: "Foto profil" },
  admin: { group: "Tim" },
  access: {
    read: isLoggedIn,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
  },
  upload: { mimeTypes: ["image/*"] },
  fields: [],
};
