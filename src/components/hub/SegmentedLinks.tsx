import Link from "next/link";
import { cn } from "@/lib/cn";

export interface Segment {
  label: string;
  href: string;
  active: boolean;
}

/** Pill switch built from links, so it works without JS and keeps URLs shareable. */
export function SegmentedLinks({ segments, ariaLabel }: { segments: Segment[]; ariaLabel: string }) {
  return (
    <nav aria-label={ariaLabel} className="inline-flex rounded-xl border border-line bg-surface-soft p-1">
      {segments.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          aria-current={s.active ? "page" : undefined}
          className={cn(
            "rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors",
            s.active ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink",
          )}
        >
          {s.label}
        </Link>
      ))}
    </nav>
  );
}
