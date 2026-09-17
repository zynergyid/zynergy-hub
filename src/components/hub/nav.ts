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
      { href: "/outreach", label: "Outreach", icon: "outreach" },
      { href: "/vault", label: "Brankas Dokumen", icon: "vault" },
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
  { href: "/orders", label: "Pesanan", icon: "orders" },
  { href: "/outreach", label: "Outreach", icon: "outreach" },
];
