import { getPayloadClient } from "@/lib/payload";
import { fromGlobal, getGrants, grantsStale, setGrants, toGlobal } from "@/lib/grants-cache";
import type { RoleGrants } from "@/lib/options";

/** Current grants, refreshed from the `permissions` global when the cache is stale. */
export async function loadGrants(): Promise<RoleGrants> {
  if (!grantsStale()) return getGrants();
  try {
    const payload = await getPayloadClient();
    setGrants(fromGlobal(await payload.findGlobal({ slug: "permissions", depth: 0 })));
  } catch (error) {
    console.error("loadGrants failed, keeping the last known grants:", error);
    setGrants(getGrants());
  }
  return getGrants();
}

/** Writes the grants and makes them effective at once in this process. */
export async function saveGrantsToGlobal(grants: RoleGrants): Promise<void> {
  const payload = await getPayloadClient();
  await payload.updateGlobal({ slug: "permissions", data: toGlobal(grants) });
  setGrants(grants);
}
