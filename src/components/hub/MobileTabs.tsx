"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRound, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { isNavActive, mobileNav, type NavItem, type NavViewer } from "./nav";
import { NavIcon } from "./NavIcon";
import { LogoutButton } from "./LogoutButton";

const isActive = (pathname: string, item: NavItem) => isNavActive(pathname, item.href);

const tabClass = (active: boolean) => cn("flex h-14 w-full flex-col items-center justify-center gap-0.5 px-0.5 text-[11px] font-semibold", active ? "text-primary" : "text-muted");

/** Bottom bar with the main tabs and a "Lainnya" sheet holding the rest of the sidebar. */
export function MobileTabs({ viewer }: { viewer: NavViewer }) {
  const pathname = usePathname();
  // The sheet remembers the page it was opened on; a navigation closes it without an effect.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const setOpen = (v: boolean) => setOpenedOn(v ? pathname : null);
  const { tabs, more } = mobileNav(viewer);
  const moreActive = !tabs.some((t) => isActive(pathname, t)) && (pathname === "/profile" || more.some((s) => s.items.some((i) => isActive(pathname, i))));

  // Escape closes the sheet.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenedOn(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Menu lainnya">
          <button type="button" className="absolute inset-0 bg-navy/40" aria-label="Tutup menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 4.5rem)" }}>
            <div className="sticky top-0 flex items-center justify-between border-b border-line bg-white px-4 py-3">
              <p className="text-sm font-bold">Menu lainnya</p>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-muted hover:bg-surface-soft" aria-label="Tutup">
                <X className="size-4" />
              </button>
            </div>
            <div className="px-3 py-2">
              {more.map((section) => (
                <div key={section.title || "top"} className="py-2">
                  {section.title && <p className="mb-1 px-2 text-[11px] font-bold uppercase tracking-wider text-muted">{section.title}</p>}
                  <ul>
                    {section.items.map((item) => (
                      <li key={item.href}>
                        <Link href={item.href} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium", isActive(pathname, item) ? "bg-primary-soft text-primary-dark" : "hover:bg-surface-soft", item.soon && "text-muted")}>
                          <NavIcon name={item.icon} className="size-4 shrink-0 translate-y-px" />
                          <span className="flex-1">{item.label}</span>
                          {item.soon && <span className="rounded-full bg-surface-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">Segera</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="border-t border-line py-2">
                <ul>
                  <li>
                    <Link href="/profile" className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium", pathname === "/profile" ? "bg-primary-soft text-primary-dark" : "hover:bg-surface-soft")}>
                      <UserRound className="size-4 shrink-0" aria-hidden />
                      Profil
                    </Link>
                  </li>
                  <li>
                    <LogoutButton label className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-soft" />
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white/95 backdrop-blur print:hidden md:hidden">
        <ul className="flex" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {tabs.map((t) => (
            <li key={t.href} className="flex-1">
              <Link href={t.href} className={tabClass(isActive(pathname, t) && !open)}>
                <NavIcon name={t.icon} className="size-5 shrink-0" />
                <span className="w-full truncate text-center">{t.short ?? t.label}</span>
              </Link>
            </li>
          ))}
          <li className="flex-1">
            <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className={tabClass(open || moreActive)}>
              <NavIcon name="more" className="size-5 shrink-0" />
              <span className="w-full truncate text-center">Lainnya</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
