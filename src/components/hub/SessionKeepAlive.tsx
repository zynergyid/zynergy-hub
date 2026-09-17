"use client";

import { useEffect } from "react";
import { REMEMBER_COOKIE } from "@/lib/auth-cookie";

/** On a remembered device, ask the server once per tab to renew the login if it is due. */
export function SessionKeepAlive() {
  useEffect(() => {
    if (!document.cookie.split("; ").some((c) => c.startsWith(`${REMEMBER_COOKIE}=1`))) return;
    try {
      if (sessionStorage.getItem("hub-refresh-checked")) return;
    } catch {
      // Storage unavailable: asking once more is harmless.
    }
    fetch("/api/auth/refresh", { method: "POST" })
      .then((res) => {
        // Only remember a completed answer; an aborted request is retried on the next page.
        if (res.ok || res.status === 204) sessionStorage.setItem("hub-refresh-checked", "1");
      })
      .catch(() => undefined);
  }, []);
  return null;
}
