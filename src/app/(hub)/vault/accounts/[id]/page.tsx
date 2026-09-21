import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPayloadClient } from "@/lib/payload";
import { canEditVault, getSessionUser } from "@/lib/session";
import { getUserOptions } from "@/lib/projects";
import { accountPlatformLabel, accountVisibilityLabel } from "@/lib/options";
import { canRevealPassword, holderIdOf } from "@/lib/accounts";
import { Card } from "@/components/hub/Card";
import { PlatformTile } from "@/components/hub/PlatformIcon";
import { RevealSecret } from "../RevealSecret";
import { PageHeader } from "@/components/hub/PageHeader";
import { ActivityCard } from "@/components/hub/ActivityCard";
import { AccountForm } from "../AccountForm";

export const metadata: Metadata = { title: "Akun digital" };
export const dynamic = "force-dynamic";

export default async function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const id = Number((await params).id);
  const payload = await getPayloadClient();
  const account = id ? await payload.findByID({ collection: "accounts", id, depth: 0, disableErrors: true }) : null;
  if (!account) notFound();
  const users = await getUserOptions();
  // The ciphertext stays on the server; the browser only learns whether a password exists.
  const { passwordEnc, ...safe } = account;
  const hasPassword = Boolean(passwordEnc);
  const allowed = canRevealPassword(user, account);
  const holder = users.find((u) => u.id === holderIdOf(account))?.name;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/vault/accounts" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
        <ArrowLeft className="size-4" />
        Akun digital
      </Link>
      <div className="flex items-center gap-3">
        <PlatformTile platform={account.platform} className="size-12" />
        <PageHeader title={`${accountPlatformLabel.get(account.platform)} · ${account.name}`} />
      </div>
      <Card title="Password">
        {hasPassword ? (
          allowed ? <RevealSecret id={account.id} /> : <p className="text-sm text-muted">Hanya admin dan pemegang akun{holder ? ` (${holder})` : ""} yang bisa melihat password ini.</p>
        ) : (
          <p className="text-sm text-muted">Belum ada password tersimpan di Hub{account.passwordWhere ? `; disimpan di ${account.passwordWhere}` : ""}.</p>
        )}
        <p className="mt-2 text-xs text-muted">Terlihat oleh: {accountVisibilityLabel.get(account.visibility) ?? "semua anggota tim"}.</p>
      </Card>
      <AccountForm account={safe} users={users} hasPassword={hasPassword} readOnly={!canEditVault(user)} />
      <ActivityCard user={user} collection="accounts" docId={account.id} />
    </div>
  );
}
