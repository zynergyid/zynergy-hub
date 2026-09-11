"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/cn";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/users/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  return (
    <button type="button" onClick={logout} aria-label="Keluar" title="Keluar" className={cn("rounded-lg p-2 text-muted hover:bg-surface-soft hover:text-ink", className)}>
      <LogOut className="size-4" />
    </button>
  );
}
