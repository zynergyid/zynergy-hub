"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Select } from "@/components/hub/Select";

interface Option {
  label: string;
  value: string;
}

/** Two selects that filter as soon as a value is picked; grows to any number of people or sections. */
export function ActivityFilters({ people, sections, actorId, section }: { people: Option[]; sections: Option[]; actorId?: string; section?: string }) {
  const router = useRouter();
  const go = (patch: { orang?: string; bagian?: string }) => {
    const params = new URLSearchParams();
    const orang = patch.orang ?? actorId;
    const bagian = patch.bagian ?? section;
    if (orang && orang !== "0") params.set("orang", orang);
    if (bagian && bagian !== "0") params.set("bagian", bagian);
    const qs = params.toString();
    router.push(qs ? `/activity?${qs}` : "/activity");
  };
  const active = Boolean(actorId || section);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-48">
        <Select name="orang" size="compact" value={actorId ?? "0"} onValueChange={(v) => go({ orang: v })} options={[{ label: "Semua orang", value: "0" }, ...people]} />
      </div>
      <div className="w-48">
        <Select name="bagian" size="compact" value={section ?? "0"} onValueChange={(v) => go({ bagian: v })} options={[{ label: "Semua bagian", value: "0" }, ...sections]} />
      </div>
      {active && (
        <Link href="/activity" className="text-xs font-semibold text-primary hover:underline">Hapus filter</Link>
      )}
    </div>
  );
}
