import type { Access, FieldAccess } from "payload";

export type Role = "admin" | "finance" | "member";

function roleOf(user: unknown): Role | null {
  const role = (user as { role?: Role } | null)?.role;
  return role ?? null;
}

export const isLoggedIn: Access = ({ req }) => Boolean(req.user);

export const hasRole =
  (...roles: Role[]): Access =>
  ({ req }) => {
    const role = roleOf(req.user);
    return Boolean(role && roles.includes(role));
  };

export const hasRoleField =
  (...roles: Role[]): FieldAccess =>
  ({ req }) => {
    const role = roleOf(req.user);
    return Boolean(role && roles.includes(role));
  };

export const isAdmin = hasRole("admin");
/** Admin and finance: the only roles that see money. */
export const isFinance = hasRole("admin", "finance");
