import type { Where } from "payload";
import type { Activity } from "@/payload-types";
import { getPayloadClient } from "@/lib/payload";
import type { SessionUser } from "@/lib/session";
import type { AuditAction, AuditChange } from "@/lib/audit";

/** Reading the audit trail: labels, links, and the same visibility rule the REST access uses. */
export const actionVerb: Record<AuditAction, string> = { create: "membuat", update: "mengubah", delete: "menghapus", login: "masuk ke Hub", export: "mengunduh" };

export const sectionLabel: Record<string, string> = {
  clients: "Klien",
  prospects: "Outreach",
  orders: "Pesanan",
  projects: "Proyek",
  transactions: "Arus Kas",
  "vault-documents": "Brankas",
  accounts: "Akun digital",
  events: "Kalender",
  users: "Tim",
  permissions: "Hak akses",
  export: "Unduhan",
};
export const sections = Object.entries(sectionLabel).map(([value, label]) => ({ value, label }));

/** Where a row points; null when the record cannot be opened (deleted, or a login). */
export function recordHref(a: Pick<Activity, "collection" | "docId" | "action">): string | null {
  if (a.action === "delete" || a.action === "login" || a.action === "export") return null;
  const id = a.docId;
  switch (a.collection) {
    case "clients": return id ? `/clients/${id}` : null;
    case "prospects": return id ? `/outreach/${id}` : null;
    case "orders": return id ? `/orders/${id}` : null;
    case "projects": return id ? `/projects/${id}` : null;
    case "transactions": return id ? `/cash-flow?edit=${id}` : null;
    case "vault-documents": return id ? `/vault/${id}` : null;
    case "accounts": return id ? `/vault/accounts/${id}` : null;
    case "events": return id ? `/calendar/${id}` : null;
    case "users": return id ? `/team/${id}` : null;
    case "permissions": return "/access";
    default: return null;
  }
}

export const changesOf = (a: Activity): AuditChange[] => (Array.isArray(a.changes) ? (a.changes as AuditChange[]) : []);

const MONEY_SECTIONS = ["transactions", "receipts", "export"];
/** Same rule as `activityRead` in access.ts, for Local API reads: admins see all; others their own rows plus changes outside money and outside logins. */
const visibleTo = (user: SessionUser): Where => {
  if (user.isAdmin) return { id: { exists: true } };
  const sections: Where = user.caps.includes("viewMoney") ? { collection: { exists: true } } : { collection: { not_in: MONEY_SECTIONS } };
  return { or: [{ actor: { equals: user.id } }, { and: [sections, { action: { not_equals: "login" } }] }] };
};

export interface ActivityQuery {
  user: SessionUser;
  actorId?: number;
  section?: string;
  page?: number;
  limit?: number;
}

export async function getActivity(q: ActivityQuery) {
  const payload = await getPayloadClient();
  const and: Where[] = [visibleTo(q.user)];
  if (q.actorId) and.push({ actor: { equals: q.actorId } });
  if (q.section) and.push({ collection: { equals: q.section } });
  return payload.find({ collection: "activity", where: { and }, sort: "-createdAt", limit: q.limit ?? 50, page: q.page ?? 1, depth: 0 });
}

/** The trail of one record, newest first. */
export async function getRecordActivity(user: SessionUser, collection: string, docId: number, limit = 8): Promise<Activity[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({ collection: "activity", where: { and: [visibleTo(user), { collection: { equals: collection } }, { docId: { equals: docId } }] }, sort: "-createdAt", limit, depth: 0 });
  return docs;
}

