import { SegmentedLinks } from "@/components/hub/SegmentedLinks";

/** Dokumen | Akun digital, shared by the vault pages. */
export function VaultTabs({ active }: { active: "documents" | "accounts" }) {
  return (
    <SegmentedLinks
      ariaLabel="Bagian"
      segments={[
        { label: "Dokumen", href: "/vault", active: active === "documents" },
        { label: "Akun digital", href: "/vault/accounts", active: active === "accounts" },
      ]}
    />
  );
}
