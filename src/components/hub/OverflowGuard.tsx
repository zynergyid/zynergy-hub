"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Development only. After each navigation and on resize, warns in the console
 * when something inside <main> is wider than the screen, and names the element.
 * The layout clips such overflow so users never see a sideways page, which is
 * exactly why a loud warning is needed during development.
 */
export function OverflowGuard() {
  const pathname = usePathname();
  useEffect(() => {
    const check = () => {
      const main = document.querySelector("main");
      if (!main) return;
      const limit = main.getBoundingClientRect().right + 1;
      const wide = [...main.querySelectorAll<HTMLElement>("*")].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.right > limit && !scrollsSideways(el, main);
      });
      const inner = new Set(wide);
      const leaves = wide.filter((el) => ![...el.children].some((c) => inner.has(c as HTMLElement)));
      if (leaves.length) {
        const describe = (el: HTMLElement) => `<${el.tagName.toLowerCase()} class="${el.getAttribute("class") ?? ""}"> kanan ${Math.round(el.getBoundingClientRect().right)}px`;
        console.warn(`[OverflowGuard] ${leaves.length} elemen lebih lebar dari layar di ${location.pathname}:\n${leaves.slice(0, 5).map(describe).join("\n")}`, ...leaves.slice(0, 5));
      }
    };
    // Wait for fonts and the first paint; a resize is checked once it settles.
    let timer = setTimeout(() => document.fonts.ready.then(check), 800);
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(check, 400);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [pathname]);
  return null;
}

/** Wide content inside its own horizontal scroller (a table wrapper) is fine. */
function scrollsSideways(el: HTMLElement, main: Element): boolean {
  for (let p = el.parentElement; p && p !== main; p = p.parentElement) {
    const o = getComputedStyle(p).overflowX;
    if (o === "auto" || o === "scroll") return true;
  }
  return false;
}
