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
