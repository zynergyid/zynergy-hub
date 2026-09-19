"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Textarea that grows with its content, so long notes never hide behind a
 * scrollbar. `rows` still sets the minimum height (the browser's own
 * `field-sizing: content` is not used because it drops that minimum).
 */
export function AutoTextarea({ className, onInput, ...props }: React.ComponentProps<"textarea">) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fit = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  };
  useEffect(() => {
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return (
    <textarea
      {...props}
      ref={ref}
      className={cn(className, "resize-none overflow-hidden")}
      onInput={(e) => {
        fit();
        onInput?.(e);
      }}
    />
  );
}
