import type { Perinti } from "@/payload-types";
import { getPayloadClient } from "@/lib/payload";
import { getLedger, getUnitMonth, resolveUnit, type UnitFilter } from "@/lib/finance";
import { MENTORS, PROGRAM, REFLECTIONS, SESSION_NUMERALS, STAGES, REPORT_INDICATORS, type ReportIndicator, type Stage } from "@/content/perintis";
import { monthRange, shiftMonth, todayWib, wibParts } from "@/lib/calendar-dates";
import type { CalendarItem } from "@/lib/calendar-types";
import { formatDate, formatIDR } from "@/lib/format";
import { contentPlatformLabel, openProjectStages, type Unit } from "@/lib/options";

export type StageStatus = "selesai" | "fokus" | "nanti";

export type StageState = { stage: Stage; status: StageStatus; daysLeft: number; toNext: number };

const wib = (date: string) => new Date(`${date}T00:00:00+07:00`).getTime();
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Which stage is done, which one the team is working toward, and how far today sits between a stage and the next one (0 to 1). */
export function stageStatuses(today = todayWib()): StageState[] {
  const t = wib(today);
  let focusFound = false;
  return STAGES.map((stage, i) => {
    const d = wib(stage.date);
    const daysLeft = Math.round((d - t) / 86400000);
    let status: StageStatus = "nanti";
    if (daysLeft < 0) status = "selesai";
    else if (!focusFound) {
      status = "fokus";
      focusFound = true;
    }
    const next = STAGES[i + 1];
    const toNext = next ? clamp01((t - d) / (wib(next.date) - d)) : 0;
    return { stage, status, daysLeft, toNext };
  });
}

/** Day number and share of the whole programme that has passed, from kick-off to the final night. */
export function programProgress(today = todayWib()): { day: number; days: number; fraction: number } {
  const start = wib(STAGES[0].date);
  const end = wib(STAGES[STAGES.length - 1].date);
  const days = Math.round((end - start) / 86400000);
  const day = Math.min(days, Math.max(0, Math.round((wib(today) - start) / 86400000)));
  return { day, days, fraction: clamp01(day / days) };
}

export type Figures = Record<ReportIndicator, number | null>;

/** Realisation of one report period from Arus Kas: sum of the months it covers, balance at its end. */
export async function figuresFromCashFlow(stage: Stage, allowed: Unit[], unitParam?: string | null): Promise<Figures> {
  if (!stage.months?.length) return emptyFigures();
  const unit: UnitFilter = resolveUnit(unitParam ?? undefined, allowed);
  let omzet = 0;
  let biaya = 0;
  let transaksi = 0;
  let saldo: number | null = null;
  for (const ym of stage.months) {
    const [y, m] = ym.split("-").map(Number);
    const month = new Date(y, m - 1, 1);
    const [totals, ledger] = await Promise.all([getUnitMonth(unit, allowed, month), getLedger({ unit, allowed, month })]);
    omzet += totals.masuk;
    biaya += totals.keluar;
    transaksi += ledger.rows.filter((r) => r.tx.type === "masuk").length;
    saldo = totals.balance;
  }
  return { omzet, biaya, laba: omzet - biaya, transaksi, unit: null, saldo };
}

export const emptyFigures = (): Figures => Object.fromEntries(REPORT_INDICATORS.map((i) => [i.key, null])) as Figures;

export type ReportKey = "report1" | "report2" | "report3";
export type ReportData = NonNullable<NonNullable<Perinti["reports"]>[ReportKey]>;

export async function getPerintis(): Promise<Perinti> {
  const payload = await getPayloadClient();
  return payload.findGlobal({ slug: "perintis", depth: 0 });
}

/** Targets and realisation for one report: the team's manual numbers win over the cash-flow figures. */
export function mergeFigures(report: ReportData | undefined, computed: Figures): { targets: Figures; actual: Figures; overridden: ReportIndicator[] } {
  const targets = emptyFigures();
  const actual = { ...computed };
  const overridden: ReportIndicator[] = [];
  for (const i of REPORT_INDICATORS) {
    const t = report?.targets?.[i.key];
    if (typeof t === "number") targets[i.key] = t;
    const o = report?.actualOverride?.[i.key];
    if (typeof o === "number") {
      actual[i.key] = o;
      overridden.push(i.key);
    }
  }
  return { targets, actual, overridden };
}

export type ReflectionKey = (typeof REFLECTIONS)[number]["key"];

/** The 5th of the stage's month, when the panel wants the form. */
export const reportDueDate = (stage: Stage) => `${stage.date.slice(0, 7)}-${String(PROGRAM.reportDeadlineDay).padStart(2, "0")}`;

/** Which mentor a group meets in session 0, 1 or 2 of the rotation. */
export const mentorForSession = (group: number | null | undefined, session: number) => (group ? (MENTORS.find((m) => m.groups[session]?.includes(group)) ?? null) : null);

