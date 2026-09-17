import type { Where } from "payload";
import type { VaultDocument } from "@/payload-types";
import { getPayloadClient } from "@/lib/payload";
import { daysUntil } from "@/lib/format";
import { VAULT_WARN_DAYS, vaultCategories, type VaultCategory } from "@/lib/options";

export const fileOf = (d: VaultDocument) => (typeof d.file === "object" && d.file ? d.file : null);
export const thumbnailOf = (d: VaultDocument) => (typeof d.thumbnail === "object" && d.thumbnail ? d.thumbnail : null);

/** Expired, expiring within the warning window, or fine. Null when the document does not expire. */
export function expiryState(d: Pick<VaultDocument, "expiresAt">): "lewat" | "segera" | "aman" | null {
  if (!d.expiresAt) return null;
  const days = daysUntil(d.expiresAt);
  return days < 0 ? "lewat" : days <= VAULT_WARN_DAYS ? "segera" : "aman";
}

/** Where-clause that hides confidential documents from people outside the money roles. */
const visibility = (includeConfidential: boolean): Where => (includeConfidential ? {} : { confidential: { not_equals: true } });

export async function getVaultDocuments(opts: { includeConfidential: boolean; q?: string; category?: VaultCategory | "" }): Promise<VaultDocument[]> {
  const q = opts.q?.trim();
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "vault-documents",
    where: {
      and: [
        visibility(opts.includeConfidential),
        opts.category ? { category: { equals: opts.category } } : {},
        q ? { or: [{ title: { contains: q } }, { number: { contains: q } }, { issuer: { contains: q } }, { notes: { contains: q } }] } : {},
      ],
    },
    sort: "title",
    limit: 500,
    depth: 1,
  });
  return docs;
}

/** Documents grouped in category order; empty categories are skipped. */
export function groupByCategory(docs: VaultDocument[]) {
  return vaultCategories
    .map((c) => ({ category: c.value, label: c.label, docs: docs.filter((d) => d.category === c.value) }))
    .filter((g) => g.docs.length > 0);
}

/** Documents that need attention (expired first, then soonest) plus the total the person may see. */
export async function getVaultSummary(includeConfidential: boolean): Promise<{ expiring: VaultDocument[]; total: number }> {
  const until = new Date(Date.now() + VAULT_WARN_DAYS * 86400000).toISOString();
  const payload = await getPayloadClient();
  const [expiring, count] = await Promise.all([
    payload.find({
      collection: "vault-documents",
      where: { and: [visibility(includeConfidential), { expiresAt: { less_than_equal: until } }] },
      sort: "expiresAt",
      limit: 50,
      depth: 0,
    }),
    payload.count({ collection: "vault-documents", where: visibility(includeConfidential) }),
  ]);
  return { expiring: expiring.docs, total: count.totalDocs };
}
