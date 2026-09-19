import {
  ArrowLeftRight,
  BadgeCheck,
  BellRing,
  ChartNoAxesColumn,
  ClipboardList,
  FileSearch,
  FolderKanban,
  FolderLock,
  Inbox,
  LayoutDashboard,
  MessageSquareText,
  Search,
  Send,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { IconName } from "./nav";

const icons: Record<IconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  cashflow: ArrowLeftRight,
  clients: Users,
  orders: ClipboardList,
  projects: FolderKanban,
  web: ChartNoAxesColumn,
  search: Search,
  report: MessageSquareText,
  rfq: FileSearch,
  portal: UserRound,
  outreach: Send,
  followup: BellRing,
  vendor: BadgeCheck,
  vault: FolderLock,
  inbox: Inbox,
  team: Users,
};

export function NavIcon({ name, className }: { name: IconName; className?: string }) {
  const Icon = icons[name];
  return <Icon className={className} aria-hidden />;
}