/** Programme dates as calendar items: the five stages and the three report deadlines. No database behind them, so they never go stale. */
export function perintisCalendarItems(from: Date, to: Date, groupNumber?: number | null): CalendarItem[] {
  const items: CalendarItem[] = [];
  const inRange = (key: string) => wib(key) >= from.getTime() && wib(key) < to.getTime();
  STAGES.forEach((stage, i) => {
    const session = i >= 1 && i <= 3 ? i - 1 : -1;
    const mentor = session >= 0 ? mentorForSession(groupNumber, session) : null;
    const detail = stage.key === "kickoff" ? "seminar dan pitching perdana" : stage.key === "final" ? "presentasi final dan malam apresiasi" : `mentoring ${SESSION_NUMERALS[session]}${mentor ? ` dengan ${mentor.name}` : ""}`;
    const href = stage.months ? `/perintis?laporan=${stage.key}` : "/perintis";
    if (inRange(stage.date)) items.push({ id: `perintis-${stage.key}`, date: stage.date, title: `PERINTIS · ${stage.short}`, detail, href, layer: "perintis" });
    if (stage.months && inRange(reportDueDate(stage))) items.push({ id: `perintis-due-${stage.key}`, date: reportDueDate(stage), title: `Tenggat ${stage.form}`, detail: "kirim PDF ke grup WhatsApp panitia", href, layer: "perintis" });
  });
  return items;
}

export interface MentoringSession {
  id: number;
  title: string;
  date: string;
  time: string;
  notes: string | null;
  open: number;
  done: number;
}

/** Mentoring meetings the team logged in Kalender, newest first. */
export async function getMentoringSessions(): Promise<MentoringSession[]> {
  const payload = await getPayloadClient();
  const r = await payload.find({ collection: "events", where: { kind: { equals: "mentoring" } }, sort: "-startAt", limit: 12, depth: 0 });
  return r.docs.map((e) => {
    const rows = e.followUps ?? [];
    return { id: e.id, title: e.title, ...wibParts(new Date(e.startAt)), notes: e.notes ?? null, open: rows.filter((f) => !f.doneAt).length, done: rows.filter((f) => f.doneAt).length };
  });
}

export interface HubSummary {
  meetings: number;
  mentoring: number;
  followUpsDone: string[];
  followUpsOpen: string[];
  posts: { platform: string; count: number }[];
  newClients: string[];
  newProspects: number;
  ordersDone: number;
  unitsSold: number;
  projectsLive: string[];
  nextEvents: { title: string; date: string }[];
  nextTargets: { name: string; date: string }[];
}

/** What the rest of the Hub recorded in the report period: meetings, follow-ups, posts, clients, orders, projects, and what is already planned for the month after. */
export async function hubSummary(stage: Stage, units: Unit[]): Promise<HubSummary | null> {
  const months = stage.months;
  if (!months?.length) return null;
  const payload = await getPayloadClient();
  const from = monthRange(months[0]).from;
  const to = monthRange(months[months.length - 1]).to;
  const next = monthRange(shiftMonth(months[months.length - 1], 1));
  const between = (field: string, a: Date, b: Date) => ({ [field]: { greater_than_equal: a.toISOString(), less_than: b.toISOString() } });
  const inUnits = { unit: { in: units } };
  const [meetings, posts, clients, prospects, orders, projects, nextEvents, nextProjects] = await Promise.all([
    payload.find({ collection: "events", where: { and: [{ kind: { in: ["rapat-tim", "mentoring"] } }, between("startAt", from, to)] }, limit: 100, depth: 0, sort: "startAt" }),
    payload.find({ collection: "events", where: { and: [{ kind: { equals: "konten" } }, { "content.status": { equals: "tayang" } }, between("startAt", from, to)] }, limit: 200, depth: 0 }),
    payload.find({ collection: "clients", where: { and: [inUnits, between("createdAt", from, to)] }, limit: 50, depth: 0, sort: "createdAt" }),
    payload.count({ collection: "prospects", where: { and: [inUnits, between("createdAt", from, to)] } }),
    payload.find({ collection: "orders", where: { and: [inUnits, { status: { in: ["dikirim", "ditagih", "dibayar"] } }, between("deliveryDate", from, to)] }, limit: 200, depth: 0 }),
    payload.find({ collection: "projects", where: { and: [inUnits, { stage: { in: ["launch", "selesai"] } }, between("stageChangedAt", from, to)] }, limit: 50, depth: 0 }),
    payload.find({ collection: "events", where: { and: [{ kind: { not_equals: "konten" } }, between("startAt", next.from, next.to)] }, limit: 5, depth: 0, sort: "startAt" }),
    payload.find({ collection: "projects", where: { and: [inUnits, { stage: { in: [...openProjectStages] } }, between("targetDate", next.from, next.to)] }, limit: 5, depth: 0, sort: "targetDate" }),
  ]);
  const followUps = meetings.docs.flatMap((e) => e.followUps ?? []);
  const byPlatform = new Map<string, number>();
  for (const e of posts.docs) {
    const k = e.content?.platform ?? "lainnya";
    byPlatform.set(k, (byPlatform.get(k) ?? 0) + 1);
  }
  return {
    meetings: meetings.docs.filter((e) => e.kind === "rapat-tim").length,
    mentoring: meetings.docs.filter((e) => e.kind === "mentoring").length,
    followUpsDone: followUps.filter((f) => f.doneAt).map((f) => f.text),
    followUpsOpen: followUps.filter((f) => !f.doneAt).map((f) => f.text),
    posts: [...byPlatform].map(([platform, count]) => ({ platform: contentPlatformLabel.get(platform) ?? platform, count })).sort((a, b) => b.count - a.count),
    newClients: clients.docs.map((c) => c.name),
    newProspects: prospects.totalDocs,
    ordersDone: orders.docs.length,
    unitsSold: orders.docs.reduce((n, o) => n + (o.items ?? []).reduce((m, it) => m + (it.qty ?? 0), 0), 0),
    projectsLive: projects.docs.map((p) => p.name),
    nextEvents: nextEvents.docs.map((e) => ({ title: e.title, date: wibParts(new Date(e.startAt)).date })),
    nextTargets: nextProjects.docs.map((p) => ({ name: p.name, date: p.targetDate!.slice(0, 10) })),
  };
}

