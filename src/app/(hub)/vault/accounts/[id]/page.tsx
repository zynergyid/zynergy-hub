import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPayloadClient } from "@/lib/payload";
import { canEditVault, getSessionUser } from "@/lib/session";
import { getUserOptions } from "@/lib/projects";
import { accountPlatformLabel } from "@/lib/options";
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
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/vault/accounts" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
        <ArrowLeft className="size-4" />
        Akun digital
      </Link>
      <PageHeader title={`${accountPlatformLabel.get(account.platform)} · ${account.name}`} />
      <AccountForm account={account} users={users} readOnly={!canEditVault(user)} />
      <ActivityCard user={user} collection="accounts" docId={account.id} />
    </div>
  );
}
