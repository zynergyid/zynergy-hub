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
}

/** Current team member from the Payload auth cookie, or null. Also refreshes the grants cache. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const payload = await getPayloadClient();
  const [{ user }] = await Promise.all([payload.auth({ headers: await headers() }), loadGrants()]);
  if (!user) return null;
  const who = { role: user.role, isAdmin: Boolean(user.isAdmin) };
  return { id: user.id, name: user.name, email: user.email, role: user.role, isAdmin: who.isAdmin, units: unitsOf(user), caps: capsOf(who) };
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
