import { APIError } from "payload";
import type { Access, CollectionBeforeChangeHook, FieldAccess, PayloadRequest } from "payload";
import { units, type Capability, type Role, type Unit } from "@/lib/options";
import { can, fromGlobal, grantsStale, setGrants, type Grantee } from "@/lib/grants-cache";

export type { Role };

/**
 * One access model for the whole Hub. A person has a role (their job) and
 * maybe the admin flag. Each role is granted capabilities on the Hak akses
 * page (`permissions` global, cached in `grants-cache.ts`); admins have all
 * of them and are the only ones who manage the team and the grants. Unit
 * scoping applies to everyone without "allUnits".
 */

interface SessionLike extends Grantee {
  id?: number | string;
  units?: Unit[] | null;
}

const asUser = (u: unknown) => (u ?? null) as SessionLike | null;
export const allUnits: Unit[] = units.map((u) => u.value);

export const has = (who: SessionLike | null | undefined, cap: Capability) => can(who, cap);
const seesAllUnits = (who: SessionLike | null) => can(who, "allUnits");

/** Units a person may see, expanded for those who see everything. */
export function unitsOf(user: unknown): Unit[] {
  const u = asUser(user);
  if (!u?.role) return [];
  if (seesAllUnits(u)) return allUnits;
  return (u.units ?? []).filter((x): x is Unit => allUnits.includes(x as Unit));
}

/** REST requests refresh the grants cache themselves; pages do it in getSessionUser. */
async function fresh(req: PayloadRequest) {
  if (!grantsStale()) return;
  try {
    setGrants(fromGlobal(await req.payload.findGlobal({ slug: "permissions", depth: 0 })));
  } catch (error) {
    console.error("grants refresh failed:", error);
  }
}

export const isLoggedIn: Access = ({ req }) => Boolean(req.user);
export const isAdmin: Access = ({ req }) => Boolean(asUser(req.user)?.isAdmin);
export const adminField: FieldAccess = ({ req }) => Boolean(asUser(req.user)?.isAdmin);

/** Anyone with the capability may create; unit is checked by `enforceUnit`. */
export const createWith =
  (...caps: Capability[]): Access =>
  async ({ req }) => {
    await fresh(req);
    const u = asUser(req.user);
    return caps.some((c) => has(u, c));
  };

/** Read a unit-scoped collection: everyone logged in, within their units. */
export const unitRead: Access = async ({ req }) => {
  await fresh(req);
  const u = asUser(req.user);
  if (!u?.role) return false;
  return seesAllUnits(u) || { unit: { in: unitsOf(u) } };
};

/** Change a unit-scoped collection with the given capability, within one's units (admin everywhere). */
export const writeWith =
  (...caps: Capability[]): Access =>
  async ({ req }) => {
    await fresh(req);
    const u = asUser(req.user);
    if (!caps.some((c) => has(u, c))) return false;
    return Boolean(u?.isAdmin) || { unit: { in: unitsOf(u) } };
  };

/** Read money: like unitRead, for people who see money. */
export const moneyRead: Access = async ({ req }) => {
  await fresh(req);
  const u = asUser(req.user);
  if (!has(u, "viewMoney")) return false;
  return seesAllUnits(u) || { unit: { in: unitsOf(u) } };
};

/** Vault: everyone may read and download, except confidential documents, which need editVault. */
export const vaultRead: Access = async ({ req }) => {
  await fresh(req);
  const u = asUser(req.user);
  if (!u?.role) return false;
  return has(u, "editVault") || { confidential: { not_equals: true } };
};

/** Field-level rule for prices and billing: people without viewMoney still read the rest of the record. */
export const moneyFieldRead: FieldAccess = async ({ req }) => {
  await fresh(req);
  return has(asUser(req.user), "viewMoney");
};

/**
 * REST safety net: a non-admin may only write documents in their own units.
 * Local API calls from server actions carry no req.user and validate in the action.
 */
export const enforceUnit: CollectionBeforeChangeHook = ({ data, req }) => {
  const u = asUser(req.user);
  if (!u?.role || u.isAdmin) return data;
  const unit = data?.unit as Unit | undefined;
  if (unit && !unitsOf(u).includes(unit)) {
    throw new APIError("Tidak punya akses ke unit ini.", 403);
  }
  return data;
};

/** Server actions: may this person change this kind of data in this unit? */
export const canWriteUnit = (user: SessionLike | null, unit: Unit, cap: Capability) => has(user, cap) && unitsOf(user).includes(unit);
