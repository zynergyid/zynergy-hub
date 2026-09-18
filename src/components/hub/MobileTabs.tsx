"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { Role } from "@/lib/access";
import type { Unit } from "@/lib/options";
import { canSeeNav, mobileTabs } from "./nav";
import { NavIcon } from "./NavIcon";

export function MobileTabs({ role, units }: { role: Role; units: Unit[] }) {
  const pathname = usePathname();
  const tabs = mobileTabs.filter((t) => canSeeNav(t, role, units));
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur md:hidden">
      <ul className="flex" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {tabs.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold",
                  active ? "text-primary" : "text-muted",
                )}
              >
                <NavIcon name={t.icon} className="size-5" />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
