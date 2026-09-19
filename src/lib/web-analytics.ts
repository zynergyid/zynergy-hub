/**
 * Reads zynergy.co.id traffic from the self-hosted Umami at stats.zynergy.co.id
 * with the API key of the Umami user "hub" (view rights only on what it owns).
 * Everything is aggregate: no personal data leaves Umami. Results are cached
 * in memory for ten minutes so the dashboard never hammers the collector.
 */
export interface WebTotals {
  visitors: number;
  pageviews: number;
  visits: number;
  bounces: number;
  totaltime: number;
}

export interface WebRow {
  label: string;
  count: number;
}

export interface WebSummary {
  days: number;
  from: Date;
  to: Date;
  totals: WebTotals;
  previous: WebTotals;
  /** WhatsApp button clicks, from the "whatsapp" event the site sends. */
  whatsappClicks: number;
  whatsappPrevious: number;
  /** Where on the page the WhatsApp clicks happened. */
  whatsappPlaces: WebRow[];
  pages: WebRow[];
  referrers: WebRow[];
  countries: WebRow[];
  /** Pageviews per day, oldest first. */
  daily: { date: string; pageviews: number; visitors: number }[];
}

const TZ = "Asia/Jakarta";
const TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; value: WebSummary | null }>();

export const webAnalyticsConfigured = () => Boolean(process.env.UMAMI_URL && process.env.UMAMI_API_KEY && process.env.UMAMI_WEBSITE_ID);
export const umamiDashboardUrl = () => (process.env.UMAMI_URL ? `${process.env.UMAMI_URL}/websites/${process.env.UMAMI_WEBSITE_ID}` : null);

async function api<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const url = new URL(`${process.env.UMAMI_URL}/api/websites/${process.env.UMAMI_WEBSITE_ID}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { Authorization: `Bearer ${process.env.UMAMI_API_KEY}` }, cache: "no-store" });
  if (!res.ok) throw new Error(`Umami ${path} ${res.status}`);
  return (await res.json()) as T;
}

type StatsResponse = WebTotals & { comparison?: WebTotals };
type MetricRow = { x: string | null; y: number };
type SeriesPoint = { x: string; y: number };

const rows = (list: MetricRow[], fallback = "(tidak diketahui)"): WebRow[] => list.map((r) => ({ label: r.x || fallback, count: r.y }));
const empty: WebTotals = { visitors: 0, pageviews: 0, visits: 0, bounces: 0, totaltime: 0 };

/** Traffic for the last `days` days compared with the `days` before, or null when Umami cannot be reached. */
export async function getWebSummary(days: 7 | 30 = 7): Promise<WebSummary | null> {
  if (!webAnalyticsConfigured()) return null;
  const key = `summary:${days}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

  const to = new Date();
  const from = new Date(to.getTime() - days * 86400000);
  const prevFrom = new Date(from.getTime() - days * 86400000);
  const range = { startAt: from.getTime(), endAt: to.getTime() };
  const prevRange = { startAt: prevFrom.getTime(), endAt: from.getTime() };
  let value: WebSummary | null = null;
  try {
    const [stats, events, prevEvents, places, pages, referrers, countries, series] = await Promise.all([
      api<StatsResponse>("stats", { ...range, compare: "prev" }),
      api<MetricRow[]>("metrics", { ...range, type: "event", limit: 20 }),
      api<MetricRow[]>("metrics", { ...prevRange, type: "event", limit: 20 }),
      api<{ value: string; total: number }[]>("event-data/values", { ...range, eventName: "whatsapp", propertyName: "place" }).catch(() => []),
      api<MetricRow[]>("metrics", { ...range, type: "path", limit: 8 }),
      api<MetricRow[]>("metrics", { ...range, type: "referrer", limit: 8 }),
      api<MetricRow[]>("metrics", { ...range, type: "country", limit: 6 }),
      api<{ pageviews: SeriesPoint[]; sessions: SeriesPoint[] }>("pageviews", { ...range, unit: "day", timezone: TZ }),
    ]);
    const wa = (list: MetricRow[]) => list.find((r) => r.x === "whatsapp")?.y ?? 0;
    const byDay = new Map<string, { pageviews: number; visitors: number }>();
    for (const p of series.pageviews) byDay.set(p.x.slice(0, 10), { pageviews: p.y, visitors: 0 });
    for (const s of series.sessions) {
      const d = s.x.slice(0, 10);
      byDay.set(d, { pageviews: byDay.get(d)?.pageviews ?? 0, visitors: s.y });
    }
    const daily: WebSummary["daily"] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(to.getTime() - i * 86400000);
      const iso = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
      daily.push({ date: iso, ...(byDay.get(iso) ?? { pageviews: 0, visitors: 0 }) });
    }
    value = {
      days,
      from,
      to,
      totals: { visitors: stats.visitors, pageviews: stats.pageviews, visits: stats.visits, bounces: stats.bounces, totaltime: stats.totaltime },
      previous: stats.comparison ?? empty,
      whatsappClicks: wa(events),
      whatsappPrevious: wa(prevEvents),
      whatsappPlaces: (places ?? []).map((p) => ({ label: p.value, count: p.total })).sort((a, b) => b.count - a.count),
      pages: rows(pages),
      referrers: rows(referrers, "Langsung / tidak diketahui"),
      countries: rows(countries),
      daily,
    };
  } catch (error) {
    console.error("getWebSummary failed:", error);
    value = null;
  }
  cache.set(key, { at: Date.now(), value });
  return value;
}

/** Percent change; null when there is nothing to compare with. */
export const change = (now: number, before: number): number | null => (before > 0 ? Math.round(((now - before) / before) * 100) : now > 0 ? null : 0);

/** Average visit length in whole seconds. */
export const avgSeconds = (t: WebTotals) => (t.visits > 0 ? Math.round(t.totaltime / t.visits) : 0);

const SEARCH_HOST = /(^|\.)(google|bing|yahoo|duckduckgo|yandex|baidu|ecosia)\./i;
const searchCache = new Map<number, { at: number; value: { visits: number; previous: number } | null }>();

/** Visits that arrived from a search engine, this period and the one before. */
export async function getSearchVisits(days = 30): Promise<{ visits: number; previous: number } | null> {
  if (!webAnalyticsConfigured()) return null;
  const hit = searchCache.get(days);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const to = Date.now();
  const from = to - days * 86400000;
  const sum = (rows: MetricRow[]) => rows.filter((r) => r.x && SEARCH_HOST.test(r.x)).reduce((s, r) => s + r.y, 0);
  let value: { visits: number; previous: number } | null = null;
  try {
    const [now, prev] = await Promise.all([
      api<MetricRow[]>("metrics", { startAt: from, endAt: to, type: "referrer", limit: 200 }),
      api<MetricRow[]>("metrics", { startAt: from - days * 86400000, endAt: from, type: "referrer", limit: 200 }),
    ]);
    value = { visits: sum(now), previous: sum(prev) };
  } catch (error) {
    console.error("getSearchVisits failed:", error);
  }
  searchCache.set(days, { at: Date.now(), value });
  return value;
}
