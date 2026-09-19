"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Project } from "@/payload-types";
import { getPayloadClient } from "@/lib/payload";
import { canEdit, getSessionUser } from "@/lib/session";
import { canWriteUnit } from "@/lib/access";
import { dateOrNull, digits, pick, text } from "@/lib/form-data";
import { keepDocumentRows } from "@/lib/documents";
import { briefComplete } from "@/lib/projects";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MESSAGE, uploadFile } from "@/lib/uploads";
import {
  projectDocumentKinds,
  projectHealth,
  projectHealthLabel,
  projectLogTypes,
  projectStageLabel,
  projectStages,
  projectUnits,
  units,
} from "@/lib/options";

export interface ProjectFormState {
  status: "idle" | "success" | "error";
  message?: string;
  id?: number;
}

const err = (message: string): ProjectFormState => ({ status: "error", message });
const isUrl = (v: string) => /^https?:\/\//i.test(v);

type LogEntry = NonNullable<Project["log"]>[number];
const keepLog = (p: Project): LogEntry[] => (p.log ?? []).map((l) => ({ id: l.id ?? undefined, date: l.date, type: l.type, note: l.note ?? null }));
const withLog = (p: Project, type: LogEntry["type"], note?: string | null, date?: string | null): LogEntry[] => [
  ...keepLog(p),
  { id: undefined, date: date ?? new Date().toISOString(), type, note: note || null },
];

type DeliverableRow = NonNullable<Project["deliverables"]>[number];
const keepDeliverables = (p: Project): DeliverableRow[] =>
  (p.deliverables ?? []).map((d) => ({ id: d.id ?? undefined, title: d.title, done: d.done ?? false, doneAt: d.doneAt ?? null }));

function revalidateProjects(id?: number) {
  revalidatePath("/projects");
  revalidatePath("/");
  revalidatePath("/cash-flow");
  if (id) revalidatePath(`/projects/${id}`);
}

/** Project details and money: the money roles, like a PO. */
export async function saveProject(_prev: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const user = await getSessionUser();
  if (!user) return err("Sesi habis, login lagi.");
  if (!canEdit(user)) return err("Hanya admin, finance, dan staf yang bisa mengubah data proyek.");

  const id = Number(formData.get("id") || 0) || null;
  const unit = pick(units, text(formData, "unit"));
  if (!unit || !projectUnits.includes(unit)) return err("Pilih unit Digital atau Apps.");
  if (!canWriteUnit(user, unit)) return err("Anda tidak punya akses ke unit ini.");
  const name = text(formData, "name");
  if (!name) return err("Nama proyek wajib diisi.");
  const clientId = Number(text(formData, "client")) || 0;
  if (!clientId) return err("Pilih klien.");
  const ownerId = Number(text(formData, "owner")) || null;
  const value = Number(digits(text(formData, "value"))) || null;
  const dpRaw = text(formData, "dpPercent");
  const dpPercent = dpRaw === "" ? 50 : Math.min(100, Math.max(0, Number(dpRaw) || 0));
  const links = { repo: text(formData, "repo") || null, staging: text(formData, "staging") || null, live: text(formData, "live") || null };
  for (const [key, link] of Object.entries(links)) {
    if (link && !isUrl(link)) return err(`Tautan ${key} harus diawali http:// atau https://.`);
  }
  // Files sent with a new project; the request body itself is capped at the same size.
  const files = id ? [] : formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.some((f) => f.size > MAX_UPLOAD_BYTES) || files.reduce((sum, f) => sum + f.size, 0) > MAX_UPLOAD_BYTES) return err(MAX_UPLOAD_MESSAGE);
  const docKind = pick(projectDocumentKinds, text(formData, "docKind")) ?? "lainnya";

  try {
    const payload = await getPayloadClient();
    const client = await payload.findByID({ collection: "clients", id: clientId, disableErrors: true });
    if (!client || client.unit !== unit) return err("Klien tidak ditemukan atau bukan dari unit ini.");
    if (id) {
      const existing = await payload.findByID({ collection: "projects", id, depth: 0, disableErrors: true });
      if (!existing || !canWriteUnit(user, existing.unit)) return err("Proyek tidak ditemukan atau di luar unit Anda.");
    }
    const data = {
      unit,
      name,
      client: clientId,
      owner: ownerId,
      value,
      dpPercent,
      startDate: dateOrNull(text(formData, "startDate")),
      targetDate: dateOrNull(text(formData, "targetDate")),
      links,
      notes: text(formData, "notes") || null,
    };
    const documents = [];
    for (const file of files) {
      const uploaded = await uploadFile(payload, "documents", { unit }, file);
      documents.push({ id: undefined, kind: docKind, file: uploaded.id, note: null });
    }
    const doc = id
      ? await payload.update({ collection: "projects", id, data })
      : await payload.create({
          collection: "projects",
          data: { ...data, documents, stage: "discovery", health: "lancar", log: [{ date: new Date().toISOString(), type: "tahap", note: "Proyek dibuat, mulai di Discovery" }] },
        });
    revalidateProjects(doc.id);
    return { status: "success", id: doc.id };
  } catch (error) {
    console.error("saveProject failed:", error);
    return err("Gagal menyimpan. Coba lagi.");
  }
}

