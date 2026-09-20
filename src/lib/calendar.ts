import type { HubEvent } from "@/payload-types";
import { getPayloadClient } from "@/lib/payload";
import type { SessionUser } from "@/lib/session";
import { has } from "@/lib/access";
import { contentPlatformLabel, contentStatusLabel, eventKindLabel, openProjectStages, openProspectStatuses, type Unit } from "@/lib/options";
import { unitsOf } from "@/lib/access";
import { capsOf } from "@/lib/grants-cache";
import { loadGrants } from "@/lib/permissions";
import { getUserOptions, toProjectOption } from "@/lib/projects";
import { dateKeyWib, todayWib, wibParts } from "@/lib/calendar-dates";

export { dateKeyWib, todayWib };

/**
 * The calendar is a view, not a store: hand-made events live in `events`,
 * every other date stays in its own module and is read here in place.
 */
export type { CalendarItem, CalendarLayer } from "@/lib/calendar-types";
export { allLayers, calendarLayers, isLayer, layerOf } from "@/lib/calendar-types";
import { allLayers, type CalendarItem, type CalendarLayer } from "@/lib/calendar-types";

const relId = (v: number | { id: number } | null | undefined) => (typeof v === "object" && v ? v.id : (v ?? null));

export async function getCalendarItems(opts: { from: Date; to: Date; user: SessionUser; layers?: Set<CalendarLayer> }): Promise<CalendarItem[]> {
  const { from, to, user } = opts;
  const layers = opts.layers ?? allLayers;
  const payload = await getPayloadClient();
  const units = user.units;
  const between = (field: string) => ({ [field]: { greater_than_equal: from.toISOString(), less_than: to.toISOString() } });
  const tasks: Promise<CalendarItem[]>[] = [];

  if (layers.has("acara") || layers.has("konten")) {
    tasks.push(
      payload.find({ collection: "events", where: between("startAt"), limit: 500, depth: 1, sort: "startAt" }).then((r) =>
        r.docs
          .map((e) => {
            const post = e.kind === "konten";
            const detail = post ? [contentPlatformLabel.get(e.content?.platform ?? ""), contentStatusLabel.get(e.content?.status ?? "")].filter(Boolean).join(" · ") : eventKindLabel.get(e.kind);
            const photoUrl = typeof e.photo === "object" && e.photo?.url ? e.photo.url : undefined;
            return { id: `acara-${e.id}`, ...wibParts(new Date(e.startAt)), title: e.title, detail, href: `/calendar/${e.id}`, layer: (post ? "konten" : "acara") as CalendarLayer, start: e.startAt, end: e.endAt ?? undefined, status: post ? (e.content?.status ?? "ide") : undefined, photoUrl };
          })
          .filter((it) => layers.has(it.layer)),
      ),
    );
  }
  if (layers.has("proyek") && units.some((u) => u !== "supply")) {
    const base = { unit: { in: units }, stage: { in: [...openProjectStages] } };
    tasks.push(
      payload.find({ collection: "projects", where: { and: [base, between("targetDate")] }, limit: 200, depth: 0 }).then((r) =>
        r.docs.map((p) => ({ id: `proyek-target-${p.id}`, date: dateKeyWib(p.targetDate!), title: p.name, detail: "target launch", href: `/projects/${p.id}`, layer: "proyek" as const })),
      ),
      payload.find({ collection: "projects", where: { and: [base, between("nextActionAt")] }, limit: 200, depth: 0 }).then((r) =>
        r.docs.map((p) => ({ id: `proyek-next-${p.id}`, date: dateKeyWib(p.nextActionAt!), title: p.name, detail: p.nextAction || "tindakan berikutnya", href: `/projects/${p.id}`, layer: "proyek" as const })),
      ),
    );
  }
  if (layers.has("outreach")) {
    tasks.push(
      payload.find({ collection: "prospects", where: { and: [{ unit: { in: units } }, { status: { in: [...openProspectStatuses] } }, between("nextFollowUpAt")] }, limit: 200, depth: 0 }).then((r) =>
        r.docs.map((p) => ({ id: `outreach-${p.id}`, date: dateKeyWib(p.nextFollowUpAt!), title: p.company, detail: "tindak lanjut outreach", href: `/outreach/${p.id}`, layer: "outreach" as const })),
      ),
    );
  }
  if (layers.has("pesanan") && units.includes("supply")) {
    tasks.push(
      payload.find({ collection: "orders", where: { and: [{ unit: { in: units } }, { status: { in: ["diterima", "sourcing"] } }, between("deliveryDate")] }, limit: 200, depth: 0 }).then((r) =>
        r.docs.map((o) => ({ id: `pesanan-kirim-${o.id}`, date: dateKeyWib(o.deliveryDate!), title: `PO ${o.number}`, detail: "tenggat kirim", href: `/orders/${o.id}`, layer: "pesanan" as const })),
      ),
    );
    if (has(user, "viewMoney")) {
      tasks.push(
        payload.find({ collection: "orders", where: { and: [{ unit: { in: units } }, { status: { in: ["dikirim", "ditagih"] } }, between("dueDate")] }, limit: 200, depth: 0 }).then((r) =>
          r.docs.map((o) => ({ id: `pesanan-bayar-${o.id}`, date: dateKeyWib(o.dueDate!), title: `PO ${o.number}`, detail: "jatuh tempo bayar", href: `/orders/${o.id}`, layer: "pesanan" as const })),
        ),
      );
    }
  }
  if (layers.has("klien")) {
    tasks.push(
      payload.find({ collection: "clients", where: { and: [{ unit: { in: units } }, { status: { equals: "aktif" } }, between("renewalDate")] }, limit: 200, depth: 0 }).then((r) =>
        r.docs.map((c) => ({ id: `klien-${c.id}`, date: dateKeyWib(c.renewalDate!), title: c.name, detail: "perpanjangan website", href: `/clients/${c.id}`, layer: "klien" as const })),
      ),
    );
  }
  const items = (await Promise.all(tasks)).flat();
  return items.sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? ""));
}

