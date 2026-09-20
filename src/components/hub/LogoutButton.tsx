"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/cn";

/** Icon-only by default; `label` adds the word for menus. */
export function LogoutButton({ className, label = false }: { className?: string; label?: boolean }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/users/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  return (
    <button type="button" onClick={logout} aria-label="Keluar" title="Keluar" className={cn(label ? "" : "rounded-lg p-2 text-muted hover:bg-surface-soft hover:text-ink", className)}>
      <LogOut className="size-4 shrink-0" />
      {label && "Keluar"}
    </button>
  );
}
