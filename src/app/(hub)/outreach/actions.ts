"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prospect } from "@/payload-types";
import { getPayloadClient } from "@/lib/payload";
import { canEditClients, getSessionUser } from "@/lib/session";
import { canWriteUnit } from "@/lib/access";
import { dateOrNull, pick, text } from "@/lib/form-data";
import { followUpDays, outreachChannels, sectorOptions, businessTypes, prospectSources, prospectStatuses, units, type ProspectStatus, clientKinds } from "@/lib/options";

export interface ProspectFormState {
  status: "idle" | "success" | "error";
  message?: string;
  id?: number;
}

const err = (message: string): ProspectFormState => ({ status: "error", message });
const str = (v: unknown) => String(v ?? "").trim();
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const plusDays = (from: Date, days: number) => new Date(from.getTime() + days * 86400000).toISOString();

type LogEntry = NonNullable<Prospect["log"]>[number];
const keepLog = (p: Prospect): LogEntry[] => (p.log ?? []).map((l) => ({ id: l.id ?? undefined, date: l.date, type: l.type, note: l.note ?? null }));
const withLog = (p: Prospect, type: LogEntry["type"], note?: string | null): LogEntry[] => [
  ...keepLog(p),
  { id: undefined, date: new Date().toISOString(), type, note: note || null },
];

function revalidateOutreach(id?: number) {
  revalidatePath("/outreach");
  revalidatePath("/");
  if (id) revalidatePath(`/outreach/${id}`);
}

/** Load a target the current person may change; null otherwise. */
async function loadEditable(id: number) {
  const user = await getSessionUser();
  if (!user) return null;
  const payload = await getPayloadClient();
  const prospect = await payload.findByID({ collection: "prospects", id, depth: 0, disableErrors: true });
  if (!prospect || !canWriteUnit(user, prospect.unit, "editClients")) return null;
  return { user, payload, prospect };
}

export async function saveProspect(_prev: ProspectFormState, formData: FormData): Promise<ProspectFormState> {
  const user = await getSessionUser();
  if (!user) return err("Sesi habis, login lagi.");
  if (!canEditClients(user)) return err("Peran Anda hanya bisa melihat.");
  const id = Number(formData.get("id") || 0) || null;
  const unit = pick(units, text(formData, "unit")) ?? "supply";
  if (!canWriteUnit(user, unit, "editClients")) return err("Anda tidak punya akses ke unit ini.");
  const kind = pick(clientKinds, text(formData, "kind")) ?? "usaha";
  const company = text(formData, "company");
  if (!company) return err(kind === "perorangan" ? "Nama wajib diisi." : "Nama usaha wajib diisi.");
  const clientId = Number(text(formData, "client")) || null;

  let raw: unknown;
  try {
    raw = JSON.parse(text(formData, "contacts") || "[]");
  } catch {
    return err("Data kontak tidak valid.");
  }
  if (!Array.isArray(raw)) return err("Data kontak tidak valid.");
  const contacts = [];
  for (const [i, c] of (raw as Record<string, unknown>[]).entries()) {
    const name = str(c.name);
    const email = str(c.email);
    if (!name) return err(`Kontak ${i + 1}: nama wajib diisi.`);
    if (email && !isEmail(email)) return err(`Kontak ${i + 1}: format email tidak valid.`);
    contacts.push({ name, role: str(c.role) || null, email: email || null, phone: str(c.phone).replace(/[^\d+]/g, "") || null, linkedin: str(c.linkedin) || null });
  }

  try {
    const payload = await getPayloadClient();
    let existing: Prospect | null = null;
    if (id) {
      existing = await payload.findByID({ collection: "prospects", id, depth: 0, disableErrors: true });
      if (!existing || !canWriteUnit(user, existing.unit, "editClients")) return err("Target tidak ditemukan atau di luar unit Anda.");
    }
    if (clientId) {
      const client = await payload.findByID({ collection: "clients", id: clientId, depth: 0, disableErrors: true });
      if (!client || client.unit !== unit) return err("Klien yang dipilih tidak ada di unit ini.");
    }
    const source = pick(prospectSources, text(formData, "source")) ?? (clientId ? ("klien-lama" as const) : null);
    const data = {
      unit,
      kind,
      company,
      client: clientId,
      sector: pick(sectorOptions, text(formData, "sector")) ?? null,
      city: text(formData, "city") || null,
      source,
      website: text(formData, "website") || null,
      linkedin: text(formData, "linkedin") || null,
      googleProfile: unit === "supply" ? null : text(formData, "googleProfile") || null,
      instagram: unit === "supply" ? null : text(formData, "instagram") || null,
      contacts,
      history: text(formData, "history") || null,
      notes: text(formData, "notes") || null,
    };
    const doc = id
      ? await payload.update({ collection: "prospects", id, data })
      : await payload.create({ collection: "prospects", data: { ...data, owner: user.id, status: "baru" } });
    revalidateOutreach(doc.id);
    return { status: "success", id: doc.id };
  } catch (error) {
    console.error("saveProspect failed:", error);
    return err("Gagal menyimpan. Coba lagi.");
  }
}

