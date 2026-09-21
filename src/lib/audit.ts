import { cache } from "react";
import { headers } from "next/headers";
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig, Field, GlobalAfterChangeHook, Payload, PayloadRequest } from "payload";
import { units, type Unit } from "@/lib/options";

/**
 * Audit trail. Every audited collection gets `auditHooks(...)`; they write one
 * row to `activity` per create, update, or delete, with the changed fields
 * (from and to, labelled) so a person can read what happened without opening
 * the record. Rows are also written by the login route and the Excel exports.
 *
 * Who did it: REST requests carry `req.user`; server actions use the Local
 * API with no user, so the actor is resolved from the request cookie via
 * `next/headers`, cached per request. Outside a request (scripts, cron) the
 * actor is null and shows as "sistem".
 */
export type AuditAction = "create" | "update" | "delete" | "login" | "export" | "view";
export interface AuditChange {
  field: string;
  label: string;
  from: string | null;
  to: string | null;
}

/** Fields never diffed or shown: secrets, counters, and timestamps the system moves on its own. */
const IGNORED = new Set(["id", "createdAt", "updatedAt", "password", "salt", "hash", "loginAttempts", "lockUntil", "sessions", "resetPasswordToken", "resetPasswordExpiration", "apiKeyIndex", "lastLoginAt", "lastSeenAt", "projectLogId", "createdBy"]);
/** Shown as changed, never with their value. */
const SECRET = new Set(["apiKey", "calendarToken", "enableAPIKey", "passwordEnc"]);

const idr = new Intl.NumberFormat("id-ID");
const dateFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
const dateTimeFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Jakarta" });
const MONEY_FIELDS = new Set(["amount", "unitPrice", "subtotal", "value", "annualFee"]);

/** The person behind the current request, resolved once per request. */
export const actorFromHeaders = cache(async (payload: Payload) => {
  try {
    const { user } = await payload.auth({ headers: await headers() });
    return user ? { id: user.id, name: user.name } : null;
  } catch {
    return null;
  }
});

async function resolveActor(req: PayloadRequest): Promise<{ id: number; name: string } | null> {
  const u = req.user as { id?: number; name?: string } | null;
  if (u?.id && u.name) return { id: u.id, name: u.name };
  return actorFromHeaders(req.payload);
}

type Labeler = (field: string, value: unknown) => string | null | undefined;

function flatten(fields: Field[], prefix = ""): Map<string, Field> {
  const map = new Map<string, Field>();
  for (const f of fields) {
    if ("fields" in f && (f.type === "row" || f.type === "collapsible")) {
      for (const [k, v] of flatten(f.fields, prefix)) map.set(k, v);
    } else if ("name" in f && f.name) {
      map.set(prefix + f.name, f);
      if (f.type === "group" && "fields" in f) for (const [k, v] of flatten(f.fields, `${prefix}${f.name}.`)) map.set(k, v);
    }
  }
  return map;
}

function fieldLabel(field: Field | undefined, name: string): string {
  const l = field && "label" in field ? field.label : undefined;
  return typeof l === "string" ? l : name;
}

function optionLabel(field: Field | undefined, value: unknown): string | null {
  if (!field || (field.type !== "select" && field.type !== "radio")) return null;
  const o = field.options.find((x) => (typeof x === "string" ? x : x.value) === value);
  if (!o) return null;
  const l = typeof o === "string" ? o : o.label;
  return typeof l === "string" ? l : String(value);
}

function show(field: Field | undefined, name: string, value: unknown, labeler?: Labeler): string | null {
  if (value === null || value === undefined || value === "") return null;
  const custom = labeler?.(name, value);
  if (custom) return custom;
  if (field?.type === "upload") return "ada";
  const opt = optionLabel(field, value);
  if (opt) return opt;
  if (typeof value === "boolean") return value ? "ya" : "tidak";
  if (typeof value === "number") return MONEY_FIELDS.has(name.split(".").pop() ?? "") ? `Rp ${idr.format(value)}` : idr.format(value);
  if (typeof value === "object") {
    if (Array.isArray(value)) return `${value.length} baris`;
    const o = value as { id?: unknown; name?: unknown; title?: unknown; company?: unknown; number?: unknown };
    return String(o.name ?? o.title ?? o.company ?? o.number ?? (o.id !== undefined ? `#${o.id}` : "diisi"));
  }
  const s = String(value);
  if (field?.type === "date" || /^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return (field && "admin" in field && (field.admin as { date?: { pickerAppearance?: string } })?.date?.pickerAppearance === "dayAndTime" ? dateTimeFmt : dateFmt).format(d);
  }
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
}

/** Relationships may arrive populated on one side and as ids on the other; compare ids. Array rows keep their (string) ids and fields. */
const norm = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(norm);
  if (typeof v === "object" && v !== null && "id" in v && typeof (v as { id: unknown }).id === "number") return (v as { id: unknown }).id;
  if (typeof v === "object" && v !== null) {
    const { updatedAt, createdAt, ...rest } = v as Record<string, unknown>;
    void updatedAt;
    void createdAt;
    return Object.fromEntries(Object.entries(rest).map(([k, x]) => [k, norm(x)]));
  }
  return v;
};

