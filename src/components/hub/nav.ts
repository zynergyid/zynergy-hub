import { moneyRoles, type Role, type Unit } from "@/lib/options";

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
  | "team";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Not built yet: rendered disabled with a "Segera" pill. */
  soon?: boolean;
  /** Visible only to these roles (default: everyone logged in). */
  roles?: Role[];
  /** Visible only to people who work in one of these units (default: every unit). */
  units?: Unit[];
}

/** One rule for the sidebar and the phone tabs. */
export const canSeeNav = (item: NavItem, role: Role, units: Unit[]) =>
  (!item.roles || item.roles.includes(role)) && (!item.units || item.units.some((u) => units.includes(u)));

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
    items: [{ href: "/", label: "Ringkasan", icon: "dashboard" }],
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
    items: [{ href: "/cash-flow", label: "Arus Kas", icon: "cashflow", roles: moneyRoles }],
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
    items: [{ href: "/team", label: "Tim", icon: "team", roles: ["admin"] }],
  },
];

export const mobileTabs: NavItem[] = [
  { href: "/", label: "Ringkasan", icon: "dashboard" },
  { href: "/cash-flow", label: "Arus Kas", icon: "cashflow", roles: moneyRoles },
  { href: "/clients", label: "Klien", icon: "clients" },
  { href: "/orders", label: "Pesanan", icon: "orders", units: ["supply"] },
  { href: "/projects", label: "Proyek", icon: "projects", units: ["digital", "apps"] },
  { href: "/outreach", label: "Outreach", icon: "outreach" },
];