export async function deleteProject(formData: FormData) {
  const user = await getSessionUser();
  if (!user || !canEdit(user)) return;
  const id = Number(formData.get("id") || 0);
  if (!id) return;
  const payload = await getPayloadClient();
  const existing = await payload.findByID({ collection: "projects", id, depth: 0, disableErrors: true });
  if (!existing || !canWriteUnit(user, existing.unit)) return;
  for (const d of keepDocumentRows(existing.documents)) {
    await payload.delete({ collection: "documents", id: d.file }).catch(() => undefined);
  }
  await payload.delete({ collection: "projects", id });
  revalidateProjects();
  redirect("/projects");
}

/** Load a project the current person may change; null otherwise. */
async function loadEditable(projectId: number) {
  const user = await getSessionUser();
  if (!user) return null;
  const payload = await getPayloadClient();
  const project = await payload.findByID({ collection: "projects", id: projectId, depth: 0, disableErrors: true });
  if (!project || !canWriteUnit(user, project.unit)) return null;
  return { user, payload, project };
}

function back(id: number): never {
  redirect(`/projects/${id}`);
}

export async function setStage(formData: FormData) {
  const id = Number(formData.get("projectId") || 0);
  const ctx = id ? await loadEditable(id) : null;
  if (!ctx) return;
  const stage = pick(projectStages, text(formData, "stage"));
  if (!stage) back(id);
  // "Sejak": the real date the stage began, for projects entered into the Hub late. Never in the future.
  const sinceRaw = dateOrNull(text(formData, "since"));
  const since = sinceRaw && new Date(sinceRaw) < new Date() ? sinceRaw : null;
  const note = text(formData, "note");
  if (stage === ctx.project.stage) {
    if (since && since !== ctx.project.stageChangedAt) {
      await ctx.payload.update({
        collection: "projects",
        id,
        data: { stageChangedAt: since, log: withLog(ctx.project, "tahap", `Tanggal mulai tahap ${projectStageLabel.get(stage)} diubah ke ${since.slice(0, 10)}${note ? `: ${note}` : ""}`) },
      });
      revalidateProjects(id);
    }
    back(id);
  }
  // Discovery ends with a written brief; without one the next stages are guesses.
  if (ctx.project.stage === "discovery" && stage !== "batal" && !briefComplete(ctx.project)) redirect(`/projects/${id}?error=brief`);
  const closed = stage === "selesai" || stage === "batal";
  await ctx.payload.update({
    collection: "projects",
    id,
    data: {
      stage,
      ...(since ? { stageChangedAt: since } : {}),
      ...(closed ? { nextAction: null, nextActionAt: null, blocker: null } : {}),
      log: withLog(ctx.project, "tahap", `Dari ${projectStageLabel.get(ctx.project.stage)} ke ${projectStageLabel.get(stage)}${since ? ` (sejak ${since.slice(0, 10)})` : ""}${note ? `: ${note}` : ""}`),
    },
  });
  revalidateProjects(id);
  back(id);
}

/** The weekly line: health flag, what is next, what we wait for. */
export async function updateProjectStatus(formData: FormData) {
  const id = Number(formData.get("projectId") || 0);
  const ctx = id ? await loadEditable(id) : null;
  if (!ctx) return;
  const health = pick(projectHealth, text(formData, "health")) ?? ctx.project.health;
  const blocker = text(formData, "blocker") || null;
  const changed = health !== ctx.project.health || (blocker ?? "") !== (ctx.project.blocker ?? "");
  await ctx.payload.update({
    collection: "projects",
    id,
    data: {
      health,
      blocker,
      nextAction: text(formData, "nextAction") || null,
      nextActionAt: dateOrNull(text(formData, "nextActionAt")),
      ...(changed ? { log: withLog(ctx.project, "status", `${projectHealthLabel.get(health)}${blocker ? `, menunggu ${blocker}` : ""}`) } : {}),
    },
  });
  revalidateProjects(id);
  back(id);
}

