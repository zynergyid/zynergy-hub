import { APIError } from "payload";
import type { Access, CollectionBeforeChangeHook, FieldAccess } from "payload";
import { units, type Role, type Unit } from "@/lib/options";

export type { Role };

interface SessionLike {
  id?: number | string;
  role?: Role;
  units?: Unit[] | null;
}

const asUser = (u: unknown) => (u ?? null) as SessionLike | null;
export const allUnits: Unit[] = units.map((u) => u.value);

/** Money visibility by role. Staff is Finance under another name for now. */
export const seesMoney = (role?: Role) => role === "admin" || role === "finance" || role === "staff" || role === "viewer";
export const editsMoney = (role?: Role) => role === "admin" || role === "finance" || role === "staff";

/** Units a user may see: admin and viewer see everything, others only their assigned units. */
export function unitsOf(user: unknown): Unit[] {
  const u = asUser(user);
  if (!u?.role) return [];
  if (u.role === "admin" || u.role === "viewer") return allUnits;
  return (u.units ?? []).filter((x): x is Unit => allUnits.includes(x as Unit));
}

export const isLoggedIn: Access = ({ req }) => Boolean(req.user);
export const isAdmin: Access = ({ req }) => asUser(req.user)?.role === "admin";

/** Read money: admin and viewer everywhere, finance only in their units. */
export const moneyRead: Access = ({ req }) => {
  const u = asUser(req.user);
  if (!u?.role) return false;
  if (u.role === "admin" || u.role === "viewer") return true;
  if (editsMoney(u.role)) return { unit: { in: unitsOf(u) } };
  return false;
};

/** Change money: admin everywhere, finance only in their units. Used for update/delete (query) and create (boolean). */
export const moneyWrite: Access = ({ req }) => {
  const u = asUser(req.user);
  if (!u?.role) return false;
  if (u.role === "admin") return true;
  if (editsMoney(u.role)) return { unit: { in: unitsOf(u) } };
  return false;
};
export const moneyCreate: Access = ({ req }) => editsMoney(asUser(req.user)?.role);

/** Clients: everyone logged in, scoped to their units (admin and viewer see all). */
export const clientRead: Access = ({ req }) => {
  const u = asUser(req.user);
  if (!u?.role) return false;
  if (u.role === "admin" || u.role === "viewer") return true;
  return { unit: { in: unitsOf(u) } };
};
export const clientWrite: Access = ({ req }) => {
  const u = asUser(req.user);
  if (!u?.role || u.role === "viewer") return false;
  if (u.role === "admin") return true;
  return { unit: { in: unitsOf(u) } };
};
export const clientCreate: Access = ({ req }) => {
  const role = asUser(req.user)?.role;
  return Boolean(role) && role !== "viewer";
};

/**
 * Orders: everyone in the unit may read them (members handle sourcing and
 * shipping), but price fields are money and use the field-level rules below.
 * Creating and deleting stay with the money roles.
 */
export const orderRead: Access = clientRead;
export const orderWrite: Access = clientWrite;
export const orderCreate: Access = moneyCreate;
export const orderDelete: Access = moneyWrite;

export const hasRoleField =
  (...allowed: Role[]): FieldAccess =>
  ({ req }) => {
    const role = asUser(req.user)?.role;
    return Boolean(role && allowed.includes(role));
  };

/**
 * Vault: every team member may read and download, except documents marked
 * confidential, which only money roles see. Uploading and deleting: money roles.
 */
export const vaultRead: Access = ({ req }) => {
  const u = asUser(req.user);
  if (!u?.role) return false;
  if (editsMoney(u.role)) return true;
  return { confidential: { not_equals: true } };
};
export const vaultWrite: Access = ({ req }) => editsMoney(asUser(req.user)?.role);

/** Field-level rules for prices and billing on orders. */
export const moneyFieldRead = hasRoleField("admin", "finance", "staff", "viewer");
export const moneyFieldWrite = hasRoleField("admin", "finance", "staff");

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

/** Server-side checks shared by server actions. */
export const canWriteUnit = (user: SessionLike | null, unit: Unit, money: boolean) => {
  if (!user?.role || user.role === "viewer") return false;
  if (user.role === "admin") return true;
  if (money && !editsMoney(user.role)) return false;
  return unitsOf(user).includes(unit);
};

/** Status changes and documents on an order: anyone working in that unit. */
export const canTouchOrder = (user: SessionLike | null, unit: Unit) => canWriteUnit(user, unit, false);