/** Field-by-field diff of two documents, readable and capped. */
export function diffDocs(fields: Field[], before: Record<string, unknown> | undefined, after: Record<string, unknown>, labeler?: Labeler, prefix = ""): AuditChange[] {
  const defs = flatten(fields);
  const out: AuditChange[] = [];
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after)]);
  for (const key of keys) {
    const name = prefix + key;
    if (IGNORED.has(key) || key.startsWith("_")) continue;
    const a = before?.[key];
    const b = after[key];
    const def = defs.get(name);
    if (def?.type === "group" && typeof b === "object" && b && !Array.isArray(b)) {
      out.push(...diffDocs(fields, (a ?? {}) as Record<string, unknown>, b as Record<string, unknown>, labeler, `${name}.`));
      continue;
    }
    if (SECRET.has(key)) {
      if (JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)) out.push({ field: name, label: fieldLabel(def, key), from: a ? "tersembunyi" : null, to: b ? "tersembunyi" : null });
      continue;
    }
    if (JSON.stringify(norm(a) ?? null) === JSON.stringify(norm(b) ?? null)) continue;
    if (Array.isArray(a) || Array.isArray(b)) {
      const la = Array.isArray(a) ? a.length : 0;
      const lb = Array.isArray(b) ? b.length : 0;
      out.push({ field: name, label: fieldLabel(def, key), from: `${la} baris`, to: la === lb ? `${lb} baris, isinya berubah` : `${lb} baris` });
      continue;
    }
    out.push({ field: name, label: fieldLabel(def, key), from: show(def, name, a, labeler), to: show(def, name, b, labeler) });
    if (out.length >= 12) break;
  }
  return out;
}

export interface AuditRow {
  action: AuditAction;
  collection: string;
  docId?: number | null;
  title: string;
  summary?: string | null;
  changes?: AuditChange[];
  unit?: string | null;
  actor?: { id: number; name: string } | null;
}

/** Writes one activity row; never throws, so a logging problem cannot block the real change. */
export async function logActivity(payload: Payload, row: AuditRow, req?: PayloadRequest): Promise<void> {
  try {
    await payload.create({
      collection: "activity",
      data: { action: row.action, collection: row.collection, docId: row.docId ?? null, title: row.title, summary: row.summary ?? null, changes: row.changes ?? [], unit: units.some((u) => u.value === row.unit) ? (row.unit as Unit) : null, actor: row.actor?.id ?? null, actorName: row.actor?.name ?? "sistem" },
      req,
      context: { skipAudit: true },
    });
  } catch (error) {
    console.error("logActivity failed:", error);
  }
}

const summarize = (changes: AuditChange[]) =>
  changes
    .slice(0, 3)
    .map((c) => (c.from && c.to ? `${c.label}: ${c.from} menjadi ${c.to}` : c.to ? `${c.label}: ${c.to}` : `${c.label} dikosongkan`))
    .join(" · ");

/**
 * Hooks for one collection. `title` names the record for people; `labeler`
 * maps raw values to words where the field config cannot (relationships).
 */
export function auditHooks(opts: { title: (doc: Record<string, unknown>) => string; unit?: (doc: Record<string, unknown>) => string | null | undefined; labeler?: Labeler }): Pick<NonNullable<CollectionConfig["hooks"]>, "afterChange" | "afterDelete"> {
  const afterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req, collection, context }) => {
    if (context?.skipAudit) return doc;
    const changes = operation === "update" ? diffDocs(collection.fields, previousDoc as Record<string, unknown>, doc as Record<string, unknown>, opts.labeler) : [];
    // A save that changed nothing a person cares about (touched timestamps only) is not an event.
    if (operation === "update" && changes.length === 0) return doc;
    await logActivity(req.payload, { action: operation === "create" ? "create" : "update", collection: collection.slug, docId: doc.id, title: opts.title(doc as Record<string, unknown>), summary: operation === "update" ? summarize(changes) : null, changes, unit: opts.unit?.(doc as Record<string, unknown>) ?? null, actor: await resolveActor(req) }, req);
    return doc;
  };
  const afterDelete: CollectionAfterDeleteHook = async ({ doc, req, collection, context }) => {
    if (context?.skipAudit) return doc;
    await logActivity(req.payload, { action: "delete", collection: collection.slug, docId: doc.id, title: opts.title(doc as Record<string, unknown>), unit: opts.unit?.(doc as Record<string, unknown>) ?? null, actor: await resolveActor(req) }, req);
    return doc;
  };
  return { afterChange: [afterChange], afterDelete: [afterDelete] };
}

/** Same for a global: one row per save with the toggles that flipped. */
export function auditGlobalHook(title: string): GlobalAfterChangeHook {
  return async ({ doc, previousDoc, req, global, context }) => {
    if (context?.skipAudit) return doc;
    const changes = diffDocs(global.fields, previousDoc as Record<string, unknown>, doc as Record<string, unknown>);
    if (changes.length === 0) return doc;
    await logActivity(req.payload, { action: "update", collection: global.slug, title, summary: summarize(changes), changes, actor: await resolveActor(req) }, req);
    return doc;
  };
}
