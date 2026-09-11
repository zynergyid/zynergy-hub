import type { UnitFilter } from "@/lib/finance";
import { units, type Unit } from "@/lib/options";
import { buildHref, type Search } from "@/lib/search";
import { SegmentedLinks } from "./SegmentedLinks";

/** Semua first, then the units this person may see. Hidden when there is only one unit. */
export function UnitTabs({ path, base = {}, unit, allowed }: { path: string; base?: Search; unit: UnitFilter; allowed: Unit[] }) {
  if (allowed.length < 2) return null;
  return (
    <SegmentedLinks
      ariaLabel="Unit bisnis"
      segments={[
        { label: "Semua", href: buildHref(path, base, { unit: undefined }), active: unit === "semua" },
        ...units
          .filter((u) => allowed.includes(u.value))
          .map((u) => ({ label: u.label, href: buildHref(path, base, { unit: u.value }), active: unit === u.value })),
      ]}
    />
  );
}
