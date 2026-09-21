import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink, Plus } from "lucide-react";
import { getPayloadClient } from "@/lib/payload";
import { canEditVault, getSessionUser } from "@/lib/session";
import { accountPlatformLabel, accountStatusLabel } from "@/lib/options";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/hub/EmptyState";
import { PageHeader } from "@/components/hub/PageHeader";
import { buttonPrimary } from "@/components/hub/form";
import { VaultTabs } from "../VaultTabs";

export const metadata: Metadata = { title: "Akun digital" };
export const dynamic = "force-dynamic";

const statusTone: Record<string, string> = { belum: "bg-amber-50 text-amber-700", aktif: "bg-secondary-soft text-secondary-dark", ditinggalkan: "bg-surface-soft text-muted" };

/** Who holds which company account. The open items ("belum dibuat") double as the to-do list. */
export default async function AccountsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const editable = canEditVault(user);
  const payload = await getPayloadClient();
  const { docs } = await payload.find({ collection: "accounts", limit: 200, depth: 1, sort: "status" });
  const pending = docs.filter((a) => a.status === "belum").length;
  return (
    <div className="space-y-5">
      <PageHeader title="Akun digital" subtitle={`${docs.length} akun tercatat${pending ? `, ${pending} belum dibuat` : ""}. Siapa pemegangnya dan cara masuk kembali; password tetap di pengelola password.`}>
        <VaultTabs active="accounts" />
        {editable && (
          <Link href="/vault/accounts/new" className={buttonPrimary}>
            <Plus className="size-4" />
            Catat akun
          </Link>
        )}
      </PageHeader>
      {docs.length === 0 ? (
        <EmptyState title="Belum ada akun tercatat." hint={editable ? "Mulai dari WhatsApp Business, Google Business Profile, LinkedIn, Instagram, dan GitHub." : "Minta yang mengelola Brankas mencatatnya."} />
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-line bg-white divide-y divide-line">
          {docs.map((a) => {
            const holder = typeof a.holder === "object" && a.holder ? a.holder.name : null;
            return (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/vault/accounts/${a.id}`} className="block truncate text-sm font-semibold hover:text-primary">
                    {accountPlatformLabel.get(a.platform)} · {a.name}
                  </Link>
                  <p className="truncate text-xs text-muted">
                    {[holder ? `pemegang ${holder}` : "belum ada pemegang", a.loginEmail, a.twoFactor ? `2FA: ${a.twoFactor}` : null].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {a.url && (
                  <a href={a.url} target="_blank" rel="noopener noreferrer" aria-label="Buka" className="rounded-lg p-1.5 text-muted hover:bg-surface-soft hover:text-primary">
                    <ExternalLink className="size-4" />
                  </a>
                )}
                <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold", statusTone[a.status])}>{accountStatusLabel.get(a.status)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
