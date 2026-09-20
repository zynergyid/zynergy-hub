"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { HubEvent, Project } from "@/payload-types";
import { getPayloadClient } from "@/lib/payload";
import { canEditTeam, getSessionUser } from "@/lib/session";
import { dateOrNull, pick, text } from "@/lib/form-data";
import { contentPlatforms, contentStatuses, eventKinds } from "@/lib/options";
import { fromLocalInput } from "@/lib/calendar-dates";
import { formatDate } from "@/lib/format";
import { MAX_PHOTO_BYTES, MAX_PHOTO_MESSAGE } from "@/lib/limits";
import { uploadFile } from "@/lib/uploads";

export interface EventFormState {
  status: "idle" | "success" | "error";
  message?: string;
  id?: number;
}
const err = (message: string): EventFormState => ({ status: "error", message });
const idOrNull = (v: string) => (Number(v) > 0 ? Number(v) : null);
/** Browsers submit textarea line breaks as CRLF; Markdown and the project log expect LF. */
const multiline = (fd: FormData, key: string) => text(fd, key).replace(/\r\n?/g, "\n");
const relId = (v: number | { id: number } | null | undefined) => (typeof v === "object" && v ? v.id : (v ?? null));

function revalidate(id?: number) {
  revalidatePath("/calendar");
  revalidatePath("/");
  if (id) revalidatePath(`/calendar/${id}`);
}
function back(id: number): never {
  revalidate(id);
  redirect(`/calendar/${id}`);
}

/** Load an event the current person may change; null otherwise. */
async function loadEditable(id: number) {
  const user = await getSessionUser();
  if (!user || !canEditTeam(user)) return null;
  const payload = await getPayloadClient();
  const event = await payload.findByID({ collection: "events", id, depth: 0, disableErrors: true });
  return event ? { user, payload, event } : null;
}

export async function saveEvent(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  const user = await getSessionUser();
  if (!user) return err("Sesi habis, login lagi.");
  if (!canEditTeam(user)) return err("Peran Anda hanya bisa melihat.");
  const id = idOrNull(text(formData, "id"));
  const title = text(formData, "title");
  // The full form sends datetime-local values; the quick dialog sends a date plus times.
  const day = text(formData, "date");
  const startAt = fromLocalInput(text(formData, "startAt") || (day ? `${day}T${text(formData, "startTime") || "10:00"}` : ""));
  const endAt = fromLocalInput(text(formData, "endAt") || (day && text(formData, "endTime") ? `${day}T${text(formData, "endTime")}` : ""));
  if (!title) return err("Judul wajib diisi.");
  if (!startAt) return err("Waktu mulai wajib diisi.");
  if (endAt && endAt < startAt) return err("Waktu selesai harus setelah mulai.");
  const kind = pick(eventKinds, text(formData, "kind")) ?? "rapat-tim";
  const post = kind === "konten";
  const data = {
    title,
    kind,
    startAt,
    endAt: post ? null : endAt,
    location: post ? null : text(formData, "location") || null,
    content: post
      ? { platform: pick(contentPlatforms, text(formData, "platform")) ?? "instagram", status: pick(contentStatuses, text(formData, "status")) ?? "ide", designUrl: text(formData, "designUrl") || null, postUrl: text(formData, "postUrl") || null }
      : { platform: null, status: null, designUrl: null, postUrl: null },
    participants: formData.getAll("participants").map(Number).filter((n) => n > 0),
    client: idOrNull(text(formData, "client")),
    project: idOrNull(text(formData, "project")),
    prospect: idOrNull(text(formData, "prospect")),
  };
  try {
    const payload = await getPayloadClient();
    if (id) {
      await payload.update({ collection: "events", id, data });
      revalidate(id);
      return { status: "success", id };
    }
    // Notes and follow-ups typed while creating, so a meeting is one save, not three screens.
    const notes = multiline(formData, "notes");
    const texts = formData.getAll("fuText").map(String);
    const owners = formData.getAll("fuOwner").map(String);
    const dues = formData.getAll("fuDue").map(String);
    const followUps = texts
      .map((t, i) => ({ text: t.trim(), owner: idOrNull(owners[i] ?? ""), dueAt: dateOrNull(dues[i] ?? ""), doneAt: null }))
      .filter((f) => f.text);
    const photo = formData.get("photo");
    let photoId: number | null = null;
    if (photo instanceof File && photo.size > 0) {
      if (!photo.type.startsWith("image/")) return err("Foto harus berupa gambar.");
      if (photo.size > MAX_PHOTO_BYTES) return err(MAX_PHOTO_MESSAGE);
      photoId = (await uploadFile(payload, "event-photos", {}, photo)).id;
    }
    const created = await payload.create({ collection: "events", data: { ...data, photo: photoId, agenda: multiline(formData, "agenda") || null, notes: notes || null, followUps, createdBy: user.id } });
    await mirrorToProjectLog(payload, created, notes);
    revalidate(created.id);
    return { status: "success", id: created.id };
  } catch (error) {
    console.error("saveEvent failed:", error);
    return err("Gagal menyimpan. Periksa tautan klien atau proyek, lalu coba lagi.");
  }
}

export async function deleteEvent(formData: FormData) {
  const id = Number(formData.get("id") || 0);
  const ctx = id ? await loadEditable(id) : null;
  if (!ctx) return;
  await ctx.payload.delete({ collection: "events", id });
  revalidate();
  redirect("/calendar");
}

