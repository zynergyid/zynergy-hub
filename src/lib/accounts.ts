import type { Account } from "@/payload-types";
import type { SessionUser } from "@/lib/session";

export const holderIdsOf = (a: Pick<Account, "holders">): number[] => (a.holders ?? []).map((h) => (typeof h === "object" ? h.id : h));

/** "tim": anyone who can open Brankas. "rahasia": only an Admin or one of the account's holders. */
export function canRevealPassword(user: SessionUser, account: Pick<Account, "visibility" | "holders">): boolean {
  if (account.visibility !== "rahasia") return true;
  return user.isAdmin || holderIdsOf(account).includes(user.id);
}
