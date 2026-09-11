import { headers } from "next/headers";
import { getPayloadClient } from "@/lib/payload";

export type SessionUser = { id: number; name: string; email: string; role: "admin" | "finance" | "member" };

/** Current team member from the Payload admin cookie, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: await headers() });
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