/** Everything from today for the next `days` days, for the dashboard. */
export function getUpcoming(user: SessionUser, days = 7): Promise<CalendarItem[]> {
  const from = new Date(`${todayWib()}T00:00:00+07:00`);
  return getCalendarItems({ from, to: new Date(from.getTime() + days * 86400000), user });
}

export interface FollowUp {
  eventId: number;
  eventTitle: string;
  eventDate: string;
  rowId: string;
  text: string;
  ownerId: number | null;
  ownerName: string | null;
  dueAt: string | null;
  doneAt: string | null;
}

function flattenFollowUps(events: HubEvent[], onlyOpen: boolean): FollowUp[] {
  const rows: FollowUp[] = [];
  for (const e of events) {
    for (const f of e.followUps ?? []) {
      if (!f.id || (onlyOpen && f.doneAt)) continue;
      rows.push({
        eventId: e.id,
        eventTitle: e.title,
        eventDate: e.startAt,
        rowId: f.id,
        text: f.text,
        ownerId: relId(f.owner),
        ownerName: typeof f.owner === "object" && f.owner ? f.owner.name : null,
        dueAt: f.dueAt ?? null,
        doneAt: f.doneAt ?? null,
      });
    }
  }
  return rows.sort((a, b) => (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999"));
}

/** Open follow-ups assigned to one person, across all events. */
export async function getMyFollowUps(userId: number): Promise<FollowUp[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({ collection: "events", where: { "followUps.owner": { equals: userId } }, limit: 200, depth: 0, sort: "-startAt" });
  return flattenFollowUps(docs, true).filter((f) => f.ownerId === userId);
}

/** Open follow-ups from earlier team meetings: what the next meeting starts with. */
export async function getOpenFollowUpsBefore(event: HubEvent): Promise<FollowUp[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({ collection: "events", where: { and: [{ kind: { equals: "rapat-tim" } }, { startAt: { less_than: event.startAt } }, { id: { not_equals: event.id } }] }, limit: 20, depth: 1, sort: "-startAt" });
  return flattenFollowUps(docs, true);
}

export async function getEvent(id: number): Promise<HubEvent | null> {
  const payload = await getPayloadClient();
  return payload.findByID({ collection: "events", id, depth: 1, disableErrors: true });
}

/** Events tied to one project, client, or outreach target, newest first. */
export async function getLinkedEvents(link: { project?: number; client?: number; prospect?: number }, limit = 8): Promise<HubEvent[]> {
  const payload = await getPayloadClient();
  const [field, id] = Object.entries(link).find(([, v]) => v) ?? [];
  if (!field || !id) return [];
  const { docs } = await payload.find({ collection: "events", where: { [field]: { equals: id } }, limit, depth: 0, sort: "-startAt" });
  return docs;
}

/** Participants of the latest team meeting, to prefill the next one. */
export async function getLastMeetingParticipants(): Promise<number[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({ collection: "events", where: { kind: { equals: "rapat-tim" } }, limit: 1, depth: 0, sort: "-startAt" });
  return (docs[0]?.participants ?? []).map((p) => relId(p)).filter((v): v is number => v !== null);
}

export interface EventFormOptions {
  users: { label: string; value: string }[];
  clients: { label: string; value: string }[];
  projects: { label: string; value: string }[];
  prospects: { label: string; value: string }[];
}

/** Select options for the event form, limited to what the person may see. */
export async function getEventFormOptions(user: SessionUser): Promise<EventFormOptions> {
  const payload = await getPayloadClient();
  const units = user.units;
  const [users, clients, projects, prospects] = await Promise.all([
    getUserOptions(),
    payload.find({ collection: "clients", where: { unit: { in: units } }, limit: 300, depth: 0, sort: "name", select: { name: true } }),
    payload.find({ collection: "projects", where: { and: [{ unit: { in: units } }, { stage: { in: [...openProjectStages] } }] }, limit: 200, depth: 1, sort: "name" }),
    payload.find({ collection: "prospects", where: { and: [{ unit: { in: units } }, { status: { in: [...openProspectStatuses] } }] }, limit: 200, depth: 0, sort: "company", select: { company: true } }),
  ]);
  return {
    users: users.map((u) => ({ label: u.name, value: String(u.id) })),
    clients: clients.docs.map((c) => ({ label: c.name, value: String(c.id) })),
    projects: projects.docs.map((p) => ({ label: toProjectOption(p).label, value: String(p.id) })),
    prospects: prospects.docs.map((p) => ({ label: p.company, value: String(p.id) })),
  };
}

/** The person behind a calendar-feed token, as a session-like user; null when the token is unknown. */
export async function getUserByCalendarToken(token: string): Promise<SessionUser | null> {
  if (!/^[a-f0-9]{48}$/.test(token)) return null;
  const payload = await getPayloadClient();
  const { docs } = await payload.find({ collection: "users", where: { calendarToken: { equals: token } }, limit: 1, depth: 0 });
  const u = docs[0];
  if (!u) return null;
  await loadGrants();
  const who = { role: u.role, isAdmin: Boolean(u.isAdmin) };
  return { id: u.id, name: u.name, email: u.email, role: u.role, isAdmin: who.isAdmin, units: unitsOf(u) as Unit[], caps: capsOf(who) };
}

/** Content posts from a week ago to three weeks ahead, for the designer and marketing card. */
export async function getKontenEvents(): Promise<HubEvent[]> {
  const payload = await getPayloadClient();
  const from = new Date(`${todayWib()}T00:00:00+07:00`);
  const { docs } = await payload.find({
    collection: "events",
    where: { and: [{ kind: { equals: "konten" } }, { startAt: { greater_than_equal: new Date(from.getTime() - 7 * 86400000).toISOString() } }, { startAt: { less_than: new Date(from.getTime() + 21 * 86400000).toISOString() } }] },
    limit: 40,
    depth: 1,
    sort: "startAt",
  });
  return docs;
}
