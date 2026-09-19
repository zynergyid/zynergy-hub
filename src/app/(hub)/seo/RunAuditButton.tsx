"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonOutline } from "@/components/hub/form";
import { runAuditNow } from "./actions";

/** Fetches every public page and refreshes the technical score; takes a few seconds. */
export function RunAuditButton() {
  const [pending, start] = useTransition();
  return (
    <button type="button" onClick={() => start(() => runAuditNow())} disabled={pending} className={cn(buttonOutline, "inline-flex items-center gap-1.5")}>
      <RefreshCw className={cn("size-4", pending && "animate-spin")} aria-hidden />
      {pending ? "Memeriksa..." : "Periksa sekarang"}
    </button>
  );
}
