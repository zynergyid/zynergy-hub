import type { Role } from "@/lib/access";
import type { Unit } from "@/lib/options";

export type IconName =
  | "dashboard"
  | "cashflow"
  | "clients"
  | "orders"
  | "projects"
  | "web"
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

/** Sidebar order runs from the simplest daily tools to the most complex ones. */
export const navSections: NavSection[] = [
  {
    title: "Harian",
    items: [
      { href: "/", label: "Ringkasan", icon: "dashboard" },
      { href: "/cash-flow", label: "Arus Kas", icon: "cashflow", roles: ["admin", "finance", "staff", "viewer"] },
      { href: "/clients", label: "Klien", icon: "clients" },
      { href: "/orders", label: "Pesanan", icon: "orders", units: ["supply"] },
      { href: "/projects", label: "Proyek", icon: "projects", units: ["digital", "apps"] },
      { href: "/outreach", label: "Outreach", icon: "outreach" },
      { href: "/vault", label: "Brankas Dokumen", icon: "vault" },
      { href: "/web", label: "Web", icon: "web" },
    ],
  },
  {
    title: "Alat",
    items: [
      { href: "/tools#vendor", label: "Registrasi Vendor", icon: "vendor", soon: true },
      { href: "/tools#po-email", label: "PO dari Email", icon: "inbox", soon: true },
    ],
  },
  {
    title: "Admin",
    items: [{ href: "/team", label: "Tim", icon: "team", roles: ["admin"] }],
  },
];

export const mobileTabs: NavItem[] = [
  { href: "/", label: "Ringkasan", icon: "dashboard" },
  { href: "/cash-flow", label: "Arus Kas", icon: "cashflow", roles: ["admin", "finance", "staff", "viewer"] },
  { href: "/clients", label: "Klien", icon: "clients" },
  { href: "/orders", label: "Pesanan", icon: "orders", units: ["supply"] },
  { href: "/projects", label: "Proyek", icon: "projects", units: ["digital", "apps"] },
  { href: "/outreach", label: "Outreach", icon: "outreach" },
];
