import { isRoleValue, type Role } from "@/lib/options";

/**
 * The role (job) shapes the workspace: which dashboard cards come first,
 * which four tabs the phone bar shows, and which job-specific tools appear.
 * This is presentation only; what may be seen or changed comes from the
 * grants, and every card and tab is filtered by capability and unit afterwards.
 */
export type CardKey = "agenda" | "outreach" | "orders" | "projects" | "konten" | "seo" | "web" | "vault" | "cashflow" | "finance";
export type ToolKey = "skills";

export interface Workspace {
  /** Cards this job asked for, in order; jabatan-specific cards (konten, seo) render only when listed here. */
  featured: CardKey[];
  /** Full dashboard order: featured first, then every other general card. */
  cards: CardKey[];
  /** Phone tab hrefs in priority order; the bar shows the first four the person may see. Kalender is always second (Danish, 2026-09-21). */
  tabs: string[];
  tools: ToolKey[];
}

/** General cards, in the order everyone without a jabatan sees them. */
const GENERAL: CardKey[] = ["agenda", "outreach", "orders", "projects", "web", "vault", "cashflow", "finance"];
const DEFAULT_TABS = ["/", "/calendar", "/cash-flow", "/clients", "/orders", "/projects", "/outreach"];

const byRole: Record<Role, { featured: CardKey[]; tabs: string[]; tools?: ToolKey[] }> = {
  Lead: { featured: [], tabs: ["/", "/calendar", "/cash-flow", "/clients"], tools: ["skills"] },
  Developer: { featured: ["agenda", "projects"], tabs: ["/", "/calendar", "/projects", "/clients"], tools: ["skills"] },
  Designer: { featured: ["agenda", "konten", "vault"], tabs: ["/", "/calendar", "/vault", "/clients"] },
  Marketing: { featured: ["agenda", "outreach", "web", "konten", "seo"], tabs: ["/", "/calendar", "/outreach", "/clients"] },
  Business: { featured: ["agenda", "orders", "outreach"], tabs: ["/", "/calendar", "/orders", "/outreach", "/clients"] },
  Staff: { featured: ["agenda", "orders", "outreach", "cashflow"], tabs: ["/", "/calendar", "/orders", "/cash-flow", "/clients"] },
  Finance: { featured: ["agenda", "cashflow", "finance", "orders"], tabs: ["/", "/calendar", "/cash-flow", "/orders", "/clients"] },
  Commissioner: { featured: ["agenda", "cashflow", "finance", "orders", "projects"], tabs: ["/", "/calendar", "/cash-flow", "/orders", "/projects"] },
  Other: { featured: [], tabs: ["/", "/calendar"] },
};

export function workspaceOf(role?: string | null): Workspace {
  const w = isRoleValue(role) ? byRole[role] : byRole.Other;
  const featured = w.featured;
  const cards = [...featured, ...GENERAL.filter((c) => !featured.includes(c))];
  // Dasbor, Kalender, then PERINTIS on every phone (Danish's order), then the job's own tabs.
  const own = w.tabs.filter((t) => t !== "/perintis");
  const tabs = [...own.slice(0, 2), "/perintis", ...own.slice(2), ...DEFAULT_TABS.filter((t) => !own.includes(t) && t !== "/perintis")];
  return { featured, cards, tabs, tools: w.tools ?? [] };
}

export const hasTool = (role: string | null | undefined, tool: ToolKey) => workspaceOf(role).tools.includes(tool);

/** Labels for the read-only "Ruang kerja" table. */
export const cardLabel: Record<CardKey, string> = {
  agenda: "Minggu ini dan tindak lanjut",
  outreach: "Outreach",
  orders: "Pesanan",
  projects: "Proyek",
  konten: "Konten",
  seo: "SEO situs",
  web: "Web",
  vault: "Brankas",
  cashflow: "Arus kas 12 bulan",
  finance: "Perpanjangan dan transaksi",
};
export const toolLabel: Record<ToolKey, string> = { skills: "Skill Claude Code dan kunci API" };
/** Cards that exist only for the jabatan that asks for them. */
export const jobOnlyCards: CardKey[] = ["konten", "seo"];
