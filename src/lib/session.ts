import { cache } from "react";
import { headers } from "next/headers";
import { getPayloadClient } from "@/lib/payload";
import { unitsOf } from "@/lib/access";
import { capsOf } from "@/lib/grants-cache";
import { loadGrants } from "@/lib/permissions";
import type { Capability, Role, Unit } from "@/lib/options";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  /** The job, which is also the access role. */
  role: Role;
  isAdmin: boolean;
  /** Units this person may see (already expanded for those who see all). */
  units: Unit[];
  /** What the person may do right now, from the Hak akses grants (everything for admins). */
  caps: Capability[];
  lastSeenAt: string | null;
  photoUrl: string | null;
}

/** One auth lookup per request, shared by pages, actions, and audit hooks. */
const authFromHeaders = cache(async () => {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: await headers() });
  return user;
});

/** Current team member from the Payload auth cookie, or null. Also refreshes the grants cache. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const [user] = await Promise.all([authFromHeaders(), loadGrants()]);
  if (!user) return null;
  const who = { role: user.role, isAdmin: Boolean(user.isAdmin) };
  const photoUrl = typeof user.photo === "object" && user.photo ? (user.photo.url ?? null) : null;
  return { id: user.id, name: user.name, email: user.email, role: user.role, isAdmin: who.isAdmin, units: unitsOf(user), caps: capsOf(who), lastSeenAt: user.lastSeenAt ?? null, photoUrl };
}

/** Minutes of silence before a person stops counting as online. */
export const PRESENCE_MINUTES = 5;
export const isOnline = (lastSeenAt?: string | null) => Boolean(lastSeenAt && Date.now() - new Date(lastSeenAt).getTime() < PRESENCE_MINUTES * 60_000);

/** Stamps "last seen" at most once per five minutes; the audit hook skips this write. */
export async function touchPresence(user: SessionUser): Promise<void> {
  const last = user.lastSeenAt ? new Date(user.lastSeenAt).getTime() : 0;
  if (Date.now() - last < PRESENCE_MINUTES * 60_000) return;
  try {
    const payload = await getPayloadClient();
    await payload.update({ collection: "users", id: user.id, data: { lastSeenAt: new Date().toISOString() }, context: { skipAudit: true } });
  } catch (error) {
    console.error("touchPresence failed:", error);
  }
}

const hasCap = (cap: Capability) => (u: SessionUser) => u.caps.includes(cap);
export const canSeeMoney = hasCap("viewMoney");
export const canEditMoney = (u: SessionUser) => u.caps.includes("editMoney") && u.caps.includes("viewMoney");
export const canEditClients = hasCap("editClients");
export const canEditOrders = hasCap("editOrders");
export const canEditProjects = hasCap("editProjects");
export const canEditVault = hasCap("editVault");
export const canEditTeam = hasCap("team");
export const canEditSeo = hasCap("seo");
