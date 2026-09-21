import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPayloadClient } from "@/lib/payload";
import { canEditVault, getSessionUser } from "@/lib/session";
import { getUserOptions } from "@/lib/projects";
import { accountLoginMethodLabel, accountPlatformLabel, accountVisibilityLabel, hasOwnPassword } from "@/lib/options";
import { canRevealPassword, holderIdsOf } from "@/lib/accounts";
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
  const holderNames = users.filter((u) => holderIdsOf(account).includes(u.id)).map((u) => u.name);
  const own = hasOwnPassword(account.loginMethod);
  const others = await payload.find({ collection: "accounts", limit: 200, depth: 0, sort: "name" });
  const viaId = typeof account.viaAccount === "object" && account.viaAccount ? account.viaAccount.id : account.viaAccount;
  const via = others.docs.find((a) => a.id === viaId) ?? null;
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
      <Card title="Cara masuk">
        {!own ? (
          <>
            <p className="text-sm font-semibold">{accountLoginMethodLabel.get(account.loginMethod)}</p>
            <p className="mt-1 text-sm text-muted">
              Akun ini tidak punya password sendiri.{" "}
              {via ? (
                <>Yang membuka adalah <Link href={`/vault/accounts/${via.id}`} className="font-semibold text-primary hover:underline">{accountPlatformLabel.get(via.platform)} · {via.name}</Link>, jadi amankan akun itu.</>
              ) : (
                "Pilih akun yang dipakai untuk masuk di bagian bawah supaya jelas mana kunci sebenarnya."
              )}
            </p>
          </>
        ) : hasPassword ? (
          allowed ? <RevealSecret id={account.id} /> : <p className="text-sm text-muted">Hanya admin dan pemegang akun{holderNames.length ? ` (${holderNames.join(", ")})` : ""} yang bisa melihat password ini.</p>
        ) : (
          <p className="text-sm text-muted">Belum ada password tersimpan di Hub{account.passwordWhere ? `; disimpan di ${account.passwordWhere}` : ""}.</p>
        )}
        {own && <p className="mt-2 text-xs text-muted">Terlihat oleh: {accountVisibilityLabel.get(account.visibility) ?? "semua anggota tim"}.</p>}
      </Card>
      <AccountForm account={safe} users={users} accounts={others.docs.map((a) => ({ id: a.id, name: `${accountPlatformLabel.get(a.platform)} · ${a.name}` }))} hasPassword={hasPassword} readOnly={!canEditVault(user)} />
      <ActivityCard user={user} collection="accounts" docId={account.id} />
    </div>
  );
}
