import { capabilities, defaultGrants, roles, type Capability, type Role, type RoleGrants } from "@/lib/options";

/**
 * Process-wide copy of the role grants, so the synchronous rule helpers in
 * `access.ts` can answer without a database call. Refreshed by
 * `lib/permissions.ts` (pages) and by the Payload access rules (REST) when
 * older than the TTL; replaced right after an admin saves.
 */
let current: RoleGrants = defaultGrants;
let loadedAt = 0;
const TTL_MS = 30_000;

export const getGrants = () => current;
export const grantsStale = () => Date.now() - loadedAt > TTL_MS;
export function setGrants(grants: RoleGrants) {
  current = grants;
  loadedAt = Date.now();
}
export const invalidateGrants = () => {
  loadedAt = 0;
};

/** Reads the `permissions` global document (or its defaults) into a grants map. */
export function fromGlobal(doc: unknown): RoleGrants {
  const d = (doc ?? {}) as Record<string, Record<string, unknown> | undefined>;
  return Object.fromEntries(roles.map((r) => [r.value, capabilities.map((c) => c.key).filter((c) => d[r.value]?.[c] === true)])) as RoleGrants;
}
export function toGlobal(grants: RoleGrants): Record<Role, Record<Capability, boolean>> {
  return Object.fromEntries(roles.map((r) => [r.value, Object.fromEntries(capabilities.map((c) => [c.key, grants[r.value].includes(c.key)]))])) as Record<Role, Record<Capability, boolean>>;
}

export interface Grantee {
  role?: Role | null;
  isAdmin?: boolean | null;
}

/** Admin can do everything; other people only what their role was granted. */
export const can = (who: Grantee | null | undefined, cap: Capability, grants: RoleGrants = current) => Boolean(who && (who.isAdmin || (who.role && grants[who.role]?.includes(cap))));
export const capsOf = (who: Grantee | null | undefined, grants: RoleGrants = current): Capability[] => capabilities.map((c) => c.key).filter((c) => can(who, c, grants));