export async function deleteProspect(formData: FormData) {
  const id = Number(formData.get("id") || 0);
  if (!id) return;
  const ctx = await loadEditable(id);
  if (!ctx) return;
  await ctx.payload.delete({ collection: "prospects", id });
  revalidateOutreach();
  redirect("/outreach");
}

/** Research text written by hand (the skill writes it through REST). */
export async function saveResearch(formData: FormData) {
  const id = Number(formData.get("id") || 0);
  const ctx = id ? await loadEditable(id) : null;
  if (!ctx) return;
  const research = text(formData, "research");
  const status: ProspectStatus = ctx.prospect.status === "baru" && research ? "riset" : ctx.prospect.status;
  await ctx.payload.update({
    collection: "prospects",
    id,
    data: { research: research || null, researchedAt: research ? new Date().toISOString() : null, status, log: withLog(ctx.prospect, "riset", "Riset disimpan") },
  });
  revalidateOutreach(id);
  redirect(`/outreach/${id}`);
}

export async function saveDraft(formData: FormData) {
  const id = Number(formData.get("id") || 0);
  const ctx = id ? await loadEditable(id) : null;
  if (!ctx) return;
  const draft = text(formData, "draft");
  const moves = ctx.prospect.status === "baru" || ctx.prospect.status === "riset";
  await ctx.payload.update({
    collection: "prospects",
    id,
    data: {
      draft: draft || null,
      draftSubject: text(formData, "draftSubject") || null,
      draftChannel: pick(outreachChannels, text(formData, "draftChannel")) ?? null,
      status: draft && moves ? "draf" : ctx.prospect.status,
      log: withLog(ctx.prospect, "draf", "Draf disimpan"),
    },
  });
  revalidateOutreach(id);
  redirect(`/outreach/${id}`);
}

/** The person sent the message themselves; schedule the first nudge. */
export async function markSent(formData: FormData) {
  const id = Number(formData.get("id") || 0);
  const ctx = id ? await loadEditable(id) : null;
  if (!ctx) return;
  const channel = pick(outreachChannels, text(formData, "channel")) ?? ctx.prospect.draftChannel ?? "email";
  const sentAt = dateOrNull(text(formData, "date")) ?? new Date().toISOString();
  await ctx.payload.update({
    collection: "prospects",
    id,
    data: {
      status: "terkirim",
      lastSentAt: sentAt,
      sentChannel: channel,
      nextFollowUpAt: plusDays(new Date(sentAt), followUpDays(ctx.prospect.kind)),
      followUpCount: 0,
      log: withLog(ctx.prospect, "kirim", `Dikirim via ${channel}${text(formData, "note") ? `: ${text(formData, "note")}` : ""}`),
    },
  });
  revalidateOutreach(id);
  redirect(`/outreach/${id}`);
}

export async function logFollowUp(formData: FormData) {
  const id = Number(formData.get("id") || 0);
  const ctx = id ? await loadEditable(id) : null;
  if (!ctx) return;
  await ctx.payload.update({
    collection: "prospects",
    id,
    data: {
      followUpCount: (ctx.prospect.followUpCount ?? 0) + 1,
      nextFollowUpAt: plusDays(new Date(), followUpDays(ctx.prospect.kind)),
      log: withLog(ctx.prospect, "tindak-lanjut", text(formData, "note")),
    },
  });
  revalidateOutreach(id);
  redirect(`/outreach/${id}`);
}

export async function logReply(formData: FormData) {
  const id = Number(formData.get("id") || 0);
  const ctx = id ? await loadEditable(id) : null;
  if (!ctx) return;
  await ctx.payload.update({
    collection: "prospects",
    id,
    data: { status: "dibalas", repliedAt: new Date().toISOString(), nextFollowUpAt: null, log: withLog(ctx.prospect, "balasan", text(formData, "note")) },
  });
  revalidateOutreach(id);
  redirect(`/outreach/${id}`);
}

