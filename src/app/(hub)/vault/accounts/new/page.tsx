import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { canEditVault, getSessionUser } from "@/lib/session";
import { getUserOptions } from "@/lib/projects";
import { PageHeader } from "@/components/hub/PageHeader";
import { AccountForm } from "../AccountForm";

export const metadata: Metadata = { title: "Catat akun" };
export const dynamic = "force-dynamic";

export default async function NewAccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!canEditVault(user)) redirect("/vault/accounts");
  const users = await getUserOptions();
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Catat akun" subtitle="Akun yang belum dibuat juga dicatat, dengan status Belum dibuat, supaya jadi daftar kerja." />
      <AccountForm users={users} />
    </div>
  );
}
