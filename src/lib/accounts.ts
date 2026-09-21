import type { Account } from "@/payload-types";
import type { SessionUser } from "@/lib/session";

export const holderIdOf = (a: Pick<Account, "holder">): number | null => (typeof a.holder === "object" && a.holder ? a.holder.id : (a.holder ?? null));

/** "tim": anyone who can open Brankas. "rahasia": only an Admin or the account's holder. */
export function canRevealPassword(user: SessionUser, account: Pick<Account, "visibility" | "holder">): boolean {
  if (account.visibility !== "rahasia") return true;
  return user.isAdmin || holderIdOf(account) === user.id;
}
