import { cn } from "@/lib/cn";

const palette = [
  "bg-primary-soft text-primary-dark",
  "bg-secondary-soft text-secondary-dark",
  "bg-amber-50 text-amber-700",
  "bg-fuchsia-50 text-fuchsia-700",
  "bg-sky-50 text-sky-700",
];

/** A person's photo when they set one, otherwise their initials on a stable colour. */
export function Avatar({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={cn("size-9 shrink-0 rounded-full object-cover", className)} />;
  }
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const tone = palette[name.length % palette.length];
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-xs font-extrabold", tone, className)}>
      {initials || "?"}
    </span>
  );
}
