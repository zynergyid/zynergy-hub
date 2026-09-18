"use client";

import Link, { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export interface Segment {
  label: string;
  href: string;
  active: boolean;
}

/** Inside a Link: shows a spinner while that link's navigation is in flight. */
function SegmentLabel({ label }: { label: string }) {
  const { pending } = useLinkStatus();
  return (
    <span className="inline-flex items-center gap-1.5">
      {pending && <Loader2 className="size-3.5 animate-spin text-primary" aria-hidden />}
      {label}
    </span>
  );
}

/**
 * Pill switch built from links, so it works without JS and keeps URLs shareable.
 * Wraps onto a second row when the screen is narrower than the pills, so it can
 * never push the page wider than the phone (labels themselves never break).
 */
export function SegmentedLinks({ segments, ariaLabel }: { segments: Segment[]; ariaLabel: string }) {
  return (
    <nav aria-label={ariaLabel} className="inline-flex max-w-full flex-wrap gap-0.5 rounded-xl border border-line bg-surface-soft p-1">
      {segments.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          aria-current={s.active ? "page" : undefined}
          className={cn(
            "whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors",
            s.active ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink",
          )}
        >
          <SegmentLabel label={s.label} />
        </Link>
      ))}
    </nav>
  );
}
