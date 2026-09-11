import {
  ArrowLeftRight,
  FileSearch,
  LayoutDashboard,
  MessageSquareText,
  Search,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { IconName } from "./nav";

const icons: Record<IconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  cashflow: ArrowLeftRight,
  clients: Users,
  search: Search,
  report: MessageSquareText,
  rfq: FileSearch,
  portal: UserRound,
  team: Users,
};

export function NavIcon({ name, className }: { name: IconName; className?: string }) {
  const Icon = icons[name];
  return <Icon className={className} aria-hidden />;
}