export async function setProspectStatus(formData: FormData) {
  const id = Number(formData.get("id") || 0);
  const ctx = id ? await loadEditable(id) : null;
  if (!ctx) return;
  const status = pick(prospectStatuses, text(formData, "status"));
  if (!status) return;
  await ctx.payload.update({
    collection: "prospects",
    id,
    data: {
      status,
      ...(status === "berhenti" || status === "klien" ? { nextFollowUpAt: null } : {}),
      log: withLog(ctx.prospect, "status", `Status: ${status}${text(formData, "note") ? `. ${text(formData, "note")}` : ""}`),
    },
  });
  revalidateOutreach(id);
  redirect(`/outreach/${id}`);
}

export async function addNote(formData: FormData) {
  const id = Number(formData.get("id") || 0);
  const ctx = id ? await loadEditable(id) : null;
  if (!ctx) return;
  const note = text(formData, "note");
  if (!note) redirect(`/outreach/${id}`);
  await ctx.payload.update({ collection: "prospects", id, data: { log: withLog(ctx.prospect, "catatan", note) } });
  revalidateOutreach(id);
  redirect(`/outreach/${id}`);
}

/** A won target becomes a Supply client; the target keeps pointing at it. */
export async function convertToClient(formData: FormData) {
  const id = Number(formData.get("id") || 0);
  const ctx = id ? await loadEditable(id) : null;
  if (!ctx) return;
  const p = ctx.prospect;
  const existing = typeof p.client === "number" ? p.client : typeof p.client === "object" && p.client ? p.client.id : null;
  if (existing) {
    // Already linked (reactivation): no second client record, just the status.
    await ctx.payload.update({ collection: "prospects", id, data: { status: "klien", nextFollowUpAt: null, log: withLog(p, "status", "Jadi klien (klien lama diaktifkan lagi)") } });
    revalidateOutreach(id);
    revalidatePath(`/clients/${existing}`);
    redirect(`/clients/${existing}`);
  }
  const c = (p.contacts ?? []).find((x) => x.phone) ?? (p.contacts ?? [])[0];
  const supply = p.unit === "supply";
  // Digitalin and Apps clients must have a WhatsApp number (the collection validates it); say so instead of crashing.
  if (!supply && !c?.phone) redirect(`/outreach/${id}?butuh=whatsapp`);
  const client = await ctx.payload.create({
    collection: "clients",
    data: {
      unit: p.unit,
      kind: p.kind ?? "usaha",
      name: p.company,
      owner: c && p.kind !== "perorangan" ? `${c.name}${c.role ? ` (${c.role})` : ""}` : null,
      whatsapp: c?.phone ?? null,
      email: c?.email ?? null,
      city: p.city ?? null,
      // The sector answer is already a client business type for Digitalin and Apps.
      businessType: supply ? "industri" : (businessTypes.find((b) => b.value === p.sector)?.value ?? "lainnya"),
      status: "aktif",
      links: { website: p.website ?? null },
      supply: supply ? { legalName: p.company, paymentTermsDays: 30 } : undefined,
      notes: p.research ? `Dari outreach. Riset:\n${p.research}` : "Dari outreach.",
    },
  });
  await ctx.payload.update({
    collection: "prospects",
    id,
    data: { status: "klien", client: client.id, nextFollowUpAt: null, log: withLog(p, "status", "Jadi klien") },
  });
  revalidateOutreach(id);
  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

/** From a client page: open an outreach target prefilled from the client, linked to it. */
export async function startOutreachFromClient(formData: FormData) {
  const user = await getSessionUser();
  if (!user || !canEditClients(user)) return;
  const clientId = Number(formData.get("clientId") || 0);
  if (!clientId) return;
  const payload = await getPayloadClient();
  const client = await payload.findByID({ collection: "clients", id: clientId, depth: 0, disableErrors: true });
  if (!client || !canWriteUnit(user, client.unit, "editClients")) return;
  const prospect = await payload.create({
    collection: "prospects",
    data: {
      unit: client.unit,
      kind: client.kind ?? "usaha",
      company: client.name,
      client: client.id,
      city: client.city ?? null,
      website: client.links?.website ?? null,
      googleProfile: client.links?.googleProfile ?? null,
      instagram: client.links?.instagram ?? null,
      sector: businessTypes.find((b) => b.value === client.businessType)?.value ?? null,
      source: "klien-lama",
      contacts: client.owner ? [{ name: client.owner, role: null, email: client.email ?? null, phone: client.whatsapp ?? null, linkedin: null }] : [],
      status: "baru",
      owner: user.id,
      history: client.notes ? `Catatan klien: ${client.notes}` : null,
      notes: "Dibuat dari halaman klien.",
    },
  });
  revalidateOutreach(prospect.id);
  revalidatePath(`/clients/${clientId}`);
  redirect(`/outreach/${prospect.id}`);
}
