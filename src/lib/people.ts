import { getPayloadClient } from "@/lib/payload";

/** Photo URL per user id, for lists that show many people (activity rows, follow-ups). */
export async function getUserPhotos(): Promise<Map<number, string>> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({ collection: "users", limit: 100, depth: 1, select: { photo: true } });
  const map = new Map<number, string>();
  for (const u of docs) if (typeof u.photo === "object" && u.photo?.url) map.set(u.id, u.photo.url);
  return map;
}
