import type { CollectionConfig } from "payload";
import { createWith, isLoggedIn } from "@/lib/access";

/** One documentation photo per calendar event (meeting snapshot, the posted content). Shrunk client-side to 1 MB. */
export const EventPhotos: CollectionConfig = {
  slug: "event-photos",
  labels: { singular: "Foto acara", plural: "Foto acara" },
  admin: { group: "Tim" },
  access: {
    read: isLoggedIn,
    create: createWith("team"),
    update: createWith("team"),
    delete: createWith("team"),
  },
  upload: { mimeTypes: ["image/*"] },
  fields: [],
};
