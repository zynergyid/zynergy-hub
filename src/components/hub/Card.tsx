import Link from "next/link";
import { cn } from "@/lib/cn";

export function Card({
  id,
  title,
  action,
  className,
  children,
}: {
  id?: string;
  title?: string;
  action?: { label: string; href: string };
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,27,51,0.04)]", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="text-base font-bold">{title}</h2>}
          {action && (
            <Link href={action.href} className="text-sm font-semibold text-primary hover:underline">
              {action.label}
            </Link>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