/** The Discovery artifact, written in the Hub so the stage gate can check it. */
export async function saveBrief(formData: FormData) {
  const id = Number(formData.get("projectId") || 0);
  const ctx = id ? await loadEditable(id) : null;
  if (!ctx) return;
  const confirmed = formData.get("confirmed") === "on";
  const wasConfirmed = Boolean(ctx.project.brief?.confirmedAt);
  await ctx.payload.update({
    collection: "projects",
    id,
    data: {
      brief: {
        goals: text(formData, "goals") || null,
        users: text(formData, "users") || null,
        currentFlow: text(formData, "currentFlow") || null,
        targetFlow: text(formData, "targetFlow") || null,
        successMeasure: text(formData, "successMeasure") || null,
        constraints: text(formData, "constraints") || null,
        references: text(formData, "references") || null,
        confirmedAt: confirmed ? (ctx.project.brief?.confirmedAt ?? new Date().toISOString()) : null,
      },
      ...(confirmed && !wasConfirmed ? { log: withLog(ctx.project, "klien", "Brief dikonfirmasi klien") } : {}),
    },
  });
  revalidateProjects(id);
  back(id);
}

export async function addDeliverable(formData: FormData) {
  const id = Number(formData.get("projectId") || 0);
  const ctx = id ? await loadEditable(id) : null;
  if (!ctx) return;
  const title = text(formData, "title");
  if (title) {
    await ctx.payload.update({
      collection: "projects",
      id,
      data: { deliverables: [...keepDeliverables(ctx.project), { id: undefined, title, done: false, doneAt: null }] },
    });
    revalidateProjects(id);
  }
  back(id);
}

export async function toggleDeliverable(formData: FormData) {
  const id = Number(formData.get("projectId") || 0);
  const rowId = text(formData, "rowId");
  const ctx = id && rowId ? await loadEditable(id) : null;
  if (!ctx) return;
  const rows = keepDeliverables(ctx.project).map((r) => (r.id === rowId ? { ...r, done: !r.done, doneAt: r.done ? null : new Date().toISOString() } : r));
  await ctx.payload.update({ collection: "projects", id, data: { deliverables: rows } });
  revalidateProjects(id);
  back(id);
}

export async function removeDeliverable(formData: FormData) {
  const id = Number(formData.get("projectId") || 0);
  const rowId = text(formData, "rowId");
  const ctx = id && rowId ? await loadEditable(id) : null;
  if (!ctx) return;
  await ctx.payload.update({ collection: "projects", id, data: { deliverables: keepDeliverables(ctx.project).filter((r) => r.id !== rowId) } });
  revalidateProjects(id);
  back(id);
}

export async function addProjectLog(formData: FormData) {
  const id = Number(formData.get("projectId") || 0);
  const ctx = id ? await loadEditable(id) : null;
  if (!ctx) return;
  const note = text(formData, "note");
  if (note) {
    const type = pick(projectLogTypes, text(formData, "type")) ?? "catatan";
    // A meeting written up the next day keeps the day it happened.
    const date = dateOrNull(text(formData, "date"));
    await ctx.payload.update({ collection: "projects", id, data: { log: withLog(ctx.project, type, note, date) } });
    revalidateProjects(id);
  }
  back(id);
}

export async function addProjectDocument(formData: FormData) {
  const id = Number(formData.get("projectId") || 0);
  const ctx = id ? await loadEditable(id) : null;
  if (!ctx) return;
  const file = formData.get("file");
  const kind = pick(projectDocumentKinds, text(formData, "kind")) ?? "lainnya";
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_UPLOAD_BYTES) redirect(`/projects/${id}?error=berkas`);
  try {
    const uploaded = await uploadFile(ctx.payload, "documents", { unit: ctx.project.unit }, file);
    await ctx.payload.update({
      collection: "projects",
      id,
      data: { documents: [...keepDocumentRows(ctx.project.documents), { id: undefined, kind, file: uploaded.id, note: text(formData, "note") || null }] },
    });
  } catch (error) {
    console.error("addProjectDocument failed:", error);
    redirect(`/projects/${id}?error=berkas`);
  }
  revalidateProjects(id);
  back(id);
}

export async function removeProjectDocument(formData: FormData) {
  const id = Number(formData.get("projectId") || 0);
  const rowId = text(formData, "rowId");
  const ctx = id && rowId ? await loadEditable(id) : null;
  if (!ctx) return;
  const rows = keepDocumentRows(ctx.project.documents);
  const gone = rows.find((r) => r.id === rowId);
  if (!gone) return;
  await ctx.payload.update({ collection: "projects", id, data: { documents: rows.filter((r) => r.id !== rowId) } });
  await ctx.payload.delete({ collection: "documents", id: gone.file }).catch(() => undefined);
  revalidateProjects(id);
  back(id);
}
