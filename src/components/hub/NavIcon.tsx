import {
  ArrowLeftRight,
  BadgeCheck,
  BellRing,
  CalendarDays,
  ChartNoAxesColumn,
  ClipboardList,
  FileSearch,
  FolderKanban,
  FolderLock,
  Inbox,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Search,
  Send,
  Trophy,
  SearchCheck,
  UserRound,
  Users,
  type LucideIcon, KeyRound } from "lucide-react";
import type { IconName } from "./nav";

const icons: Record<IconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  cashflow: ArrowLeftRight,
  clients: Users,
  orders: ClipboardList,
  projects: FolderKanban,
  web: ChartNoAxesColumn,
  seo: SearchCheck,
  search: Search,
  report: MessageSquareText,
  rfq: FileSearch,
  portal: UserRound,
  outreach: Send,
  followup: BellRing,
  vendor: BadgeCheck,
  vault: FolderLock,
  key: KeyRound,
  inbox: Inbox,
  team: Users,
  more: Menu,
  calendar: CalendarDays,
  trophy: Trophy,
};

export function NavIcon({ name, className }: { name: IconName; className?: string }) {
  const Icon = icons[name];
  return <Icon className={className} aria-hidden />;
}
