import type { Project } from "@/payload-types";
import { daysUntil } from "@/lib/format";
import { openProjectStages, projectUnits, type Unit } from "@/lib/options";

/**
 * Pure project rules, safe for client components (no Payload import).
 * `lib/projects.ts` re-exports them next to the data loaders.
 */
export const clientOfProject = (p: Project) => (typeof p.client === "object" && p.client ? p.client : null);
export const ownerOfProject = (p: Project) => (typeof p.owner === "object" && p.owner ? p.owner : null);
export const isOpenProject = (p: Pick<Project, "stage">) => openProjectStages.includes(p.stage);
/** The units a person may see that work in projects (Supply works in POs). */
export const projectUnitsOf = (allowed: Unit[]) => allowed.filter((u) => projectUnits.includes(u));

/** A running project whose next action is past its date. */
export const actionOverdue = (p: Project) => isOpenProject(p) && Boolean(p.nextActionAt) && daysUntil(p.nextActionAt as string) < 0;

/** The three lines a brief must have before the project may leave Discovery. */
export const briefComplete = (p: Pick<Project, "brief">) => Boolean(p.brief?.goals?.trim() && p.brief?.users?.trim() && p.brief?.currentFlow?.trim());

export function deliverableProgress(p: Project): { done: number; total: number } {
  const rows = p.deliverables ?? [];
  return { done: rows.filter((d) => d.done).length, total: rows.length };
}

/** What the client owes next: the DP before any money came in, then the remainder. */
export function nextPayment(p: Pick<Project, "value" | "dpPercent">, paid: number): { label: string; amount: number } | null {
  const value = p.value ?? 0;
  if (!value) return null;
  const dp = Math.round((value * (p.dpPercent ?? 0)) / 100);
  if (paid <= 0 && dp > 0) return { label: "DP", amount: dp };
  const remaining = value - paid;
  return remaining > 0 ? { label: "pelunasan", amount: remaining } : null;
}
