"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/ui/BrandMark";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/cn";
import type { Role } from "@/lib/access";
import { navSections, type NavItem } from "./nav";
import { NavIcon } from "./NavIcon";

function isActive(pathname: string, href: string) {
  const base = href.split("#")[0];
  if (base === "/") return pathname === "/";
  return pathname === base || pathname.startsWith(base + "/");
}

function canSee(item: NavItem, role: Role) {
  return !item.roles || item.roles.includes(role);
}

export function Sidebar({ role, userName }: { role: Role; userName: string }) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-white md:flex">
      <div className="flex h-14 items-center gap-2.5 border-b border-line px-5">
        <BrandMark className="size-7 text-navy" />
        <span className="text-base font-extrabold tracking-tight">
          Zynergy <span className="text-muted">Team</span>
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section) => {
          const items = section.items.filter((i) => canSee(i, role));
          if (items.length === 0) return null;
          return (
            <div key={section.title} className="mb-5">
              <p className="mb-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-muted">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary-soft font-semibold text-primary-dark before:absolute before:left-0 before:top-2 before:h-[calc(100%-1rem)] before:w-[3px] before:rounded-full before:bg-primary"
                            : "text-ink hover:bg-surface-soft",
                          item.soon && "text-muted",
                        )}
                      >
                        <NavIcon name={item.icon} className="size-4 shrink-0" />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.soon && (
                          <span className="rounded-full bg-surface-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                            Segera
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
      <div className="flex items-center gap-3 border-t border-line px-4 py-3">
        <Avatar name={userName} className="size-8 text-[10px]" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{userName}</p>
          <p className="text-xs capitalize text-muted">{role}</p>
        </div>
      </div>
    </aside>
  );
}
