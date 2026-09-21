const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
const dateFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });
const dayFmt = new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short" });
const monthFmt = new Intl.DateTimeFormat("id-ID", { month: "short", year: "2-digit" });
const monthLongFmt = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });

export const formatIDR = (n: number) => idr.format(n);
export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatMonth = (d: Date) => monthFmt.format(d);
export const formatMonthLong = (d: Date) => monthLongFmt.format(d);

/** "Hari ini", "Kemarin", or "Sen, 8 Sep". */
export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(today) - startOf(d)) / 86400000);
  if (diff === 0) return "Hari ini";
  if (diff === 1) return "Kemarin";
  return dayFmt.format(d);
}

export const dateKey = (iso: string) => iso.slice(0, 10);

/** Whole days from today to the given date; negative when overdue. */
export const daysUntil = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);

/** "3 hari lagi", "hari ini", or "lewat 2 hari". */
export function daysLabel(iso: string): string {
  const d = daysUntil(iso);
  return d < 0 ? `lewat ${-d} hari` : d === 0 ? "hari ini" : `${d} hari lagi`;
}

/** Today as YYYY-MM-DD in local time, for date inputs. */
export function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "baru saja", "12 menit lalu", "3 jam lalu", "kemarin", else the date. */
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.round(h / 24);
  if (d === 1) return "kemarin";
  if (d < 7) return `${d} hari lalu`;
  return formatDate(iso);
}
