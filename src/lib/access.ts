import { APIError } from "payload";
import type { Access, CollectionBeforeChangeHook, FieldAccess } from "payload";
import { units, type Role, type Unit } from "@/lib/options";

export type { Role };

/**
 * One access model for the whole Hub, in three questions:
 *
 *   who may CHANGE data?   admin, finance, staff (the "editor" roles)
 *   who may SEE money?     the editor roles plus viewer (komisaris)
 *   which UNITS?           admin and viewer every unit, everyone else their `users.units`
 *
 * member (Anggota) and viewer (Pengawas) never write anything; member also
 * never sees money. Writes are an allow-list of roles, so a new role is
 * read-only until it is added here on purpose.
 */

interface SessionLike {
  id?: number | string;
  role?: Role;
  units?: Unit[] | null;
}

const asUser = (u: unknown) => (u ?? null) as SessionLike | null;
export const allUnits: Unit[] = units.map((u) => u.value);

export const edits = (role?: Role) => role === "admin" || role === "finance" || role === "staff";
export const seesMoney = (role?: Role) => edits(role) || role === "viewer";
const seesAllUnits = (role?: Role) => role === "admin" || role === "viewer";

/** Units a person may see, expanded for the roles that see everything. */
export function unitsOf(user: unknown): Unit[] {
  const u = asUser(user);
  if (!u?.role) return [];
  if (seesAllUnits(u.role)) return allUnits;
  return (u.units ?? []).filter((x): x is Unit => allUnits.includes(x as Unit));
}

export const isLoggedIn: Access = ({ req }) => Boolean(req.user);
export const isAdmin: Access = ({ req }) => asUser(req.user)?.role === "admin";
export const isEditor: Access = ({ req }) => edits(asUser(req.user)?.role);

/** Read a unit-scoped collection: everyone logged in, within their units. */
export const unitRead: Access = ({ req }) => {
  const u = asUser(req.user);
  if (!u?.role) return false;
  return seesAllUnits(u.role) || { unit: { in: unitsOf(u) } };
};

/** Change a unit-scoped collection: editor roles only, within their units (admin everywhere). */
export const unitWrite: Access = ({ req }) => {
  const u = asUser(req.user);
  if (!edits(u?.role)) return false;
  return u?.role === "admin" || { unit: { in: unitsOf(u) } };
};

/** Read money: like unitRead, minus member. */
export const moneyRead: Access = ({ req }) => {
  const u = asUser(req.user);
  if (!seesMoney(u?.role)) return false;
  return seesAllUnits(u?.role) || { unit: { in: unitsOf(u) } };
};

/**
 * Vault: everyone may read and download, except documents marked
 * confidential, which only editor roles see. Uploading and deleting: editors.
 */
export const vaultRead: Access = ({ req }) => {
  const u = asUser(req.user);
  if (!u?.role) return false;
  return edits(u.role) || { confidential: { not_equals: true } };
};

export const hasRoleField =
  (...allowed: Role[]): FieldAccess =>
  ({ req }) => {
    const role = asUser(req.user)?.role;
    return Boolean(role && allowed.includes(role));
  };

/** Field-level rule for prices and billing: hidden from member, who may read the rest of the record. */
export const moneyFieldRead = hasRoleField("admin", "finance", "staff", "viewer");

/**
 * REST safety net: a non-admin may only write documents in their own units.
 * Local API calls from server actions carry no req.user and validate in the action.
 */
export const enforceUnit: CollectionBeforeChangeHook = ({ data, req }) => {
  const u = asUser(req.user);
  if (!u?.role || u.role === "admin") return data;
  const unit = data?.unit as Unit | undefined;
  if (unit && !unitsOf(u).includes(unit)) {
    throw new APIError("Tidak punya akses ke unit ini.", 403);
  }
  return data;
};

/** Server actions: may this person change something in this unit? */
export const canWriteUnit = (user: SessionLike | null, unit: Unit) => edits(user?.role) && unitsOf(user).includes(unit);
