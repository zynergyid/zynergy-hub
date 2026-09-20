/**
 * Browser-safe date helpers for the calendar, all in WIB (Asia/Jakarta, no
 * daylight saving). Keys are "YYYY-MM-DD"; months are "YYYY-MM".
 */
export const TZ = "Asia/Jakarta";
const DAY = 86400000;
const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const weekday = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" });
const monthLong = new Intl.DateTimeFormat("id-ID", { timeZone: TZ, month: "long", year: "numeric" });
const dayLong = new Intl.DateTimeFormat("id-ID", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });
const dayShort = new Intl.DateTimeFormat("id-ID", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });
const timeFmt = new Intl.DateTimeFormat("id-ID", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const MONDAY_FIRST: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

export function wibParts(d: Date): { date: string; time: string } {
  const p = Object.fromEntries(parts.formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}
export const dateKeyWib = (iso: string) => wibParts(new Date(iso)).date;
export const timeWib = (iso: string) => timeFmt.format(new Date(iso));
export const todayWib = () => wibParts(new Date()).date;
export const formatDayLong = (key: string) => dayLong.format(new Date(`${key}T12:00:00+07:00`));
export const formatDayShort = (key: string) => dayShort.format(new Date(`${key}T12:00:00+07:00`));

/** For `<input type="datetime-local">`: the WIB wall-clock of an ISO instant. */
export function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const { date, time } = wibParts(new Date(iso));
  return `${date}T${time}`;
}
/** Back from the input value, read as WIB. */
export const fromLocalInput = (v: string): string | null => (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) ? new Date(`${v}:00+07:00`).toISOString() : null);

export const isMonthKey = (v?: string): v is string => Boolean(v && /^\d{4}-(0[1-9]|1[0-2])$/.test(v));
export const currentMonth = () => todayWib().slice(0, 7);
export function shiftMonth(ym: string, by: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
export const monthLabel = (ym: string) => monthLong.format(new Date(`${ym}-01T12:00:00+07:00`));

/** [from, to) of a month as instants, WIB midnight. */
export function monthRange(ym: string): { from: Date; to: Date } {
  return { from: new Date(`${ym}-01T00:00:00+07:00`), to: new Date(`${shiftMonth(ym, 1)}-01T00:00:00+07:00`) };
}

/** Six Monday-first weeks of day keys covering the month. */
export function monthGrid(ym: string): string[][] {
  const { from } = monthRange(ym);
  const start = from.getTime() - MONDAY_FIRST[weekday.format(from)] * DAY;
  const keys = Array.from({ length: 42 }, (_, i) => wibParts(new Date(start + i * DAY)).date);
  return Array.from({ length: 6 }, (_, w) => keys.slice(w * 7, w * 7 + 7));
}
export const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
