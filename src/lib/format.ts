const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
const dateFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });
const monthFmt = new Intl.DateTimeFormat("id-ID", { month: "short", year: "2-digit" });

export const formatIDR = (n: number) => idr.format(n);
export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatMonth = (d: Date) => monthFmt.format(d);
