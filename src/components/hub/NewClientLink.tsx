import Link from "next/link";
import { Plus } from "lucide-react";
import type { Unit } from "@/lib/options";

/**
 * "Klien baru" beside a client picker: opens the client form with the unit
 * preselected and, once saved, comes back to `next` with `?client=<id>`.
 */
export function NewClientLink({ unit, next }: { unit: Unit; next: string }) {
  return (
    <Link href={`/clients/new?unit=${unit}&next=${encodeURIComponent(next)}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
      <Plus className="size-3.5" />
      Klien baru
    </Link>
  );
}
