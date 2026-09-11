import { cn } from "@/lib/cn";

/**
 * Zynergy mark: a Z built from two separate, point-symmetric pieces whose
 * nodes face each other without touching ("synergy, not fusion").
 * Geometry mirrors src/app/icon.svg. Colour comes from `currentColor`, so
 * wrap it in a text-colour class (text-navy on light, text-white on dark).
 *
 * `variant="solid"` swaps the ring nodes for filled dots; use it below ~32px
 * where the ring holes would close up.
 */
export function BrandMark({
  className,
  variant = "ring",
}: {
  className?: string;
  variant?: "ring" | "solid";
}) {
  return (
    <svg
      viewBox="0 0 1000 1000"
      aria-hidden="true"
      className={cn("size-8 shrink-0", className)}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="110"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M160 130H840L588.3 548.9" />
        <path d="M840 870H160L411.7 451.1" />
      </g>
      {variant === "solid" ? (
        <>
          <circle cx="527.5" cy="650" r="118" fill="currentColor" />
          <circle cx="472.5" cy="350" r="118" fill="currentColor" />
        </>
      ) : (
        <g fill="none" stroke="currentColor" strokeWidth="71">
          <circle cx="527.5" cy="650" r="82.5" />
          <circle cx="472.5" cy="350" r="82.5" />
        </g>
      )}
    </svg>
  );
}
