import type { Capability, Role, Unit } from "@/lib/options";

/** What the nav needs to know about the person. */
export interface NavViewer {
  role: Role;
  isAdmin: boolean;
  units: Unit[];
  caps: Capability[];
}
import { workspaceOf } from "@/lib/workspace";

export type IconName =
  | "dashboard"
  | "cashflow"
  | "clients"
  | "orders"
  | "projects"
  | "web"
  | "seo"
  | "search"
  | "report"
  | "rfq"
  | "portal"
  | "outreach"
  | "followup"
  | "vendor"
  | "vault"
  | "inbox"
  | "team"
  | "calendar"
  | "trophy"
  | "more";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Not built yet: rendered disabled with a "Segera" pill. */
  soon?: boolean;
  /** Visible to admins only. */
  adminOnly?: boolean;
  /** Visible only with this capability from the Hak akses grants. */
  needs?: Capability;
  /** Visible only to people who work in one of these units (default: every unit). */
  units?: Unit[];
}

/** One rule for the sidebar and the phone tabs. */
export const canSeeNav = (item: NavItem, v: NavViewer) =>
  (!item.adminOnly || v.isAdmin) && (!item.needs || v.caps.includes(item.needs)) && (!item.units || item.units.some((u) => v.units.includes(u)));

export interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * Sidebar groups by kind of work, never by business line: the line is chosen
 * inside each page (unit tabs) and limited by the person's units. Items with
 * `units` show only to people who work in one of those units.
 */
export const navSections: NavSection[] = [
  {
    title: "",
    items: [
      { href: "/", label: "Dasbor", icon: "dashboard" },
      { href: "/calendar", label: "Kalender", icon: "calendar" },
    ],
  },
  {
    title: "Program",
    items: [{ href: "/perintis", label: "PERINTIS 2026", icon: "trophy" }],
  },
  {
    title: "Klien",
    items: [
      { href: "/clients", label: "Klien", icon: "clients" },
      { href: "/outreach", label: "Outreach", icon: "outreach" },
    ],
  },
  {
    title: "Pekerjaan",
    items: [
      { href: "/orders", label: "Pesanan", icon: "orders", units: ["supply"] },
      { href: "/projects", label: "Proyek", icon: "projects", units: ["digital", "apps"] },
    ],
  },
  {
    title: "Keuangan",
    items: [{ href: "/cash-flow", label: "Arus Kas", icon: "cashflow", needs: "viewMoney" }],
  },
  {
    title: "Situs",
    items: [
      { href: "/web", label: "Web", icon: "web" },
      { href: "/seo", label: "SEO", icon: "seo" },
    ],
  },
  {
    title: "Arsip",
    items: [{ href: "/vault", label: "Brankas Dokumen", icon: "vault" }],
  },
  {
    // Disappears once these are built and move into Pekerjaan.
    title: "Segera",
    items: [
      { href: "/tools#vendor", label: "Registrasi Vendor", icon: "vendor", soon: true, units: ["supply"] },
      { href: "/tools#po-email", label: "PO dari Email", icon: "inbox", soon: true, units: ["supply"] },
    ],
  },
  {
    title: "Admin",
    items: [{ href: "/team", label: "Tim", icon: "team", adminOnly: true }],
  },
];

/**
 * Phone bottom bar: the first MOBILE_TAB_COUNT items of the person's
 * workspace order (by jabatan) that they may see, plus a "Lainnya" tab that
 * lists every other sidebar item, so nothing in `navSections` is ever
 * unreachable on a phone.
 */
export const MOBILE_TAB_COUNT = 4;
const navItemByHref = new Map(navSections.flatMap((s) => s.items).map((i) => [i.href, i]));

/** Bottom-bar tabs and the sections left for the "Lainnya" sheet, for one person. */
export function mobileNav(v: NavViewer): { tabs: NavItem[]; more: NavSection[] } {
  const tabs = workspaceOf(v.role)
    .tabs.map((href) => navItemByHref.get(href))
    .filter((t): t is NavItem => Boolean(t) && canSeeNav(t!, v))
    .slice(0, MOBILE_TAB_COUNT);
  const shown = new Set(tabs.map((t) => t.href));
  const more = navSections
    .map((s) => ({ title: s.title, items: s.items.filter((i) => canSeeNav(i, v) && !shown.has(i.href)) }))
    .filter((s) => s.items.length > 0);
  return { tabs, more };
}
