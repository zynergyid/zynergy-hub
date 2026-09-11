import type { Role } from "@/lib/access";

export type IconName =
  | "dashboard"
  | "cashflow"
  | "clients"
  | "orders"
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
      { href: "/cash-flow", label: "Arus Kas", icon: "cashflow", roles: ["admin", "finance", "staff", "viewer"] },
      { href: "/clients", label: "Klien", icon: "clients" },
      { href: "/orders", label: "Pesanan", icon: "orders" },
    ],
  },
  {
    title: "Alat",
    items: [
      { href: "/tools#cek-google", label: "Cek Google", icon: "search", soon: true },
      { href: "/tools#laporan", label: "Laporan Bulanan", icon: "report", soon: true },
      { href: "/tools#portal", label: "Portal Klien", icon: "portal", soon: true },
      { href: "/tools#rfq", label: "RFQ Supply", icon: "rfq", soon: true },
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
  { href: "/orders", label: "Pesanan", icon: "orders" },
  { href: "/tools", label: "Alat", icon: "search", roles: ["member"] },
  { href: "/team", label: "Tim", icon: "team", roles: ["admin"] },
];
