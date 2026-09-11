import { headers } from "next/headers";
import { getPayloadClient } from "@/lib/payload";
import { editsMoney, seesMoney, unitsOf } from "@/lib/access";
import type { Role, Unit } from "@/lib/options";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  /** Units this person may see (already expanded for admin and viewer). */
  units: Unit[];
  title: string | null;
}

/** Current team member from the Payload auth cookie, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: await headers() });
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    units: unitsOf(user),
    title: user.title ?? null,
  };
}

export const canSeeMoney = (u: SessionUser) => seesMoney(u.role);
export const canEditMoney = (u: SessionUser) => editsMoney(u.role);
export const canEditClients = (u: SessionUser) => u.role !== "viewer";
