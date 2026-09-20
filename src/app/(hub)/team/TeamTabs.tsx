import { SegmentedLinks } from "@/components/hub/SegmentedLinks";

/** Anggota | Hak akses | Ruang kerja, shared by the three team pages. */
export function TeamTabs({ active }: { active: "team" | "access" | "workspace" }) {
  return (
    <SegmentedLinks
      ariaLabel="Bagian"
      segments={[
        { label: "Anggota", href: "/team", active: active === "team" },
        { label: "Hak akses", href: "/access", active: active === "access" },
        { label: "Ruang kerja", href: "/workspace", active: active === "workspace" },
      ]}
    />
  );
}