const list = (xs: string[], max = 4) => (xs.length > max ? `${xs.slice(0, max).join(", ")} dan ${xs.length - max} lainnya` : xs.join(", "));
const plural = (n: number, word: string) => `${n} ${word}`;

/** Short facts for the report card, only the ones with something behind them. */
export function factsFrom(s: HubSummary): string[] {
  const total = s.followUpsDone.length + s.followUpsOpen.length;
  const postsTotal = s.posts.reduce((n, p) => n + p.count, 0);
  return [
    s.meetings > 0 && plural(s.meetings, "musyawarah tim"),
    s.mentoring > 0 && plural(s.mentoring, "sesi mentoring"),
    total > 0 && `${s.followUpsDone.length} dari ${total} tindak lanjut selesai`,
    postsTotal > 0 && plural(postsTotal, "unggahan tayang"),
    s.newClients.length > 0 && plural(s.newClients.length, "klien baru"),
    s.newProspects > 0 && plural(s.newProspects, "prospek baru"),
    s.ordersDone > 0 && plural(s.ordersDone, "pesanan terkirim"),
    s.projectsLive.length > 0 && plural(s.projectsLive.length, "proyek live"),
  ].filter((x): x is string => Boolean(x));
}

/** Draft sentences for the written parts of FORM-04, built from the same facts; the team edits them before saving. */
export function draftsFrom(s: HubSummary, f: Figures): Partial<Record<ReflectionKey, string>> {
  const postsTotal = s.posts.reduce((n, p) => n + p.count, 0);
  const lines = (xs: (string | false | null | undefined)[]) => {
    const out = xs.filter((x): x is string => Boolean(x));
    return out.length ? out.join("\n") : undefined;
  };
  return {
    good: lines([
      f.omzet ? `Omzet ${formatIDR(f.omzet)} dari ${f.transaksi ?? 0} transaksi masuk.` : null,
      s.newClients.length > 0 && `Klien baru: ${list(s.newClients)}.`,
      s.ordersDone > 0 && `${s.ordersDone} pesanan terkirim (${s.unitsSold} unit).`,
      s.projectsLive.length > 0 && `Proyek yang live: ${list(s.projectsLive)}.`,
      postsTotal > 0 && `${postsTotal} unggahan tayang (${s.posts.map((p) => `${p.platform} ${p.count}`).join(", ")}).`,
      s.followUpsDone.length > 0 && `${s.followUpsDone.length} tindak lanjut musyawarah selesai.`,
    ]),
    problems: lines([
      s.followUpsOpen.length > 0 && `Belum selesai: ${list(s.followUpsOpen, 3)}.`,
      f.biaya && f.omzet !== null && f.biaya > f.omzet ? `Biaya ${formatIDR(f.biaya)} masih lebih besar dari omzet ${formatIDR(f.omzet)}.` : null,
      s.newProspects > 0 && s.newClients.length === 0 && `${s.newProspects} prospek dihubungi, belum ada yang menjadi klien.`,
    ]),
    actions: lines([
      s.followUpsDone.length > 0 && `Sudah dilakukan: ${list(s.followUpsDone, 4)}.`,
      (s.meetings > 0 || s.mentoring > 0) && `${[s.meetings > 0 && plural(s.meetings, "musyawarah tim"), s.mentoring > 0 && plural(s.mentoring, "sesi mentoring")].filter(Boolean).join(" dan ")} tercatat di Kalender Hub beserta tindak lanjutnya.`,
    ]),
    next: lines([
      ...s.nextTargets.map((t) => `Target launch ${t.name} pada ${formatDate(t.date)}.`),
      s.nextEvents.length > 0 && `Agenda: ${s.nextEvents.map((e) => `${e.title} (${formatDate(e.date)})`).join(", ")}.`,
      s.followUpsOpen.length > 0 && `Lanjutkan: ${list(s.followUpsOpen, 3)}.`,
    ]),
    innovation: lines([
      s.posts.length > 0 && `Kanal konten aktif: ${s.posts.map((p) => p.platform).join(", ")}.`,
      "Pencatatan usaha terpusat di Zynergy Hub: arus kas, klien, kalender, dan tindak lanjut dalam satu sistem.",
    ]),
  };
}
