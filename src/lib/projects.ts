import type { Project, Transaction } from "@/payload-types";
import { getPayloadClient } from "@/lib/payload";
import { scopeUnits, type UnitFilter } from "@/lib/finance";
import { openProjectStages, type ProjectHealth, type Unit } from "@/lib/options";
import { actionOverdue, clientOfProject, isOpenProject, projectUnitsOf } from "@/lib/project-rules";

export interface ProjectOption {
  id: number;
  label: string;
  unit: Unit;
}

export interface UserOption {
  id: number;
  name: string;
}

export { actionOverdue, briefComplete, clientOfProject, deliverableProgress, isOpenProject, nextPayment, ownerOfProject, projectUnitsOf } from "@/lib/project-rules";
export const toProjectOption = (p: Project): ProjectOption => ({
  id: p.id,
  label: `${p.name}${clientOfProject(p) ? ` · ${clientOfProject(p)!.name}` : ""}`,
  unit: p.unit,
});

const healthRank: Record<ProjectHealth, number> = { terhambat: 0, berisiko: 1, lancar: 2 };
const ts = (iso?: string | null) => (iso ? new Date(iso).getTime() : Number.MAX_SAFE_INTEGER);

export type ProjectListFilter = "berjalan" | "selesai" | "semua";

export async function getProjects(opts: {
  unit: UnitFilter;
  allowed: Unit[];
  filter?: ProjectListFilter;
  q?: string;
  clientId?: number;
}): Promise<Project[]> {
  const scoped = projectUnitsOf(scopeUnits(opts.unit, opts.allowed));
  if (scoped.length === 0) return [];
  const q = opts.q?.trim();
  const filter = opts.filter ?? "berjalan";
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "projects",
    where: {
      and: [
        { unit: { in: scoped } },
        filter === "berjalan" ? { stage: { in: [...openProjectStages] } } : filter === "selesai" ? { stage: { equals: "selesai" } } : {},
        opts.clientId ? { client: { equals: opts.clientId } } : {},
        q ? { or: [{ name: { contains: q } }, { "client.name": { contains: q } }] } : {},
      ],
    },
    limit: 1000,
    depth: 1,
  });
  // Running projects first: overdue actions, then the unhealthy ones, then the nearest action date.
  return docs.sort((a, b) => {
    const ao = isOpenProject(a);
    const bo = isOpenProject(b);
    if (ao !== bo) return ao ? -1 : 1;
    if (ao) {
      const da = actionOverdue(a);
      const db = actionOverdue(b);
      if (da !== db) return da ? -1 : 1;
      if (healthRank[a.health] !== healthRank[b.health]) return healthRank[a.health] - healthRank[b.health];
      if (ts(a.nextActionAt) !== ts(b.nextActionAt)) return ts(a.nextActionAt) - ts(b.nextActionAt);
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export interface ProjectSummary {
  openCount: number;
  openValue: number;
  /** Flagged at risk or blocked by their owner. */
  attention: number;
  /** Next action past its date. */
  overdue: number;
  upcoming: Project[];
}

export async function getProjectSummary(unit: UnitFilter, allowed: Unit[]): Promise<ProjectSummary> {
  const open = await getProjects({ unit, allowed, filter: "berjalan" });
  return {
    openCount: open.length,
    openValue: open.reduce((s, p) => s + (p.value ?? 0), 0),
    attention: open.filter((p) => p.health !== "lancar").length,
    overdue: open.filter(actionOverdue).length,
    upcoming: open.slice(0, 5),
  };
}

/** Cash movements linked to a project: money received counts as paid, money out as cost. */
export async function getProjectPayments(projectId: number): Promise<{ rows: Transaction[]; paid: number; cost: number }> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({ collection: "transactions", where: { project: { equals: projectId } }, sort: "-date", limit: 100 });
  let paid = 0;
  let cost = 0;
  for (const t of docs) {
    if (t.type === "masuk") paid += t.amount;
    else cost += t.amount;
  }
  return { rows: docs, paid, cost };
}

/** Team members who can own a project (everyone but the viewer). */
export async function getUserOptions(): Promise<UserOption[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({ collection: "users", limit: 100, sort: "name", select: { name: true, role: true } });
  return docs.filter((u) => u.role !== "viewer").map((u) => ({ id: u.id, name: u.name }));
}