/**
 * Meeting notes mirror into the linked project's log as a "Pertemuan" entry
 * (what /brief reads), updated in place on every rewrite.
 */
async function mirrorToProjectLog(payload: Awaited<ReturnType<typeof getPayloadClient>>, event: HubEvent, notes: string) {
  const projectId = relId(event.project);
  if (!projectId || !notes.trim()) return;
  const project = await payload.findByID({ collection: "projects", id: projectId, depth: 0, disableErrors: true });
  if (!project) return;
  const note = `${event.title}, ${formatDate(event.startAt)}\n\n${notes.trim()}`;
  const rows: NonNullable<Project["log"]> = (project.log ?? []).map((r) => ({ ...r }));
  const existing = event.projectLogId ? rows.find((r) => r.id === event.projectLogId) : undefined;
  if (existing) existing.note = note;
  else rows.push({ date: event.startAt, type: "pertemuan", note });
  const before = new Set((project.log ?? []).map((r) => r.id));
  const updated = await payload.update({ collection: "projects", id: projectId, data: { log: rows } });
  if (!existing) {
    const added = (updated.log ?? []).find((r) => r.id && !before.has(r.id));
    if (added?.id) await payload.update({ collection: "events", id: event.id, data: { projectLogId: added.id } });
  }
  revalidatePath(`/projects/${projectId}`);
}

export async function saveNotes(formData: FormData) {
  const id = Number(formData.get("eventId") || 0);
  const ctx = id ? await loadEditable(id) : null;
  if (!ctx) return;
  const notes = multiline(formData, "notes");
  await ctx.payload.update({ collection: "events", id, data: { agenda: multiline(formData, "agenda") || null, notes: notes || null } });
  await mirrorToProjectLog(ctx.payload, ctx.event, notes);
  back(id);
}

const rowsOf = (event: HubEvent) => (event.followUps ?? []).map((r) => ({ ...r }));

export async function addFollowUp(formData: FormData) {
  const id = Number(formData.get("eventId") || 0);
  const ctx = id ? await loadEditable(id) : null;
  if (!ctx) return;
  const what = text(formData, "text");
  if (!what) back(id);
  const rows = rowsOf(ctx.event);
  rows.push({ text: what, owner: idOrNull(text(formData, "owner")), dueAt: dateOrNull(text(formData, "dueAt")), doneAt: null });
  await ctx.payload.update({ collection: "events", id, data: { followUps: rows } });
  back(id);
}

/** Tick or untick one follow-up; `returnTo` lets the dashboard and a later meeting act on it. */
export async function toggleFollowUp(formData: FormData) {
  const id = Number(formData.get("eventId") || 0);
  const rowId = text(formData, "rowId");
  const ctx = id && rowId ? await loadEditable(id) : null;
  if (!ctx) return;
  const rows = rowsOf(ctx.event);
  const row = rows.find((r) => r.id === rowId);
  if (row) {
    row.doneAt = row.doneAt ? null : new Date().toISOString();
    await ctx.payload.update({ collection: "events", id, data: { followUps: rows } });
  }
  const returnTo = text(formData, "returnTo");
  revalidate(id);
  if (returnTo.startsWith("/")) {
    revalidatePath(returnTo);
    redirect(returnTo);
  }
  redirect(`/calendar/${id}`);
}

export async function removeFollowUp(formData: FormData) {
  const id = Number(formData.get("eventId") || 0);
  const rowId = text(formData, "rowId");
  const ctx = id && rowId ? await loadEditable(id) : null;
  if (!ctx) return;
  await ctx.payload.update({ collection: "events", id, data: { followUps: rowsOf(ctx.event).filter((r) => r.id !== rowId) } });
  back(id);
}

export type PhotoResult = { status: "ok" } | { status: "error"; message: string };

/** Replaces the event's single photo; the old file is deleted so Blob never keeps orphans. */
export async function setEventPhoto(formData: FormData): Promise<PhotoResult> {
  const id = Number(formData.get("eventId") || 0);
  const ctx = id ? await loadEditable(id) : null;
  if (!ctx) return { status: "error", message: "Tidak punya akses ke acara ini." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0 || !file.type.startsWith("image/")) return { status: "error", message: "Pilih berkas gambar." };
  if (file.size > MAX_PHOTO_BYTES) return { status: "error", message: MAX_PHOTO_MESSAGE };
  try {
    const uploaded = await uploadFile(ctx.payload, "event-photos", {}, file);
    const previous = relId(ctx.event.photo);
    await ctx.payload.update({ collection: "events", id, data: { photo: uploaded.id } });
    if (previous) await ctx.payload.delete({ collection: "event-photos", id: previous }).catch(() => undefined);
  } catch (error) {
    console.error("setEventPhoto failed:", error);
    return { status: "error", message: "Gagal mengunggah foto. Coba lagi." };
  }
  revalidate(id);
  return { status: "ok" };
}

export async function removeEventPhoto(formData: FormData) {
  const id = Number(formData.get("eventId") || 0);
  const ctx = id ? await loadEditable(id) : null;
  if (!ctx) return;
  const previous = relId(ctx.event.photo);
  await ctx.payload.update({ collection: "events", id, data: { photo: null } });
  if (previous) await ctx.payload.delete({ collection: "event-photos", id: previous }).catch(() => undefined);
  back(id);
}
