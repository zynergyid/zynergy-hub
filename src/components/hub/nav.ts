import type { Role } from "@/lib/access";

export type IconName =
  | "dashboard"
  | "cashflow"
  | "clients"
  | "search"
  | "report"
  | "rfq"
  | "portal"
  | "team";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Not built yet: rendered disabled with a "Segera" pill. */
  soon?: boolean;
  /** Visible only to these roles (default: everyone logged in). */
  roles?: Role[];
}

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
      { href: "/arus-kas", label: "Arus Kas", icon: "cashflow", roles: ["admin", "finance"] },
      { href: "/klien", label: "Klien", icon: "clients" },
    ],
  },
  {
    title: "Alat",
    items: [
      { href: "/alat#cek-google", label: "Cek Google", icon: "search", soon: true },
      { href: "/alat#laporan", label: "Laporan Bulanan", icon: "report", soon: true },
      { href: "/alat#portal", label: "Portal Klien", icon: "portal", soon: true },
      { href: "/alat#rfq", label: "RFQ Supply", icon: "rfq", soon: true },
    ],
  },
  {
    title: "Admin",
    items: [{ href: "/tim", label: "Tim", icon: "team", roles: ["admin"] }],
  },
];

export const mobileTabs: NavItem[] = [
  { href: "/", label: "Ringkasan", icon: "dashboard" },
  { href: "/arus-kas", label: "Arus Kas", icon: "cashflow", roles: ["admin", "finance"] },
  { href: "/klien", label: "Klien", icon: "clients" },
  { href: "/alat", label: "Alat", icon: "search" },
  { href: "/tim", label: "Tim", icon: "team", roles: ["admin"] },
];
