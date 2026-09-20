/** Browser-safe calendar types and layer palette; `lib/calendar.ts` (server) re-exports them. */
export type CalendarLayer = "acara" | "konten" | "proyek" | "outreach" | "pesanan" | "klien";
export const calendarLayers: { value: CalendarLayer; label: string; chip: string; dot: string }[] = [
  { value: "acara", label: "Acara", chip: "bg-primary-soft text-primary-dark", dot: "bg-primary" },
  { value: "konten", label: "Konten", chip: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  { value: "proyek", label: "Proyek", chip: "bg-secondary-soft text-secondary-dark", dot: "bg-secondary" },
  { value: "outreach", label: "Outreach", chip: "bg-amber-50 text-amber-700", dot: "bg-amber-400" },
  { value: "pesanan", label: "Pesanan", chip: "bg-violet-50 text-violet-700", dot: "bg-violet-500" },
  { value: "klien", label: "Klien", chip: "bg-sky-50 text-sky-700", dot: "bg-sky-500" },
];
export const allLayers = new Set<CalendarLayer>(calendarLayers.map((l) => l.value));
export const isLayer = (v: string): v is CalendarLayer => allLayers.has(v as CalendarLayer);
export const layerOf = (v: CalendarLayer) => calendarLayers.find((l) => l.value === v)!;

export interface CalendarItem {
  id: string;
  /** WIB day key. */
  date: string;
  /** "HH:MM" WIB; absent for all-day dates like targets and due dates. */
  time?: string;
  title: string;
  detail?: string;
  href: string;
  layer: CalendarLayer;
  /** Instants, for the ICS feed; only hand-made events carry them. */
  start?: string;
  end?: string;
  /** Content posts only. */
  status?: string;
  /** The event's photo, when it has one. */
  photoUrl?: string;
}
